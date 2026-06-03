package com.doctorapp.medicaltracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;

@Repository
public interface MedicalCaseRepository extends JpaRepository<MedicalCase, Long> {
    List<MedicalCase> findByPatientId(Long patientId);

    List<MedicalCase> findByPatientIdAndStatus(Long patientId, CaseStatus status);

    @Query("SELECT mc FROM MedicalCase mc JOIN FETCH mc.patient WHERE mc.id = :id")
    Optional<MedicalCase> findByIdWithPatient(@Param("id") Long id);

}
