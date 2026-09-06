package com.doctorapp.medicaltracker.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.doctorapp.medicaltracker.model.Prescription;
import com.doctorapp.medicaltracker.model.PrescriptionStatus;
import com.doctorapp.medicaltracker.model.PrescriptionType;

public record PrescriptionResponse(
        Long id,
        Long caseId,
        String caseTitle,
        String prescriptionNumber,
        PrescriptionType type,
        PrescriptionStatus status,
        String prescriberName,
        String prescriberTitle,
        String professionalId,
        String practiceName,
        String practiceAddress,
        String practicePhone,
        String generalInstructions,
        String patientName,
        String patientNumber,
        LocalDate patientDateOfBirth,
        String createdBy,
        LocalDateTime issuedAt,
        LocalDateTime voidedAt,
        String voidReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<PrescriptionItemResponse> items) {

    public static PrescriptionResponse from(Prescription prescription) {
        return new PrescriptionResponse(
                prescription.getId(),
                prescription.getMedicalCase().getId(),
                prescription.getMedicalCase().getTitle(),
                prescription.getPrescriptionNumber(),
                prescription.getType(),
                prescription.getStatus(),
                prescription.getPrescriberName(),
                prescription.getPrescriberTitle(),
                prescription.getProfessionalId(),
                prescription.getPracticeName(),
                prescription.getPracticeAddress(),
                prescription.getPracticePhone(),
                prescription.getGeneralInstructions(),
                prescription.getPatientNameSnapshot(),
                prescription.getPatientNumberSnapshot(),
                prescription.getPatientDateOfBirthSnapshot(),
                prescription.getCreatedBy(),
                prescription.getIssuedAt(),
                prescription.getVoidedAt(),
                prescription.getVoidReason(),
                prescription.getCreatedAt(),
                prescription.getUpdatedAt(),
                prescription.getItems().stream().map(PrescriptionItemResponse::from).toList());
    }
}
