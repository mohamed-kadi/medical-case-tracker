package com.doctorapp.medicaltracker.dto;

import java.time.LocalDateTime;

public record BackupCreateResponse(
        String fileName,
        LocalDateTime createdAt,
        long sizeBytes,
        long imageFileCount) {
}
