package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.doctorapp.medicaltracker.exception.PatientNotFoundException;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.MedicalCaseRepository;
import com.doctorapp.medicaltracker.repository.PatientRepository;
import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.service.impl.PatientServiceImpl;

@ExtendWith(MockitoExtension.class) // This is a JUnit 5 annotation that tells JUnit to enable and configure the Mockito extension before running the tests
public class PatientServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private MedicalCaseRepository medicalCaseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditEventService auditEventService;

    @InjectMocks    // This annotation is used to inject the mocked dependencies into the PatientServiceImpl class
    private PatientServiceImpl patientService;

    private Patient testPatient;

    @BeforeEach   // This annotation is used to signal that the method should be executed before each test method in the test class
    void setUp() {
        testPatient = new Patient();
        testPatient.setId(1L);
        testPatient.setFirstName("John");
        testPatient.setLastName("Doe");
        testPatient.setEmail("john@example.com");
        testPatient.setDateOfBirth(LocalDate.of(1980, 1, 1));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
    
    @Test
    void getPatientById_whenPatientExists_returnPatient() {
        //Arrange
        when(patientRepository.findById(1L)).thenReturn(Optional.of(testPatient));

        //Act
        Patient found = patientService.getPatientById(1L);

        //Assert
        assertNotNull(found);
        assertEquals("John", found.getFirstName());
        assertEquals("Doe", found.getLastName());
        verify(patientRepository).findById(1L);
    }

    @Test
    void getPatientById_whenPatientDoesNotExist_throwPatientNotFoundException() {
        when(patientRepository.findById(2L)).thenReturn(Optional.empty());

        assertThrows(PatientNotFoundException.class, () -> patientService.getPatientById(2L));
        verify(patientRepository).findById(2L);
    }

    @Test
    void createPatient_whenEmailAlreadyUsed_throwIllegalStateException() {
        when(patientRepository.existsByEmail(testPatient.getEmail())).thenReturn(true);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> patientService.createPatient(testPatient));

        assertEquals("Email is already taken:" + testPatient.getEmail(), exception.getMessage());
        verify(patientRepository).existsByEmail(testPatient.getEmail());
    }

    @Test
    void getAllPatients_whenDoctorAuthenticated_returnsOnlyAssignedPatients() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));

        when(patientRepository.findByAssignedDoctorUsername("doctorOne"))
                .thenReturn(List.of(testPatient));

        List<Patient> result = patientService.getAllPatients();

        assertEquals(1, result.size());
        assertEquals(testPatient.getId(), result.get(0).getId());
        verify(patientRepository).findByAssignedDoctorUsername("doctorOne");
    }

    @Test
    void getPatientById_whenDoctorNotAssigned_throwsAccessDeniedException() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));

        testPatient.setAssignedDoctorUsername("doctorTwo");
        when(patientRepository.findById(1L)).thenReturn(Optional.of(testPatient));

        assertThrows(AccessDeniedException.class, () -> patientService.getPatientById(1L));
        verify(patientRepository).findById(1L);
    }

    @Test
    void createPatient_whenDoctorAuthenticated_autoAssignsDoctorUsername() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));

        testPatient.setAssignedDoctorUsername("spoofedDoctor");
        testPatient.setAssignedFrontDeskUsername("spoofedFrontDesk");
        when(patientRepository.existsByEmail(testPatient.getEmail())).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        Patient created = patientService.createPatient(testPatient);

        assertEquals("doctorOne", created.getAssignedDoctorUsername());
        assertEquals(null, created.getAssignedFrontDeskUsername());
        assertEquals("doctorOne", created.getRegisteredByUsername());
        verify(patientRepository).save(testPatient);
        verify(auditEventService).recordEvent(
                eq("PATIENT"),
                eq(1L),
                eq("PATIENT_CREATED"),
                contains("registeredBy=doctorOne"));
    }

    @Test
    void createPatient_whenFrontDeskAuthenticated_recordsRegistrarAndAutoAssignsSoleDoctor() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("receptionOne", "n/a", "ROLE_FRONT_DESK"));

        User doctor = new User();
        doctor.setUsername("doctorOne");
        doctor.setRole(UserRole.DOCTOR);
        doctor.setEnabled(true);

        User disabledDoctor = new User();
        disabledDoctor.setUsername("doctorDisabled");
        disabledDoctor.setRole(UserRole.DOCTOR);
        disabledDoctor.setEnabled(false);

        testPatient.setMedicalHistory("should be cleared");
        testPatient.setAssignedDoctorUsername("spoofedDoctor");
        testPatient.setAssignedFrontDeskUsername("spoofedFrontDesk");

        when(patientRepository.existsByEmail(testPatient.getEmail())).thenReturn(false);
        when(userRepository.findByRoleOrderByUsernameAsc(UserRole.DOCTOR)).thenReturn(List.of(doctor, disabledDoctor));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        Patient created = patientService.createPatient(testPatient);

        assertEquals("doctorOne", created.getAssignedDoctorUsername());
        assertEquals("receptionOne", created.getAssignedFrontDeskUsername());
        assertEquals("receptionOne", created.getRegisteredByUsername());
        assertEquals(null, created.getMedicalHistory());
        verify(auditEventService).recordEvent(
                eq("PATIENT"),
                eq(1L),
                eq("PATIENT_CREATED"),
                contains("registeredBy=receptionOne"));
    }

    @Test
    void createPatient_whenFrontDeskAuthenticatedAndMultipleDoctors_leavesDoctorUnassigned() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("receptionOne", "n/a", "ROLE_FRONT_DESK"));

        User doctorOne = new User();
        doctorOne.setUsername("doctorOne");
        doctorOne.setRole(UserRole.DOCTOR);
        doctorOne.setEnabled(true);

        User doctorTwo = new User();
        doctorTwo.setUsername("doctorTwo");
        doctorTwo.setRole(UserRole.DOCTOR);
        doctorTwo.setEnabled(true);

        when(patientRepository.existsByEmail(testPatient.getEmail())).thenReturn(false);
        when(userRepository.findByRoleOrderByUsernameAsc(UserRole.DOCTOR)).thenReturn(List.of(doctorOne, doctorTwo));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> {
            Patient saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        Patient created = patientService.createPatient(testPatient);

        assertEquals(null, created.getAssignedDoctorUsername());
        assertEquals("receptionOne", created.getAssignedFrontDeskUsername());
        assertEquals("receptionOne", created.getRegisteredByUsername());
    }

    @Test
    void assignPatient_whenDoctorAndStaffProvided_updatesAssignments() {
        Patient existing = new Patient();
        existing.setId(5L);
        existing.setFirstName("Pat");
        existing.setLastName("Test");
        existing.setEmail("pat@test.com");
        existing.setDateOfBirth(LocalDate.of(1990, 1, 1));

        User doctor = new User();
        doctor.setUsername("doctorOne");
        doctor.setRole(UserRole.DOCTOR);

        User staff = new User();
        staff.setUsername("staffOne");
        staff.setRole(UserRole.FRONT_DESK);

        when(patientRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(userRepository.findByUsername("doctorOne")).thenReturn(Optional.of(doctor));
        when(userRepository.findByUsername("staffOne")).thenReturn(Optional.of(staff));
        when(patientRepository.save(existing)).thenReturn(existing);

        Patient updated = patientService.assignPatient(5L, "doctorOne", "staffOne");

        assertEquals("doctorOne", updated.getAssignedDoctorUsername());
        assertEquals("staffOne", updated.getAssignedFrontDeskUsername());
        verify(patientRepository).save(existing);
        verify(auditEventService).recordEvent(
                eq("PATIENT"),
                eq(5L),
                eq("PATIENT_ASSIGNED"),
                contains("doctor=doctorOne"));
    }

    @Test
    void updatePatientStatus_whenTransitionValid_recordsAuditEvent() {
        Patient existing = new Patient();
        existing.setId(6L);
        existing.setFirstName("Pat");
        existing.setLastName("Status");
        existing.setEmail("pat.status@test.com");
        existing.setDateOfBirth(LocalDate.of(1990, 1, 1));
        existing.setStatus(PatientStatus.ACTIVE);

        when(patientRepository.findById(6L)).thenReturn(Optional.of(existing));
        when(medicalCaseRepository.findByPatientIdAndStatus(6L, com.doctorapp.medicaltracker.model.CaseStatus.IN_PROGRESS))
                .thenReturn(List.of());
        when(patientRepository.save(existing)).thenReturn(existing);

        Patient updated = patientService.updatePatientStatus(6L, PatientStatus.INACTIVE);

        assertEquals(PatientStatus.INACTIVE, updated.getStatus());
        verify(auditEventService).recordEvent(
                eq("PATIENT"),
                eq(6L),
                eq("PATIENT_STATUS_UPDATED"),
                contains("ACTIVE->INACTIVE"));
    }

    @Test
    void deletePatient_setsArchivedAndRecordsAuditEvent() {
        Patient existing = new Patient();
        existing.setId(7L);
        existing.setFirstName("Pat");
        existing.setLastName("Archive");
        existing.setEmail("archive@test.com");
        existing.setDateOfBirth(LocalDate.of(1990, 1, 1));
        existing.setStatus(PatientStatus.ACTIVE);

        when(patientRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(patientRepository.save(existing)).thenReturn(existing);

        patientService.deletePatient(7L);

        assertEquals(PatientStatus.ARCHIVED, existing.getStatus());
        verify(auditEventService).recordEvent(
                eq("PATIENT"),
                eq(7L),
                eq("PATIENT_ARCHIVED"),
                contains("ACTIVE->ARCHIVED"));
    }

    @Test
    void assignPatient_whenRoleMismatch_throwsIllegalArgumentException() {
        Patient existing = new Patient();
        existing.setId(5L);
        existing.setFirstName("Pat");
        existing.setLastName("Test");
        existing.setEmail("pat@test.com");
        existing.setDateOfBirth(LocalDate.of(1990, 1, 1));

        User wrongRoleUser = new User();
        wrongRoleUser.setUsername("doctorOne");
        wrongRoleUser.setRole(UserRole.FRONT_DESK);

        when(patientRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(userRepository.findByUsername("doctorOne")).thenReturn(Optional.of(wrongRoleUser));

        assertThrows(IllegalArgumentException.class, () -> patientService.assignPatient(5L, "doctorOne", null));
    }

}
