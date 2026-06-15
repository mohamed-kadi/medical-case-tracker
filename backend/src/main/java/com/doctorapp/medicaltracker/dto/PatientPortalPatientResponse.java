package com.doctorapp.medicaltracker.dto;

import java.time.LocalDate;

import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;

public record PatientPortalPatientResponse(
        Long id,
        String patientNumber,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        String email,
        String phoneNumber,
        PatientStatus status,
        String assignedDoctorUsername,
        String assignedFrontDeskUsername) {

    public static PatientPortalPatientResponse from(Patient patient) {
        return new PatientPortalPatientResponse(
                patient.getId(),
                patient.getPatientNumber(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getDateOfBirth(),
                patient.getEmail(),
                patient.getPhoneNumber(),
                patient.getStatus(),
                patient.getAssignedDoctorUsername(),
                patient.getAssignedFrontDeskUsername());
    }
}
