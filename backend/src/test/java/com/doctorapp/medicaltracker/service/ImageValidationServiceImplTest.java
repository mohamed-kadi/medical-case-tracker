package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import com.doctorapp.medicaltracker.exception.ImageValidationException;
import com.doctorapp.medicaltracker.service.impl.ImageValidationServiceImpl;

class ImageValidationServiceImplTest {

    private static final String ONE_BY_ONE_PNG_BASE64 =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6W2WQAAAAASUVORK5CYII=";

    private ImageValidationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ImageValidationServiceImpl();
        ReflectionTestUtils.setField(service, "maxFileSizeMB", 10L);
    }

    @Test
    void validateImage_acceptsPngFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "scan.png",
                "image/png",
                Base64.getDecoder().decode(ONE_BY_ONE_PNG_BASE64));

        assertDoesNotThrow(() -> service.validateImage(file));
    }

    @Test
    void validateImage_rejectsUnsupportedMimeType() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "vector.svg",
                "image/svg+xml",
                "<svg></svg>".getBytes());

        assertThrows(ImageValidationException.class, () -> service.validateImage(file));
    }

    @Test
    void validateImage_rejectsFileLargerThanConfiguredLimit() {
        ReflectionTestUtils.setField(service, "maxFileSizeMB", 1L);
        byte[] payload = new byte[(1024 * 1024) + 1];
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "large.png",
                "image/png",
                payload);

        assertThrows(ImageValidationException.class, () -> service.validateImage(file));
    }

    @Test
    void validateImage_acceptsWebpWhenSignatureIsValid() {
        byte[] webpBytes = new byte[] {
                'R', 'I', 'F', 'F',
                0x00, 0x00, 0x00, 0x00,
                'W', 'E', 'B', 'P',
                'V', 'P', '8', ' '
        };
        MockMultipartFile file = new MockMultipartFile("file", "photo.webp", "image/webp", webpBytes);

        assertDoesNotThrow(() -> service.validateImage(file));
    }

    @Test
    void validateImage_acceptsHeicWhenSignatureIsValid() {
        byte[] heicBytes = new byte[] {
                0x00, 0x00, 0x00, 0x18,
                'f', 't', 'y', 'p',
                'h', 'e', 'i', 'c',
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile file = new MockMultipartFile("file", "photo.heic", "image/heic", heicBytes);

        assertDoesNotThrow(() -> service.validateImage(file));
    }

    @Test
    void validateImage_rejectsHeicWhenSignatureIsInvalid() {
        byte[] invalidHeicBytes = new byte[] {
                0x00, 0x00, 0x00, 0x18,
                'f', 't', 'y', 'p',
                'j', 'p', '2', ' ',
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile file = new MockMultipartFile("file", "photo.heic", "image/heic", invalidHeicBytes);

        assertThrows(ImageValidationException.class, () -> service.validateImage(file));
    }
}
