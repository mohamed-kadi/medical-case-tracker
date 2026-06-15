package com.doctorapp.medicaltracker.service;

import java.nio.file.Path;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.doctorapp.medicaltracker.dto.BackupCreateResponse;
import com.doctorapp.medicaltracker.dto.BackupFileResponse;
import com.doctorapp.medicaltracker.dto.BackupRestoreResponse;
import com.doctorapp.medicaltracker.dto.BackupStatusResponse;

public interface BackupService {

    BackupStatusResponse getStatus();

    List<BackupFileResponse> listBackups();

    BackupCreateResponse createBackup(String requestedBy);

    Path resolveBackupFile(String fileName);

    BackupRestoreResponse restoreBackup(MultipartFile backupFile, String confirmation, String requestedBy);
}
