package com.doctorapp.medicaltracker.service.impl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
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
        "image/tiff",
        "image/webp",
        "image/heic",
        "image/heif"
    );

    @Override
    public void validateImage(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new ImageValidationException("File cannot be empty");
        }

        // Check file size
        long maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
        if (file.getSize() > maxFileSizeBytes) {
            throw new ImageValidationException("File size exceeds maximum limit of " + maxFileSizeMB + "MB");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new ImageValidationException("Invalid file type. Allowed types: " + ALLOWED_MIME_TYPES);
        }

        // Additional image content validation
        try {
            if (requiresSignatureValidation(contentType)) {
                validateSignature(file, contentType);
                return;
            }
            // Try to read the image to ensure it's a valid image file
            if (ImageIO.read(file.getInputStream()) == null) {
                throw new ImageValidationException("Invalid image file");
            }
        } catch (IOException | IllegalArgumentException e) {
            throw new ImageValidationException("Invalid image file");
        }
    }

    private boolean requiresSignatureValidation(String contentType) {
        return "image/webp".equals(contentType)
                || "image/heic".equals(contentType)
                || "image/heif".equals(contentType);
    }

    private void validateSignature(MultipartFile file, String contentType) throws IOException {
        byte[] header = file.getInputStream().readNBytes(16);
        if ("image/webp".equals(contentType) && !isWebp(header)) {
            throw new ImageValidationException("Invalid WEBP image file");
        }
        if (("image/heic".equals(contentType) || "image/heif".equals(contentType)) && !isHeicOrHeif(header)) {
            throw new ImageValidationException("Invalid HEIC/HEIF image file");
        }
    }

    private boolean isWebp(byte[] header) {
        return header.length >= 12
                && header[0] == 'R'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == 'F'
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P';
    }

    private boolean isHeicOrHeif(byte[] header) {
        if (header.length < 12) {
            return false;
        }
        boolean hasFtyp = header[4] == 'f'
                && header[5] == 't'
                && header[6] == 'y'
                && header[7] == 'p';
        if (!hasFtyp) {
            return false;
        }
        String brand = new String(header, 8, 4, StandardCharsets.US_ASCII);
        return "heic".equals(brand)
                || "heix".equals(brand)
                || "hevc".equals(brand)
                || "hevx".equals(brand)
                || "mif1".equals(brand)
                || "msf1".equals(brand);
    }
}
