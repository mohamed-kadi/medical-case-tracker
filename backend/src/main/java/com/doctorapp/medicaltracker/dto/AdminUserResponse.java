package com.doctorapp.medicaltracker.dto;

import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminUserResponse {

    private Long id;
    private String username;
    private String email;
    private UserRole role;
    private boolean enabled;

    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled());
    }
}
