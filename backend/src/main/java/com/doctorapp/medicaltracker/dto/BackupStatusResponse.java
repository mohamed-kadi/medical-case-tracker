package com.doctorapp.medicaltracker.dto;

public record BackupStatusResponse(
        String backupDirectory,
        String imageStorageDirectory,
        BackupFileResponse latestBackup,
        String restoreConfirmationText) {
}
