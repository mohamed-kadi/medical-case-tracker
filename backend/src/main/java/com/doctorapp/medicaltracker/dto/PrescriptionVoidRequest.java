package com.doctorapp.medicaltracker.dto;

import jakarta.validation.constraints.NotBlank;

public record PrescriptionVoidRequest(
        @NotBlank(message = "A reason is required to void a prescription") String reason) {
}
