package com.doctorapp.medicaltracker.dto;

import java.time.LocalDateTime;

import com.doctorapp.medicaltracker.model.PatientAccountLink;
import com.doctorapp.medicaltracker.model.PatientAccountLinkStatus;

public record PatientAccountLinkResponse(
        Long id,
        Long userId,
        String username,
        String email,
        Long patientId,
        String patientNumber,
        String patientName,
        PatientAccountLinkStatus status,
        String verificationMethod,
        String verifiedByUsername,
        LocalDateTime verifiedAt) {

    public static PatientAccountLinkResponse from(PatientAccountLink link) {
        return new PatientAccountLinkResponse(
                link.getId(),
                link.getUser().getId(),
                link.getUser().getUsername(),
                link.getUser().getEmail(),
                link.getPatient().getId(),
                link.getPatient().getPatientNumber(),
                link.getPatient().getFirstName() + " " + link.getPatient().getLastName(),
                link.getStatus(),
                link.getVerificationMethod(),
                link.getVerifiedByUsername(),
                link.getVerifiedAt());
    }
}
