package com.doctorapp.medicaltracker.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.Appointment;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByScheduledAtAsc(Long patientId);

    List<Appointment> findByScheduledAtGreaterThanEqualOrderByScheduledAtAsc(LocalDateTime fromDateTime);

    List<Appointment> findByScheduledAtGreaterThanEqualAndPatientAssignedDoctorUsernameOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            String assignedDoctorUsername);

    List<Appointment> findByScheduledAtGreaterThanEqualAndPatientAssignedStaffUsernameOrderByScheduledAtAsc(
            LocalDateTime fromDateTime,
            String assignedStaffUsername);
}
