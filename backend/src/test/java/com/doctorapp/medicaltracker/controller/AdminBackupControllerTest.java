package com.doctorapp.medicaltracker.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.dto.BackupCreateResponse;
import com.doctorapp.medicaltracker.dto.BackupFileResponse;
import com.doctorapp.medicaltracker.dto.BackupRestoreResponse;
import com.doctorapp.medicaltracker.dto.BackupStatusResponse;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;
import com.doctorapp.medicaltracker.service.BackupService;

@WebMvcTest(AdminBackupController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminBackupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BackupService backupService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @TempDir
    Path tempDir;

    @Test
    void getStatus_returnsBackupStatus() throws Exception {
        BackupFileResponse latestBackup = new BackupFileResponse(
                "medicaltracker-backup-20260603-120000.zip",
                LocalDateTime.of(2026, 6, 3, 12, 0),
                1024L);
        when(backupService.getStatus()).thenReturn(new BackupStatusResponse(
                "/clinic/backups",
                "/clinic/images",
                latestBackup,
                "RESTORE"));

        mockMvc.perform(get("/api/admin/backups/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.backupDirectory").value("/clinic/backups"))
                .andExpect(jsonPath("$.imageStorageDirectory").value("/clinic/images"))
                .andExpect(jsonPath("$.latestBackup.fileName").value("medicaltracker-backup-20260603-120000.zip"))
                .andExpect(jsonPath("$.restoreConfirmationText").value("RESTORE"));
    }

    @Test
    void listBackups_returnsBackupFiles() throws Exception {
        when(backupService.listBackups()).thenReturn(List.of(new BackupFileResponse(
                "medicaltracker-backup-20260603-120000.zip",
                LocalDateTime.of(2026, 6, 3, 12, 0),
                1024L)));

        mockMvc.perform(get("/api/admin/backups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].fileName").value("medicaltracker-backup-20260603-120000.zip"));
    }

    @Test
    void createBackup_returnsCreatedBackup() throws Exception {
        when(backupService.createBackup("system")).thenReturn(new BackupCreateResponse(
                "medicaltracker-backup-20260603-120000.zip",
                LocalDateTime.of(2026, 6, 3, 12, 0),
                2048L,
                3L));

        mockMvc.perform(post("/api/admin/backups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("medicaltracker-backup-20260603-120000.zip"))
                .andExpect(jsonPath("$.imageFileCount").value(3));
    }

    @Test
    void downloadBackup_returnsZipResource() throws Exception {
        Path backup = tempDir.resolve("medicaltracker-backup-20260603-120000.zip");
        Files.writeString(backup, "zip-data");
        when(backupService.resolveBackupFile("medicaltracker-backup-20260603-120000.zip")).thenReturn(backup);

        mockMvc.perform(get("/api/admin/backups/medicaltracker-backup-20260603-120000.zip"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"medicaltracker-backup-20260603-120000.zip\""))
                .andExpect(content().bytes("zip-data".getBytes()));
    }

    @Test
    void restoreBackup_returnsRestoreSummary() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "medicaltracker-backup-20260603-120000.zip",
                "application/zip",
                "zip-data".getBytes());
        when(backupService.restoreBackup(file, "RESTORE", "system")).thenReturn(new BackupRestoreResponse(
                "Backup restored",
                LocalDateTime.of(2026, 6, 3, 12, 30),
                "medicaltracker-backup-20260603-115900.zip"));

        mockMvc.perform(multipart("/api/admin/backups/restore")
                .file(file)
                .param("confirmation", "RESTORE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Backup restored"))
                .andExpect(jsonPath("$.preRestoreBackupFileName").value("medicaltracker-backup-20260603-115900.zip"));
    }
}
