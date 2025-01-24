package com.doctorapp.medicaltracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.ImageCategory;
import com.doctorapp.medicaltracker.model.MedicalImage;

@Repository
public interface MedicalImageRepository extends JpaRepository<MedicalImage, Long> {

    List<MedicalImage> findByMedicalCaseIdAndIsDeletedFalse(Long medicalCaseId);


    List<MedicalImage> findByCategoryAndMedicalCaseIdAndIsDeletedFalse(ImageCategory category, Long caseId);

    @Query("SELECT i FROM MedicalImage i WHERE i.medicalCase.id = :caseId AND i.category = :category AND i.isDeleted = false ORDER BY i.createdAt DESC")
    List<MedicalImage> findLatestByCaseAndCategory(Long caseId, ImageCategory category);

    

}
