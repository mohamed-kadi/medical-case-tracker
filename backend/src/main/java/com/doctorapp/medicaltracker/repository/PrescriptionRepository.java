package com.doctorapp.medicaltracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.Prescription;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    @Override
    @EntityGraph(attributePaths = {"medicalCase", "medicalCase.patient", "items"})
    Optional<Prescription> findById(Long id);

    @EntityGraph(attributePaths = {"medicalCase", "medicalCase.patient", "items"})
    List<Prescription> findByMedicalCaseIdOrderByCreatedAtDesc(Long caseId);

    @EntityGraph(attributePaths = {"medicalCase", "medicalCase.patient", "items"})
    List<Prescription> findByMedicalCasePatientIdOrderByCreatedAtDesc(Long patientId);
}
