package com.doctorapp.medicaltracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "{validation.auth.username.required}")
    private String username;

    @NotBlank(message = "{validation.auth.password.required}")
    private String password;

}
