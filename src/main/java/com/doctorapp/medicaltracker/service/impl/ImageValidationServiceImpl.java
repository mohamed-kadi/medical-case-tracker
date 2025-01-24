package com.doctorapp.medicaltracker.service.impl;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import com.doctorapp.medicaltracker.exception.ImageValidationException;
import com.doctorapp.medicaltracker.service.ImageValidationService;

@Service
public class ImageValidationServiceImpl implements ImageValidationService {


    @Value("${app.image.max-size-mb:10}")
    private long maxFileSizeMB;

    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
        "image/jpeg", 
        "image/png", 
        "image/gif", 
        "image/bmp", 
        "image/tiff"
    );

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    @Override
    public void validateImage(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new ImageValidationException("File cannot be empty");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ImageValidationException("File size exceeds maximum limit of " + maxFileSizeMB + "MB");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new ImageValidationException("Invalid file type. Allowed types: " + ALLOWED_MIME_TYPES);
        }

        // Additional image content validation
        try {
            // Try to read the image to ensure it's a valid image file
            ImageIO.read(file.getInputStream());
        } catch (IOException | IllegalArgumentException e) {
            throw new ImageValidationException("Invalid image file");
        }
    }
}
