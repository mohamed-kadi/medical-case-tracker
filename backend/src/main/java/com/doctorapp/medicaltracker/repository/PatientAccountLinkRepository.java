package com.doctorapp.medicaltracker.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.PatientAccountLink;
import com.doctorapp.medicaltracker.model.PatientAccountLinkStatus;

@Repository
public interface PatientAccountLinkRepository extends JpaRepository<PatientAccountLink, Long> {

    Optional<PatientAccountLink> findFirstByUserUsernameAndStatusOrderByVerifiedAtDesc(
            String username,
            PatientAccountLinkStatus status);

    Optional<PatientAccountLink> findFirstByPatientIdAndStatusOrderByVerifiedAtDesc(
            Long patientId,
            PatientAccountLinkStatus status);

    Optional<PatientAccountLink> findFirstByUserIdAndStatusOrderByVerifiedAtDesc(
            Long userId,
            PatientAccountLinkStatus status);

    Optional<PatientAccountLink> findFirstByUserIdAndPatientIdAndStatus(
            Long userId,
            Long patientId,
            PatientAccountLinkStatus status);

    boolean existsByUserIdAndPatientIdAndStatus(
            Long userId,
            Long patientId,
            PatientAccountLinkStatus status);
}
