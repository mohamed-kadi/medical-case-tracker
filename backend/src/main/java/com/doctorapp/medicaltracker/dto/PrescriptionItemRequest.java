package com.doctorapp.medicaltracker.dto;

import jakarta.validation.constraints.NotBlank;

public record PrescriptionItemRequest(
        @NotBlank(message = "Medication name is required") String medicationName,
        String strength,
        String pharmaceuticalForm,
        String dose,
        String route,
        String frequency,
        String duration,
        String quantity,
        String instructions) {
}
