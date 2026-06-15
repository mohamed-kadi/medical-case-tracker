package com.doctorapp.medicaltracker.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByScheduledAtAsc(Long patientId);

    List<Appointment> findByPatientIdAndScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
            Long patientId,
            LocalDateTime fromDateTime,
            AppointmentStatus status);

    List<Appointment> findByScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            AppointmentStatus status);

    List<Appointment> findByScheduledAtGreaterThanEqualAndStatusAndPatientAssignedDoctorUsernameOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            AppointmentStatus status,
            String assignedDoctorUsername);

    List<Appointment> findByScheduledAtGreaterThanEqualAndStatusAndPatientAssignedFrontDeskUsernameOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            AppointmentStatus status,
            String assignedFrontDeskUsername);
}
