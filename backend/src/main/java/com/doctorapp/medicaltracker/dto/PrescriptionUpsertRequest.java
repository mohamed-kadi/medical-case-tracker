package com.doctorapp.medicaltracker.dto;

import java.util.List;

import com.doctorapp.medicaltracker.model.PrescriptionType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record PrescriptionUpsertRequest(
        PrescriptionType type,
        @NotBlank(message = "Prescriber name is required") String prescriberName,
        @NotBlank(message = "Prescriber title is required") String prescriberTitle,
        String professionalId,
        String practiceName,
        @NotBlank(message = "Practice address is required") String practiceAddress,
        String practicePhone,
        String generalInstructions,
        @NotEmpty(message = "At least one medication is required") List<@Valid PrescriptionItemRequest> items) {
}
