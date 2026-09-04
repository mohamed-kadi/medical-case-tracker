package com.doctorapp.medicaltracker.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByPatientIdAndScheduledAtAndStatus(
            Long patientId,
            LocalDateTime scheduledAt,
            AppointmentStatus status);

    boolean existsByPatientIdAndScheduledAtAndStatusAndIdNot(
            Long patientId,
            LocalDateTime scheduledAt,
            AppointmentStatus status,
            Long excludedAppointmentId);

    boolean existsByPatientAssignedDoctorUsernameAndScheduledAtAndStatus(
            String assignedDoctorUsername,
            LocalDateTime scheduledAt,
            AppointmentStatus status);

    boolean existsByPatientAssignedDoctorUsernameAndScheduledAtAndStatusAndIdNot(
            String assignedDoctorUsername,
            LocalDateTime scheduledAt,
            AppointmentStatus status,
            Long excludedAppointmentId);

    @Override
    @EntityGraph(attributePaths = "patient")
    Optional<Appointment> findById(Long id);

    @EntityGraph(attributePaths = "patient")
    List<Appointment> findByPatientIdOrderByScheduledAtAsc(Long patientId);

    @EntityGraph(attributePaths = "patient")
    List<Appointment> findByPatientIdAndScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
            Long patientId,
            LocalDateTime fromDateTime,
            AppointmentStatus status);

    @EntityGraph(attributePaths = "patient")
    List<Appointment> findByScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            AppointmentStatus status);

    @EntityGraph(attributePaths = "patient")
    Page<Appointment> findByScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            AppointmentStatus status,
            Pageable pageable);

    @EntityGraph(attributePaths = "patient")
    List<Appointment> findByScheduledAtGreaterThanEqualAndScheduledAtLessThanAndStatusOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime,
            AppointmentStatus status);

    @EntityGraph(attributePaths = "patient")
    List<Appointment> findByScheduledAtGreaterThanEqualAndStatusAndPatientAssignedDoctorUsernameOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            AppointmentStatus status,
            String assignedDoctorUsername);

    @EntityGraph(attributePaths = "patient")
    Page<Appointment> findByScheduledAtGreaterThanEqualAndStatusAndPatientAssignedDoctorUsernameOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            AppointmentStatus status,
            String assignedDoctorUsername,
            Pageable pageable);

    @EntityGraph(attributePaths = "patient")
    List<Appointment> findByScheduledAtGreaterThanEqualAndScheduledAtLessThanAndStatusAndPatientAssignedDoctorUsernameOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime,
            AppointmentStatus status,
            String assignedDoctorUsername);

    @EntityGraph(attributePaths = "patient")
    List<Appointment> findByScheduledAtGreaterThanEqualAndStatusAndPatientAssignedFrontDeskUsernameOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            AppointmentStatus status,
            String assignedFrontDeskUsername);
}
