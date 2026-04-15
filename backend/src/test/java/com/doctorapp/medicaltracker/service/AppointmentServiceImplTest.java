package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.doctorapp.medicaltracker.exception.AppointmentNotFoundException;
import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.repository.AppointmentRepository;
import com.doctorapp.medicaltracker.service.impl.AppointmentServiceImpl;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientService patientService;

    @Mock
    private AuditEventService auditEventService;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getUpcomingAppointments_whenDoctorAuthenticated_returnsDoctorAssignedAppointments() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));

        LocalDateTime fromDateTime = LocalDateTime.of(2026, 4, 15, 8, 0);
        Appointment appointment = new Appointment();
        appointment.setId(11L);
        appointment.setScheduledAt(LocalDateTime.of(2026, 4, 16, 9, 0));
        appointment.setReason("Follow-up");
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        when(appointmentRepository.findByScheduledAtGreaterThanEqualAndPatientAssignedDoctorUsernameOrderByScheduledAtAsc(
                fromDateTime,
                "doctorOne")).thenReturn(List.of(appointment));

        List<Appointment> result = appointmentService.getUpcomingAppointments(fromDateTime);

        assertEquals(1, result.size());
        assertEquals(11L, result.get(0).getId());
        verify(appointmentRepository)
                .findByScheduledAtGreaterThanEqualAndPatientAssignedDoctorUsernameOrderByScheduledAtAsc(
                        fromDateTime,
                        "doctorOne");
    }

    @Test
    void getAppointmentById_whenPatientIsNotAccessible_throwsAccessDeniedException() {
        Appointment appointment = appointmentWithPatient(20L, 5L);
        when(appointmentRepository.findById(20L)).thenReturn(Optional.of(appointment));
        doThrow(new AccessDeniedException("denied"))
                .when(patientService).assertCurrentUserCanAccessPatient(appointment.getPatient());

        assertThrows(AccessDeniedException.class, () -> appointmentService.getAppointmentById(20L));
        verify(appointmentRepository).findById(20L);
    }

    @Test
    void createAppointment_whenStatusMissing_setsDefaultScheduledStatus() {
        Patient patient = new Patient();
        patient.setId(9L);
        patient.setFirstName("Jane");
        patient.setLastName("Doe");
        patient.setEmail("jane@clinic.com");
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));

        Appointment appointment = new Appointment();
        appointment.setScheduledAt(LocalDateTime.of(2026, 4, 20, 11, 30));
        appointment.setReason("Initial consult");
        appointment.setStatus(null);

        when(patientService.getPatientById(9L)).thenReturn(patient);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment saved = invocation.getArgument(0);
            saved.setId(19L);
            return saved;
        });

        Appointment created = appointmentService.createAppointment(9L, appointment);

        assertEquals(AppointmentStatus.SCHEDULED, created.getStatus());
        assertEquals(9L, created.getPatient().getId());
        verify(appointmentRepository).save(appointment);
        verify(auditEventService).recordEvent(
                eq("APPOINTMENT"),
                eq(19L),
                eq("APPOINTMENT_CREATED"),
                contains("patientId=9"));
    }

    @Test
    void updateAppointmentStatus_whenTransitionInvalid_throwsIllegalStateException() {
        Appointment appointment = appointmentWithPatient(30L, 4L);
        appointment.setStatus(AppointmentStatus.COMPLETED);
        when(appointmentRepository.findById(30L)).thenReturn(Optional.of(appointment));

        assertThrows(IllegalStateException.class,
                () -> appointmentService.updateAppointmentStatus(30L, AppointmentStatus.SCHEDULED));
    }

    @Test
    void getAppointmentById_whenMissing_throwsAppointmentNotFoundException() {
        when(appointmentRepository.findById(44L)).thenReturn(Optional.empty());

        assertThrows(AppointmentNotFoundException.class, () -> appointmentService.getAppointmentById(44L));
    }

    @Test
    void updateAppointmentStatus_whenTransitionValid_recordsAuditEvent() {
        Appointment appointment = appointmentWithPatient(31L, 4L);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        when(appointmentRepository.findById(31L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Appointment updated = appointmentService.updateAppointmentStatus(31L, AppointmentStatus.COMPLETED);

        assertEquals(AppointmentStatus.COMPLETED, updated.getStatus());
        verify(auditEventService).recordEvent(
                eq("APPOINTMENT"),
                eq(31L),
                eq("APPOINTMENT_STATUS_UPDATED"),
                contains("SCHEDULED->COMPLETED"));
    }

    @Test
    void deleteAppointment_recordsAuditEvent() {
        Appointment appointment = appointmentWithPatient(45L, 12L);
        when(appointmentRepository.findById(45L)).thenReturn(Optional.of(appointment));

        appointmentService.deleteAppointment(45L);

        verify(appointmentRepository).delete(appointment);
        verify(auditEventService).recordEvent(
                eq("APPOINTMENT"),
                eq(45L),
                eq("APPOINTMENT_DELETED"),
                contains("patientId=12"));
    }

    private Appointment appointmentWithPatient(Long appointmentId, Long patientId) {
        Patient patient = new Patient();
        patient.setId(patientId);
        patient.setFirstName("Pat");
        patient.setLastName("Test");
        patient.setEmail("pat" + patientId + "@clinic.com");
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));

        Appointment appointment = new Appointment();
        appointment.setId(appointmentId);
        appointment.setPatient(patient);
        appointment.setScheduledAt(LocalDateTime.of(2026, 4, 19, 10, 0));
        appointment.setReason("Follow-up");
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        return appointment;
    }
}
