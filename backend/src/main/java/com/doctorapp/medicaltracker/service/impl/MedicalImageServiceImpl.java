package com.doctorapp.medicaltracker.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import com.doctorapp.medicaltracker.model.ImageCategory;
import com.doctorapp.medicaltracker.model.MedicalImage;
import com.doctorapp.medicaltracker.repository.MedicalImageRepository;
import com.doctorapp.medicaltracker.service.AuditEventService;
import com.doctorapp.medicaltracker.service.ImageValidationService;
import com.doctorapp.medicaltracker.service.MedicalCaseService;
import com.doctorapp.medicaltracker.service.MedicalImageService;


@Service
@RequiredArgsConstructor
public class MedicalImageServiceImpl implements MedicalImageService {

    private static final String AUDIT_ENTITY_TYPE = "MEDICAL_IMAGE";

    @Value("${app.image.storage.path}")
    private String storagePath;

    private final MedicalImageRepository imageRepository;
    private final MedicalCaseService caseService;
    private final ImageValidationService imageValidationService;
    private final AuditEventService auditEventService;

    // public MedicalImageServiceImpl(MedicalImageRepository imageRepository, MedicalCaseService caseService) {
    //     this.imageRepository = imageRepository;
    //     this.caseService = caseService;
    // }

    @Override
    public MedicalImage saveImage(MultipartFile file, Long caseId, ImageCategory category, String description,
        String uploadedBy) {
      imageValidationService.validateImage(file);
      try {
        Path storageLocation = Paths.get(storagePath).toAbsolutePath().normalize();
        Files.createDirectories(storageLocation);

        String originalFileName = resolveOriginalFileName(file);
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;
        Path targetLocation = storageLocation.resolve(uniqueFileName).normalize();

        if (!targetLocation.startsWith(storageLocation)) {
            throw new IllegalArgumentException("Invalid image storage path");
        }

        //Save file to storage
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        // Create and save image metadata
        MedicalImage image = new MedicalImage();
        image.setFileName(uniqueFileName);
        image.setContentType(file.getContentType());
        image.setSize(file.getSize());
        image.setPath(targetLocation.toString());
        image.setCategory(category);
        image.setDescription(description);
        image.setUploadedBy(resolveUploadedBy(uploadedBy));
        image.setMedicalCase(caseService.getMedicalCase(caseId));
        image.setMimeType(file.getContentType());
        MedicalImage savedImage = imageRepository.save(image);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                savedImage.getId(),
                "IMAGE_UPLOADED",
                "caseId=" + caseId + ",category=" + category);
        return savedImage;
    } catch (IOException ex) {
        throw new RuntimeException("Failed to store image", ex);
      }
    }

    @Override
    public MedicalImage getImage(Long id) {
       MedicalImage image = imageRepository.findByIdAndIsDeletedFalse(id)
               .orElseThrow(() -> new RuntimeException("Image not found"));
       caseService.getMedicalCase(image.getMedicalCase().getId());
       return image;
    }

    @Override
    public List<MedicalImage> getImagesByCase(Long caseId) {
        caseService.getMedicalCase(caseId);
        return imageRepository.findByMedicalCaseIdAndIsDeletedFalse(caseId);
    }

    @Override
    public List<MedicalImage> getImagesByCaseAndCategory(Long caseId, ImageCategory category) {
        caseService.getMedicalCase(caseId);
        return imageRepository.findByCategoryAndMedicalCaseIdAndIsDeletedFalse(category, caseId);
    }

    @Override
    public void deleteImage(Long id) {
        MedicalImage image = getImage(id);
        image.setDeleted(true);
        imageRepository.save(image);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                image.getId(),
                "IMAGE_SOFT_DELETED",
                "caseId=" + image.getMedicalCase().getId());

    }

    @Override
    public byte[] retrieveImageData(Long id) {
      try {
        MedicalImage image = getImage(id);
        Path storageLocation = Paths.get(storagePath).toAbsolutePath().normalize();
        Path path = Paths.get(image.getPath()).toAbsolutePath().normalize();

        if (!path.startsWith(storageLocation) || !Files.exists(path)) {
            throw new RuntimeException("Image file not found");
        }

        return Files.readAllBytes(path);
    } catch (IOException ex) {
      throw new RuntimeException("Failes to retrieve image data", ex);
      }
    }

    private String resolveOriginalFileName(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            return "medical-image";
        }
        String safeName = Paths.get(originalFileName).getFileName().toString();
        return safeName.replace("\n", "_").replace("\r", "_");
    }

    private String resolveUploadedBy(String uploadedBy) {
        if (uploadedBy == null || uploadedBy.isBlank()) {
            return "system";
        }
        return uploadedBy.trim();
    }

}
