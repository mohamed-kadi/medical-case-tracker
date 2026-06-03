package com.doctorapp.medicaltracker.dto;

import com.doctorapp.medicaltracker.model.AppointmentStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;
}
