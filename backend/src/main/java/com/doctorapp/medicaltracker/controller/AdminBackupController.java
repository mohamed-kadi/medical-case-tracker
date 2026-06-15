package com.doctorapp.medicaltracker.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Principal;
import java.util.List;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.doctorapp.medicaltracker.dto.BackupCreateResponse;
import com.doctorapp.medicaltracker.dto.BackupFileResponse;
import com.doctorapp.medicaltracker.dto.BackupRestoreResponse;
import com.doctorapp.medicaltracker.dto.BackupStatusResponse;
import com.doctorapp.medicaltracker.service.BackupService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/backups")
@RequiredArgsConstructor
public class AdminBackupController {

    private final BackupService backupService;

    @GetMapping("/status")
    public ResponseEntity<BackupStatusResponse> getStatus() {
        return ResponseEntity.ok(backupService.getStatus());
    }

    @GetMapping
    public ResponseEntity<List<BackupFileResponse>> listBackups() {
        return ResponseEntity.ok(backupService.listBackups());
    }

    @PostMapping
    public ResponseEntity<BackupCreateResponse> createBackup(Principal principal) {
        return ResponseEntity.ok(backupService.createBackup(resolveUsername(principal)));
    }

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> downloadBackup(@PathVariable String fileName) throws Exception {
        Path backupFile = backupService.resolveBackupFile(fileName);
        Resource resource = new FileSystemResource(backupFile);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(Files.size(backupFile))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(backupFile.getFileName().toString()).build().toString())
                .body(resource);
    }

    @PostMapping("/restore")
    public ResponseEntity<BackupRestoreResponse> restoreBackup(
            @RequestParam("file") MultipartFile file,
            @RequestParam("confirmation") String confirmation,
            Principal principal) {
        BackupRestoreResponse response = backupService.restoreBackup(file, confirmation, resolveUsername(principal));
        return ResponseEntity.ok(response);
    }

    private String resolveUsername(Principal principal) {
        return principal == null ? "system" : principal.getName();
    }
}
