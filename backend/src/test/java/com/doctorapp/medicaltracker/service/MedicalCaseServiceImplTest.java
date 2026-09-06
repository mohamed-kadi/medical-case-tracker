package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
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

import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.repository.MedicalCaseRepository;
import com.doctorapp.medicaltracker.service.impl.MedicalCaseServiceImpl;

@ExtendWith(MockitoExtension.class)
class MedicalCaseServiceImplTest {

    @Mock
    private MedicalCaseRepository medicalCaseRepository;

    @Mock
    private PatientService patientService;

    @Mock
    private AuditEventService auditEventService;

    @InjectMocks
    private MedicalCaseServiceImpl medicalCaseService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createCase_recordsAuditEvent() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));

        Patient patient = patientWithId(2L);
        MedicalCase newCase = new MedicalCase();
        newCase.setTitle("Acne treatment");

        when(patientService.getPatientById(2L)).thenReturn(patient);
        when(medicalCaseRepository.save(any(MedicalCase.class))).thenAnswer(invocation -> {
            MedicalCase saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        MedicalCase created = medicalCaseService.createCase(2L, newCase);

        assertEquals(10L, created.getId());
        assertEquals(CaseStatus.OPEN, created.getStatus());
        verify(auditEventService).recordEvent(
                eq("MEDICAL_CASE"),
                eq(10L),
                eq("CASE_CREATED"),
                contains("patientId=2"));
    }

    @Test
    void updateCaseStatus_recordsAuditEventWithTransition() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));

        Patient patient = patientWithId(3L);
        MedicalCase existing = new MedicalCase();
        existing.setId(7L);
        existing.setPatient(patient);
        existing.setTitle("Wound follow-up");
        existing.setStatus(CaseStatus.OPEN);

        when(medicalCaseRepository.findByIdWithPatient(7L)).thenReturn(Optional.of(existing));
        when(medicalCaseRepository.save(any(MedicalCase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MedicalCase updated = medicalCaseService.updateCaseStatus(7L, CaseStatus.IN_PROGRESS);

        assertEquals(CaseStatus.IN_PROGRESS, updated.getStatus());
        verify(auditEventService).recordEvent(
                eq("MEDICAL_CASE"),
                eq(7L),
                eq("CASE_STATUS_UPDATED"),
                contains("OPEN->IN_PROGRESS"));
    }

    @Test
    void updateCase_savesDetailsAndDirectStatusChangeAtomically() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));

        Patient patient = patientWithId(3L);
        MedicalCase existing = new MedicalCase();
        existing.setId(8L);
        existing.setPatient(patient);
        existing.setTitle("Initial assessment");
        existing.setStatus(CaseStatus.OPEN);
        MedicalCase changes = new MedicalCase();
        changes.setTitle("Initial assessment updated");
        changes.setDescription("Improving");
        changes.setStatus(CaseStatus.RESOLVED);

        when(medicalCaseRepository.findByIdWithPatient(8L)).thenReturn(Optional.of(existing));
        when(medicalCaseRepository.save(any(MedicalCase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MedicalCase updated = medicalCaseService.updateCase(8L, changes);

        assertEquals("Initial assessment updated", updated.getTitle());
        assertEquals(CaseStatus.RESOLVED, updated.getStatus());
        verify(auditEventService).recordEvent(
                eq("MEDICAL_CASE"), eq(8L), eq("CASE_STATUS_UPDATED"), contains("OPEN->RESOLVED"));
    }

    @Test
    void deleteCase_recordsAuditEvent() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));

        Patient patient = patientWithId(4L);
        MedicalCase existing = new MedicalCase();
        existing.setId(12L);
        existing.setPatient(patient);
        existing.setTitle("Resolved lesion");
        existing.setStatus(CaseStatus.RESOLVED);

        when(medicalCaseRepository.findByIdWithPatient(12L)).thenReturn(Optional.of(existing));

        medicalCaseService.deleteCase(12L);

        verify(medicalCaseRepository).delete(existing);
        verify(auditEventService).recordEvent(
                eq("MEDICAL_CASE"),
                eq(12L),
                eq("CASE_DELETED"),
                contains("status=RESOLVED"));
    }

    @Test
    void createCase_whenStaffRole_throwsAccessDeniedException() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("staffOne", "n/a", "ROLE_FRONT_DESK"));

        MedicalCase newCase = new MedicalCase();
        newCase.setTitle("Staff case");

        assertThrows(AccessDeniedException.class, () -> medicalCaseService.createCase(2L, newCase));
        verify(patientService, never()).getPatientById(any(Long.class));
    }

    @Test
    void updateCaseStatus_whenStaffRole_throwsAccessDeniedException() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("staffOne", "n/a", "ROLE_FRONT_DESK"));

        assertThrows(AccessDeniedException.class, () -> medicalCaseService.updateCaseStatus(7L, CaseStatus.IN_PROGRESS));
        verify(medicalCaseRepository, never()).findByIdWithPatient(any(Long.class));
    }

    private Patient patientWithId(Long id) {
        Patient patient = new Patient();
        patient.setId(id);
        patient.setFirstName("Pat");
        patient.setLastName("Test");
        patient.setEmail("pat" + id + "@clinic.com");
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));
        patient.setStatus(PatientStatus.ACTIVE);
        return patient;
    }
}
