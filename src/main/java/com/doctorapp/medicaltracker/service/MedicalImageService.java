package com.doctorapp.medicaltracker.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.doctorapp.medicaltracker.model.ImageCategory;
import com.doctorapp.medicaltracker.model.MedicalImage;

public interface MedicalImageService {

    MedicalImage saveImage(MultipartFile file, Long caseId, ImageCategory category, String description,
            String uploadedBy);
    
    MedicalImage getImage(Long id);

    List<MedicalImage> getImagesByCase(Long caseId);

    List<MedicalImage> getImagesByCaseAndCategory(Long caseId, ImageCategory category);

    void deleteImage(Long id);
    
    byte[] retrieveImageData(Long id);

}
