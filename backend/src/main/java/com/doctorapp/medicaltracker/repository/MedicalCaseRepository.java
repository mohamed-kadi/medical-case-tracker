package com.doctorapp.medicaltracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;

@Repository
public interface MedicalCaseRepository extends JpaRepository<MedicalCase, Long> {
    List<MedicalCase> findByPatientId(Long patientId);

     List<MedicalCase> findByPatientIdAndStatus(Long patientId, CaseStatus status); 

}
