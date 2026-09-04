package com.doctorapp.medicaltracker.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;

public interface AppointmentService {

    Appointment createAppointment(Long patientId, Appointment appointment);

    Appointment getAppointmentById(Long id);

    List<Appointment> getAppointmentsByPatientId(Long patientId);

    default List<Appointment> getUpcomingAppointments(LocalDateTime fromDateTime) {
        return getUpcomingAppointments(fromDateTime, null);
    }

    List<Appointment> getUpcomingAppointments(LocalDateTime fromDateTime, LocalDateTime toDateTime);

    Page<Appointment> getUpcomingAppointmentPage(LocalDateTime fromDateTime, Pageable pageable);

    Appointment updateAppointment(Long id, Appointment appointmentDetails);

    Appointment updateAppointmentStatus(Long id, AppointmentStatus status);

    void deleteAppointment(Long id);
}
