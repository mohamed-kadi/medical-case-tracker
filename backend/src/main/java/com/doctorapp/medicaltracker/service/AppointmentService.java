package com.doctorapp.medicaltracker.service;

import java.time.LocalDateTime;
import java.util.List;

import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;

public interface AppointmentService {

    Appointment createAppointment(Long patientId, Appointment appointment);

    Appointment getAppointmentById(Long id);

    List<Appointment> getAppointmentsByPatientId(Long patientId);

    List<Appointment> getUpcomingAppointments(LocalDateTime fromDateTime);

    Appointment updateAppointment(Long id, Appointment appointmentDetails);

    Appointment updateAppointmentStatus(Long id, AppointmentStatus status);

    void deleteAppointment(Long id);
}
