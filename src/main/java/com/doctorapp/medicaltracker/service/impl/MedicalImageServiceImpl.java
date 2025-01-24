package com.doctorapp.medicaltracker.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import com.doctorapp.medicaltracker.model.ImageCategory;
import com.doctorapp.medicaltracker.model.MedicalImage;
import com.doctorapp.medicaltracker.repository.MedicalImageRepository;
import com.doctorapp.medicaltracker.service.ImageValidationService;
import com.doctorapp.medicaltracker.service.MedicalCaseService;
import com.doctorapp.medicaltracker.service.MedicalImageService;


@Service
@RequiredArgsConstructor
public class MedicalImageServiceImpl implements MedicalImageService {

    @Value("${app.image.storage.path}")
    private String storagePath;

    private final MedicalImageRepository imageRepository;
    private final MedicalCaseService caseService;
     private final ImageValidationService imageValidationService;

    // public MedicalImageServiceImpl(MedicalImageRepository imageRepository, MedicalCaseService caseService) {
    //     this.imageRepository = imageRepository;
    //     this.caseService = caseService;
    // }

    @Override
    public MedicalImage saveImage(MultipartFile file, Long caseId, ImageCategory category, String description,
        String uploadedBy) {
      imageValidationService.validateImage(file);
      try {
        // Generate unique filename
        String uniqueFileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path targetLocation = Paths.get(storagePath).resolve(uniqueFileName);

        //Save file to storage
        Files.copy(file.getInputStream(), targetLocation);

        // Create and save image metadata
        MedicalImage image = new MedicalImage();
        image.setFileName(uniqueFileName);
        image.setContentType(file.getContentType());
        image.setSize(file.getSize());
        image.setPath(targetLocation.toString());
        image.setCategory(category);
        image.setDescription(description);
        image.setUploadedBy(uploadedBy);
        image.setMedicalCase(caseService.getMedicalCase(caseId));
        return imageRepository.save(image);
    } catch (IOException ex) {
        throw new RuntimeException("Failed to store image", ex);
      }
    }

    @Override
    public MedicalImage getImage(Long id) {
       return imageRepository.findById(id).orElseThrow(() -> new RuntimeException("Image not found"));
    }

    @Override
    public List<MedicalImage> getImagesByCase(Long caseId) {
        return imageRepository.findByMedicalCaseIdAndIsDeletedFalse(caseId);
    }

    @Override
    public List<MedicalImage> getImagesByCaseAndCategory(Long caseId, ImageCategory category) {
        return imageRepository.findByCategoryAndMedicalCaseIdAndIsDeletedFalse(category, caseId);
    }

    @Override
    public void deleteImage(Long id) {
        MedicalImage image = getImage(id);
        image.setDeleted(true);
        imageRepository.save(image);

    }

    @Override
    public byte[] retrieveImageData(Long id) {
      try {
        MedicalImage image = getImage(id);
        Path path = Paths.get(image.getPath());
        return Files.readAllBytes(path);
    } catch (IOException ex) {
      throw new RuntimeException("Failes to retrieve image data", ex);
      }
    }

}
