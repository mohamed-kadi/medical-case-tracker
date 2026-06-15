package com.doctorapp.medicaltracker.dto;

import java.time.LocalDateTime;

import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;

public record PatientPortalAppointmentResponse(
        Long id,
        LocalDateTime scheduledAt,
        String reason,
        AppointmentStatus status) {

    public static PatientPortalAppointmentResponse from(Appointment appointment) {
        return new PatientPortalAppointmentResponse(
                appointment.getId(),
                appointment.getScheduledAt(),
                appointment.getReason(),
                appointment.getStatus());
    }
}
