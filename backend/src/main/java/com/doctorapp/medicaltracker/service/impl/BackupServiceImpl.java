package com.doctorapp.medicaltracker.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.FileTime;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.doctorapp.medicaltracker.dto.BackupCreateResponse;
import com.doctorapp.medicaltracker.dto.BackupFileResponse;
import com.doctorapp.medicaltracker.dto.BackupRestoreResponse;
import com.doctorapp.medicaltracker.dto.BackupStatusResponse;
import com.doctorapp.medicaltracker.exception.BackupOperationException;
import com.doctorapp.medicaltracker.service.AuditEventService;
import com.doctorapp.medicaltracker.service.BackupService;
import com.doctorapp.medicaltracker.service.DatabaseBackupCommandRunner;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class BackupServiceImpl implements BackupService {

    private static final String BACKUP_PREFIX = "medicaltracker-backup-";
    private static final String BACKUP_EXTENSION = ".zip";
    private static final String RESTORE_CONFIRMATION = "RESTORE";
    private static final DateTimeFormatter FILE_TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final DatabaseBackupCommandRunner commandRunner;
    private final AuditEventService auditEventService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final String databaseUrl;
    private final String databaseUsername;
    private final String databasePassword;
    private final Path backupDirectory;
    private final Path imageStorageDirectory;

    public BackupServiceImpl(
            DatabaseBackupCommandRunner commandRunner,
            AuditEventService auditEventService,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            @Value("${spring.datasource.url}") String databaseUrl,
            @Value("${spring.datasource.username}") String databaseUsername,
            @Value("${spring.datasource.password:}") String databasePassword,
            @Value("${app.backup.storage.path:./var/backups}") String backupStoragePath,
            @Value("${app.image.storage.path}") String imageStoragePath) {
        this.commandRunner = commandRunner;
        this.auditEventService = auditEventService;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.databaseUrl = databaseUrl;
        this.databaseUsername = databaseUsername;
        this.databasePassword = databasePassword;
        this.backupDirectory = Paths.get(backupStoragePath).toAbsolutePath().normalize();
        this.imageStorageDirectory = Paths.get(imageStoragePath).toAbsolutePath().normalize();
    }

    @Override
    public BackupStatusResponse getStatus() {
        return new BackupStatusResponse(
                backupDirectory.toString(),
                imageStorageDirectory.toString(),
                listBackups().stream().findFirst().orElse(null),
                RESTORE_CONFIRMATION);
    }

    @Override
    public List<BackupFileResponse> listBackups() {
        ensureDirectory(backupDirectory);
        try (Stream<Path> stream = Files.list(backupDirectory)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(this::isBackupFile)
                    .map(this::toBackupFileResponse)
                    .sorted(Comparator.comparing(BackupFileResponse::createdAt).reversed())
                    .toList();
        } catch (IOException ex) {
            throw new BackupOperationException("Failed to list backups", ex);
        }
    }

    @Override
    public BackupCreateResponse createBackup(String requestedBy) {
        ensureDirectory(backupDirectory);
        LocalDateTime createdAt = LocalDateTime.now();
        String fileName = BACKUP_PREFIX + FILE_TIMESTAMP.format(createdAt) + BACKUP_EXTENSION;
        Path finalZip = backupDirectory.resolve(fileName).normalize();

        Path workDirectory = createTempDirectory("medicaltracker-backup-work-");
        Path databaseDump = workDirectory.resolve("database.sql");
        Path manifestFile = workDirectory.resolve("manifest.json");
        Path temporaryZip = workDirectory.resolve(fileName);

        try {
            PostgresConnectionDetails connectionDetails = PostgresConnectionDetails.fromJdbcUrl(databaseUrl);
            commandRunner.dump(connectionDetails, databaseUsername, databasePassword, databaseDump);

            long imageFileCount = countImageFiles();
            BackupManifest manifest = new BackupManifest(
                    1,
                    createdAt,
                    requestedBy,
                    connectionDetails.databaseName(),
                    imageFileCount);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(manifestFile.toFile(), manifest);

            createZip(temporaryZip, manifestFile, databaseDump);
            Files.move(temporaryZip, finalZip, StandardCopyOption.REPLACE_EXISTING);

            long sizeBytes = Files.size(finalZip);
            auditEventService.recordEvent("SYSTEM", 0L, "BACKUP_CREATED", "fileName=" + fileName);
            return new BackupCreateResponse(fileName, createdAt, sizeBytes, imageFileCount);
        } catch (IOException ex) {
            throw new BackupOperationException("Failed to create backup", ex);
        } finally {
            deleteRecursively(workDirectory);
        }
    }

    @Override
    public Path resolveBackupFile(String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("/") || fileName.contains("\\")) {
            throw new BackupOperationException("Invalid backup file name");
        }

        Path backupFile = backupDirectory.resolve(fileName).normalize();
        if (!backupFile.startsWith(backupDirectory) || !Files.isRegularFile(backupFile) || !isBackupFile(backupFile)) {
            throw new BackupOperationException("Backup file was not found");
        }
        return backupFile;
    }

    @Override
    public BackupRestoreResponse restoreBackup(MultipartFile backupFile, String confirmation, String requestedBy) {
        if (!RESTORE_CONFIRMATION.equals(confirmation)) {
            throw new BackupOperationException("Restore confirmation must be RESTORE");
        }
        if (backupFile == null || backupFile.isEmpty()) {
            throw new BackupOperationException("Backup file is required");
        }

        BackupCreateResponse safetyBackup = createBackup("pre-restore:" + requestedBy);
        Path workDirectory = createTempDirectory("medicaltracker-restore-work-");
        Path uploadedZip = workDirectory.resolve("uploaded-backup.zip");
        Path extractedDirectory = workDirectory.resolve("extracted");

        try {
            Files.copy(backupFile.getInputStream(), uploadedZip, StandardCopyOption.REPLACE_EXISTING);
            unzip(uploadedZip, extractedDirectory);
            Path databaseDump = extractedDirectory.resolve("database.sql").normalize();
            if (!databaseDump.startsWith(extractedDirectory) || !Files.isRegularFile(databaseDump)) {
                throw new BackupOperationException("Backup ZIP is missing database.sql");
            }

            PostgresConnectionDetails connectionDetails = PostgresConnectionDetails.fromJdbcUrl(databaseUrl);
            commandRunner.restore(connectionDetails, databaseUsername, databasePassword, databaseDump);
            restoreImageDirectory(extractedDirectory.resolve("medical-images"));
            repairImagePaths();

            LocalDateTime restoredAt = LocalDateTime.now();
            auditEventService.recordEvent(
                    "SYSTEM",
                    0L,
                    "BACKUP_RESTORED",
                    "fileName=" + backupFile.getOriginalFilename() + ",preRestoreBackup=" + safetyBackup.fileName());
            return new BackupRestoreResponse("Backup restored", restoredAt, safetyBackup.fileName());
        } catch (IOException ex) {
            throw new BackupOperationException("Failed to restore backup", ex);
        } finally {
            deleteRecursively(workDirectory);
        }
    }

    private void createZip(Path zipFile, Path manifestFile, Path databaseDump) throws IOException {
        try (ZipOutputStream outputStream = new ZipOutputStream(Files.newOutputStream(zipFile))) {
            addFile(outputStream, manifestFile, "manifest.json");
            addFile(outputStream, databaseDump, "database.sql");

            if (Files.isDirectory(imageStorageDirectory)) {
                try (Stream<Path> stream = Files.walk(imageStorageDirectory)) {
                    for (Path path : stream.filter(Files::isRegularFile).toList()) {
                        Path relativePath = imageStorageDirectory.relativize(path);
                        addFile(outputStream, path, "medical-images/" + relativePath.toString().replace('\\', '/'));
                    }
                }
            }
        }
    }

    private void addFile(ZipOutputStream outputStream, Path source, String entryName) throws IOException {
        outputStream.putNextEntry(new ZipEntry(entryName));
        Files.copy(source, outputStream);
        outputStream.closeEntry();
    }

    private void unzip(Path zipFile, Path targetDirectory) throws IOException {
        ensureDirectory(targetDirectory);
        try (ZipInputStream inputStream = new ZipInputStream(Files.newInputStream(zipFile))) {
            ZipEntry entry;
            while ((entry = inputStream.getNextEntry()) != null) {
                Path target = targetDirectory.resolve(entry.getName()).normalize();
                if (!target.startsWith(targetDirectory)) {
                    throw new BackupOperationException("Backup ZIP contains an unsafe path");
                }
                if (entry.isDirectory()) {
                    ensureDirectory(target);
                } else {
                    ensureDirectory(target.getParent());
                    Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
                }
                inputStream.closeEntry();
            }
        }
    }

    private void restoreImageDirectory(Path restoredImagesDirectory) throws IOException {
        Path currentImageDirectory = imageStorageDirectory;
        Path parent = currentImageDirectory.getParent();
        if (parent != null) {
            ensureDirectory(parent);
        }

        if (Files.exists(currentImageDirectory)) {
            Path safetyCopy = currentImageDirectory.resolveSibling(
                    currentImageDirectory.getFileName() + ".before-restore-" + FILE_TIMESTAMP.format(LocalDateTime.now()));
            Files.move(currentImageDirectory, safetyCopy, StandardCopyOption.REPLACE_EXISTING);
        }

        ensureDirectory(currentImageDirectory);
        if (Files.isDirectory(restoredImagesDirectory)) {
            copyDirectory(restoredImagesDirectory, currentImageDirectory);
        }
    }

    private void copyDirectory(Path sourceDirectory, Path targetDirectory) throws IOException {
        try (Stream<Path> stream = Files.walk(sourceDirectory)) {
            for (Path source : stream.toList()) {
                Path target = targetDirectory.resolve(sourceDirectory.relativize(source)).normalize();
                if (!target.startsWith(targetDirectory)) {
                    throw new BackupOperationException("Image restore target is unsafe");
                }
                if (Files.isDirectory(source)) {
                    ensureDirectory(target);
                } else {
                    ensureDirectory(target.getParent());
                    Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        }
    }

    private void repairImagePaths() {
        List<ImagePathRow> rows = jdbcTemplate.query(
                "select id, file_name from medical_images",
                (ResultSet rs, int rowNum) -> toImagePathRow(rs));
        for (ImagePathRow row : rows) {
            Path path = imageStorageDirectory.resolve(row.fileName()).normalize();
            jdbcTemplate.update("update medical_images set path = ? where id = ?", path.toString(), row.id());
        }
    }

    private ImagePathRow toImagePathRow(ResultSet rs) throws SQLException {
        return new ImagePathRow(rs.getLong("id"), rs.getString("file_name"));
    }

    private long countImageFiles() throws IOException {
        if (!Files.isDirectory(imageStorageDirectory)) {
            return 0;
        }
        try (Stream<Path> stream = Files.walk(imageStorageDirectory)) {
            return stream.filter(Files::isRegularFile).count();
        }
    }

    private BackupFileResponse toBackupFileResponse(Path path) {
        try {
            FileTime fileTime = Files.getLastModifiedTime(path);
            LocalDateTime createdAt = LocalDateTime.ofInstant(fileTime.toInstant(), ZoneId.systemDefault());
            return new BackupFileResponse(path.getFileName().toString(), createdAt, Files.size(path));
        } catch (IOException ex) {
            throw new BackupOperationException("Failed to read backup metadata", ex);
        }
    }

    private boolean isBackupFile(Path path) {
        String fileName = path.getFileName().toString();
        return fileName.startsWith(BACKUP_PREFIX) && fileName.endsWith(BACKUP_EXTENSION);
    }

    private Path createTempDirectory(String prefix) {
        try {
            return Files.createTempDirectory(prefix);
        } catch (IOException ex) {
            throw new BackupOperationException("Failed to create temporary backup directory", ex);
        }
    }

    private void ensureDirectory(Path directory) {
        try {
            Files.createDirectories(directory);
        } catch (IOException ex) {
            throw new BackupOperationException("Failed to create directory " + directory, ex);
        }
    }

    private void deleteRecursively(Path path) {
        if (path == null || !Files.exists(path)) {
            return;
        }
        try (Stream<Path> stream = Files.walk(path)) {
            stream.sorted(Comparator.reverseOrder()).forEach(this::deleteIfExists);
        } catch (IOException ignored) {
            // Temporary cleanup should not hide the original backup/restore result.
        }
    }

    private void deleteIfExists(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // Best-effort cleanup.
        }
    }

    private record BackupManifest(
            int backupVersion,
            LocalDateTime createdAt,
            String createdBy,
            String databaseName,
            long imageFileCount) {
    }

    private record ImagePathRow(Long id, String fileName) {
    }
}
