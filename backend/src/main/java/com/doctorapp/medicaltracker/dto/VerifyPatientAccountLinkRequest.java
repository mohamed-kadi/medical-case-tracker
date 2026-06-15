package com.doctorapp.medicaltracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyPatientAccountLinkRequest {

    @NotBlank
    private String patientNumber;

    @NotBlank
    private String username;

    @Size(max = 60)
    private String verificationMethod;
}
