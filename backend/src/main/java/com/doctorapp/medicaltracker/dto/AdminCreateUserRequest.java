package com.doctorapp.medicaltracker.dto;

import com.doctorapp.medicaltracker.model.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminCreateUserRequest {

    @NotBlank(message = "{validation.auth.username.required}")
    private String username;

    @NotBlank(message = "{validation.auth.password.required}")
    @Size(min = 8, max = 128, message = "{validation.auth.password.size}")
    private String password;

    @NotBlank(message = "{validation.auth.email.required}")
    @Email(message = "{validation.auth.email.invalid}")
    private String email;

    @NotNull(message = "{validation.admin.role.required}")
    private UserRole role;
}
