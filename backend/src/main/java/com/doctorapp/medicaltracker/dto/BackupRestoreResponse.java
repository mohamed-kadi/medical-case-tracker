package com.doctorapp.medicaltracker.dto;

import java.time.LocalDateTime;

public record BackupRestoreResponse(
        String message,
        LocalDateTime restoredAt,
        String preRestoreBackupFileName) {
}
