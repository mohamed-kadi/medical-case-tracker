package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import com.doctorapp.medicaltracker.model.ImageCategory;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.model.MedicalImage;
import com.doctorapp.medicaltracker.repository.MedicalImageRepository;
import com.doctorapp.medicaltracker.service.impl.MedicalImageServiceImpl;

@ExtendWith(MockitoExtension.class)
class MedicalImageServiceImplTest {

    @TempDir
    Path tempDir;

    @Mock
    private MedicalImageRepository medicalImageRepository;

    @Mock
    private MedicalCaseService medicalCaseService;

    @Mock
    private ImageValidationService imageValidationService;

    @Mock
    private AuditEventService auditEventService;

    @InjectMocks
    private MedicalImageServiceImpl medicalImageService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(medicalImageService, "storagePath", tempDir.toString());
    }

    @Test
    void saveImage_recordsAuditEvent() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lesion.jpg",
                "image/jpeg",
                "binary-image-data".getBytes());

        MedicalCase medicalCase = new MedicalCase();
        medicalCase.setId(21L);
        when(medicalCaseService.getMedicalCase(21L)).thenReturn(medicalCase);
        when(medicalImageRepository.save(any(MedicalImage.class))).thenAnswer(invocation -> {
            MedicalImage saved = invocation.getArgument(0);
            saved.setId(44L);
            return saved;
        });

        MedicalImage savedImage = medicalImageService.saveImage(
                file,
                21L,
                ImageCategory.BEFORE_TREATMENT,
                "Initial capture",
                "doctorOne");

        assertTrue(Files.exists(Path.of(savedImage.getPath())));
        verify(imageValidationService).validateImage(file);
        verify(auditEventService).recordEvent(
                eq("MEDICAL_IMAGE"),
                eq(44L),
                eq("IMAGE_UPLOADED"),
                contains("caseId=21"));
    }

    @Test
    void deleteImage_recordsAuditEvent() {
        MedicalCase medicalCase = new MedicalCase();
        medicalCase.setId(9L);

        MedicalImage image = new MedicalImage();
        image.setId(8L);
        image.setMedicalCase(medicalCase);
        image.setFileName("capture.jpg");
        image.setContentType("image/jpeg");
        image.setMimeType("image/jpeg");
        image.setPath(tempDir.resolve("capture.jpg").toString());
        image.setSize(20L);
        image.setCategory(ImageCategory.OTHER);
        image.setUploadedBy("doctorOne");

        when(medicalImageRepository.findByIdAndIsDeletedFalse(8L)).thenReturn(java.util.Optional.of(image));
        when(medicalCaseService.getMedicalCase(9L)).thenReturn(medicalCase);
        when(medicalImageRepository.save(any(MedicalImage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        medicalImageService.deleteImage(8L);

        assertTrue(image.isDeleted());
        verify(auditEventService).recordEvent(
                eq("MEDICAL_IMAGE"),
                eq(8L),
                eq("IMAGE_SOFT_DELETED"),
                contains("caseId=9"));
    }
}
