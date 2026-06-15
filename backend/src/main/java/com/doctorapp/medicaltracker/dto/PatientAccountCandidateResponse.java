package com.doctorapp.medicaltracker.dto;

import com.doctorapp.medicaltracker.model.User;

public record PatientAccountCandidateResponse(
        Long id,
        String username,
        String email) {

    public static PatientAccountCandidateResponse from(User user) {
        return new PatientAccountCandidateResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail());
    }
}
