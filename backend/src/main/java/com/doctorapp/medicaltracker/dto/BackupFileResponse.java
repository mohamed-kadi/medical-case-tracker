package com.doctorapp.medicaltracker.dto;

import java.time.LocalDateTime;

public record BackupFileResponse(
        String fileName,
        LocalDateTime createdAt,
        long sizeBytes) {
}
