package com.doctorapp.medicaltracker.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.doctorapp.medicaltracker.exception.AppointmentNotFoundException;
import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.repository.AppointmentRepository;
import com.doctorapp.medicaltracker.service.AuditEventService;
import com.doctorapp.medicaltracker.service.AppointmentService;
import com.doctorapp.medicaltracker.service.PatientService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private static final String ACCESS_DENIED_MESSAGE = "You are not allowed to access this appointment";
    private static final String SCHEDULED_AT_REQUIRED_MESSAGE = "Scheduled time is required";
    private static final String REASON_REQUIRED_MESSAGE = "Reason is required";
    private static final String AUDIT_ENTITY_TYPE = "APPOINTMENT";

    private final AppointmentRepository appointmentRepository;
    private final PatientService patientService;
    private final AuditEventService auditEventService;

    @Override
    public Appointment createAppointment(Long patientId, Appointment appointment) {
        if (appointment == null) {
            throw new IllegalArgumentException("Appointment payload is required");
        }
        validateScheduledAt(appointment.getScheduledAt());
        validateReason(appointment.getReason());

        Patient patient = patientService.getPatientById(patientId);
        appointment.setPatient(patient);
        if (appointment.getStatus() == null) {
            appointment.setStatus(AppointmentStatus.SCHEDULED);
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                savedAppointment.getId(),
                "APPOINTMENT_CREATED",
                "patientId=" + patientId + ",status=" + savedAppointment.getStatus());
        return savedAppointment;
    }

    @Override
    @Transactional(readOnly = true)
    public Appointment getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException(id));
        patientService.assertCurrentUserCanAccessPatient(appointment.getPatient());
        return appointment;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Appointment> getAppointmentsByPatientId(Long patientId) {
        patientService.getPatientById(patientId);
        return appointmentRepository.findByPatientIdOrderByScheduledAtAsc(patientId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Appointment> getUpcomingAppointments(LocalDateTime fromDateTime) {
        LocalDateTime effectiveFromDate = fromDateTime == null ? LocalDateTime.now() : fromDateTime;
        AccessScope accessScope = getAccessScope();

        return switch (accessScope.role()) {
            case ADMIN_OR_SYSTEM -> appointmentRepository.findByScheduledAtGreaterThanEqualOrderByScheduledAtAsc(
                    effectiveFromDate);
            case DOCTOR -> appointmentRepository
                    .findByScheduledAtGreaterThanEqualAndPatientAssignedDoctorUsernameOrderByScheduledAtAsc(
                            effectiveFromDate,
                            accessScope.username());
            case STAFF -> appointmentRepository
                    .findByScheduledAtGreaterThanEqualAndPatientAssignedStaffUsernameOrderByScheduledAtAsc(
                            effectiveFromDate,
                            accessScope.username());
            case DENIED -> throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        };
    }

    @Override
    public Appointment updateAppointment(Long id, Appointment appointmentDetails) {
        Appointment existingAppointment = getAppointmentById(id);
        if (appointmentDetails == null) {
            return existingAppointment;
        }

        if (appointmentDetails.getScheduledAt() != null) {
            validateScheduledAt(appointmentDetails.getScheduledAt());
            existingAppointment.setScheduledAt(appointmentDetails.getScheduledAt());
        }
        if (appointmentDetails.getReason() != null) {
            validateReason(appointmentDetails.getReason());
            existingAppointment.setReason(appointmentDetails.getReason().trim());
        }
        existingAppointment.setNotes(appointmentDetails.getNotes());
        if (appointmentDetails.getStatus() != null) {
            existingAppointment.setStatus(appointmentDetails.getStatus());
        }

        Appointment savedAppointment = appointmentRepository.save(existingAppointment);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                savedAppointment.getId(),
                "APPOINTMENT_UPDATED",
                "status=" + savedAppointment.getStatus());
        return savedAppointment;
    }

    @Override
    public Appointment updateAppointmentStatus(Long id, AppointmentStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("New status is required");
        }

        Appointment existingAppointment = getAppointmentById(id);
        AppointmentStatus previousStatus = existingAppointment.getStatus();
        if (!isValidStatusTransition(previousStatus, status)) {
            throw new IllegalStateException(
                    "Invalid appointment status transition from "
                            + previousStatus
                            + " to "
                            + status);
        }

        existingAppointment.setStatus(status);
        Appointment savedAppointment = appointmentRepository.save(existingAppointment);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                savedAppointment.getId(),
                "APPOINTMENT_STATUS_UPDATED",
                "status=" + previousStatus + "->" + status);
        return savedAppointment;
    }

    @Override
    public void deleteAppointment(Long id) {
        Appointment existingAppointment = getAppointmentById(id);
        appointmentRepository.delete(existingAppointment);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                id,
                "APPOINTMENT_DELETED",
                "status=" + existingAppointment.getStatus()
                        + ",patientId=" + existingAppointment.getPatient().getId());
    }

    private void validateScheduledAt(LocalDateTime scheduledAt) {
        if (scheduledAt == null) {
            throw new IllegalArgumentException(SCHEDULED_AT_REQUIRED_MESSAGE);
        }
    }

    private void validateReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException(REASON_REQUIRED_MESSAGE);
        }
    }

    private boolean isValidStatusTransition(AppointmentStatus currentStatus, AppointmentStatus nextStatus) {
        if (currentStatus == nextStatus) {
            return true;
        }

        return switch (currentStatus) {
            case SCHEDULED -> nextStatus == AppointmentStatus.COMPLETED
                    || nextStatus == AppointmentStatus.CANCELLED
                    || nextStatus == AppointmentStatus.NO_SHOW;
            case COMPLETED, CANCELLED, NO_SHOW -> false;
        };
    }

    private AccessScope getAccessScope() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return new AccessScope("", AccessRole.ADMIN_OR_SYSTEM);
        }

        if (hasAuthority(authentication, "ROLE_ADMIN")) {
            return new AccessScope(authentication.getName(), AccessRole.ADMIN_OR_SYSTEM);
        }
        if (hasAuthority(authentication, "ROLE_DOCTOR")) {
            return new AccessScope(authentication.getName(), AccessRole.DOCTOR);
        }
        if (hasAuthority(authentication, "ROLE_STAFF")) {
            return new AccessScope(authentication.getName(), AccessRole.STAFF);
        }
        return new AccessScope(authentication.getName(), AccessRole.DENIED);
    }

    private boolean hasAuthority(Authentication authentication, String authority) {
        return authentication.getAuthorities()
                .stream()
                .anyMatch(grantedAuthority -> authority.equals(grantedAuthority.getAuthority()));
    }

    private enum AccessRole {
        ADMIN_OR_SYSTEM,
        DOCTOR,
        STAFF,
        DENIED
    }

    private record AccessScope(String username, AccessRole role) {
    }
}
