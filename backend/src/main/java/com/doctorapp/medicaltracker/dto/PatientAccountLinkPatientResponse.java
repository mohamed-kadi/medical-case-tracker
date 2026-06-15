package com.doctorapp.medicaltracker.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientAccountLink;
import com.doctorapp.medicaltracker.model.PatientStatus;

public record PatientAccountLinkPatientResponse(
        Long id,
        String patientNumber,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        String email,
        String phoneNumber,
        PatientStatus status,
        String verifiedUsername,
        String verifiedEmail,
        LocalDateTime verifiedAt) {

    public static PatientAccountLinkPatientResponse from(Patient patient, PatientAccountLink verifiedLink) {
        return new PatientAccountLinkPatientResponse(
                patient.getId(),
                patient.getPatientNumber(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getDateOfBirth(),
                patient.getEmail(),
                patient.getPhoneNumber(),
                patient.getStatus(),
                verifiedLink == null ? null : verifiedLink.getUser().getUsername(),
                verifiedLink == null ? null : verifiedLink.getUser().getEmail(),
                verifiedLink == null ? null : verifiedLink.getVerifiedAt());
    }
}
