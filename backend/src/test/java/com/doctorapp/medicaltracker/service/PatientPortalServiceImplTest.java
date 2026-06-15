package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

import com.doctorapp.medicaltracker.dto.PatientPortalDashboardResponse;
import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientAccountLink;
import com.doctorapp.medicaltracker.model.PatientAccountLinkStatus;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.AppointmentRepository;
import com.doctorapp.medicaltracker.repository.PatientAccountLinkRepository;
import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.service.impl.PatientPortalServiceImpl;

@ExtendWith(MockitoExtension.class)
class PatientPortalServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientAccountLinkRepository patientAccountLinkRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PatientPortalServiceImpl patientPortalService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getDashboard_whenVerifiedLinkExists_returnsProfileAndUpcomingAppointments() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("patient1", "n/a", "ROLE_PATIENT"));

        User account = patientUser("patient1", "patient@clinic.com");
        Patient patient = patient();
        PatientAccountLink link = verifiedLink(account, patient);
        Appointment appointment = appointment(patient);

        when(userRepository.findByUsername("patient1")).thenReturn(Optional.of(account));
        when(patientAccountLinkRepository.findFirstByUserUsernameAndStatusOrderByVerifiedAtDesc(
                "patient1",
                PatientAccountLinkStatus.VERIFIED)).thenReturn(Optional.of(link));
        when(appointmentRepository.findByPatientIdAndScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
                eq(7L),
                any(LocalDateTime.class),
                eq(AppointmentStatus.SCHEDULED))).thenReturn(List.of(appointment));

        PatientPortalDashboardResponse dashboard = patientPortalService.getDashboard();

        assertEquals("patient1", dashboard.username());
        assertEquals("MT-2026-0007", dashboard.patient().patientNumber());
        assertEquals(1, dashboard.upcomingAppointments().size());
        assertEquals("Consultation", dashboard.upcomingAppointments().get(0).reason());
        verify(patientAccountLinkRepository).findFirstByUserUsernameAndStatusOrderByVerifiedAtDesc(
                "patient1",
                PatientAccountLinkStatus.VERIFIED);
    }

    @Test
    void getDashboard_whenPatientFileIsNotLinked_returnsAccountOnlyDashboard() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("patient1", "n/a", "ROLE_PATIENT"));

        when(userRepository.findByUsername("patient1")).thenReturn(Optional.of(patientUser("patient1", "patient@clinic.com")));
        when(patientAccountLinkRepository.findFirstByUserUsernameAndStatusOrderByVerifiedAtDesc(
                "patient1",
                PatientAccountLinkStatus.VERIFIED)).thenReturn(Optional.empty());

        PatientPortalDashboardResponse dashboard = patientPortalService.getDashboard();

        assertEquals("patient1", dashboard.username());
        assertEquals("patient@clinic.com", dashboard.email());
        assertNull(dashboard.patient());
        assertEquals(0, dashboard.upcomingAppointments().size());
    }

    @Test
    void getDashboard_whenAccountIsNotPatient_throwsAccessDeniedException() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctor1", "n/a", "ROLE_DOCTOR"));

        User doctor = patientUser("doctor1", "doctor@clinic.com");
        doctor.setRole(UserRole.DOCTOR);
        when(userRepository.findByUsername("doctor1")).thenReturn(Optional.of(doctor));

        assertThrows(AccessDeniedException.class, () -> patientPortalService.getDashboard());
    }

    private User patientUser(String username, String email) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword("encoded");
        user.setRole(UserRole.PATIENT);
        user.setEnabled(true);
        return user;
    }

    private PatientAccountLink verifiedLink(User user, Patient patient) {
        PatientAccountLink link = new PatientAccountLink();
        link.setId(3L);
        link.setUser(user);
        link.setPatient(patient);
        link.setStatus(PatientAccountLinkStatus.VERIFIED);
        link.setVerificationMethod("FRONT_DESK_MANUAL");
        link.setVerifiedByUsername("receptionOne");
        link.setVerifiedAt(LocalDateTime.of(2026, 6, 3, 9, 30));
        return link;
    }

    private Patient patient() {
        Patient patient = new Patient();
        patient.setId(7L);
        patient.setPatientNumber("MT-2026-0007");
        patient.setFirstName("Nora");
        patient.setLastName("Rami");
        patient.setDateOfBirth(LocalDate.of(1992, 1, 10));
        patient.setEmail("patient@clinic.com");
        patient.setPhoneNumber("+212600000000");
        patient.setStatus(PatientStatus.ACTIVE);
        patient.setAssignedDoctorUsername("doctorOne");
        patient.setAssignedFrontDeskUsername("receptionOne");
        return patient;
    }

    private Appointment appointment(Patient patient) {
        Appointment appointment = new Appointment();
        appointment.setId(20L);
        appointment.setPatient(patient);
        appointment.setScheduledAt(LocalDateTime.of(2026, 7, 5, 10, 30));
        appointment.setReason("Consultation");
        appointment.setNotes("internal note not exposed");
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        return appointment;
    }
}
