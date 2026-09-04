package com.doctorapp.medicaltracker.dto;

import java.time.LocalDateTime;

import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;
import com.doctorapp.medicaltracker.model.Patient;

public record AppointmentResponse(
        Long id,
        Long patientId,
        String patientNumber,
        String patientName,
        LocalDateTime scheduledAt,
        String reason,
        String notes,
        AppointmentStatus status) {

    public static AppointmentResponse from(Appointment appointment) {
        Patient patient = appointment.getPatient();
        return new AppointmentResponse(
                appointment.getId(),
                patient == null ? null : patient.getId(),
                patient == null ? null : patient.getPatientNumber(),
                patient == null ? null : patient.getFirstName() + " " + patient.getLastName(),
                appointment.getScheduledAt(),
                appointment.getReason(),
                appointment.getNotes(),
                appointment.getStatus());
    }
}
