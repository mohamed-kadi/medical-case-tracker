package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.doctorapp.medicaltracker.dto.PrescriptionItemRequest;
import com.doctorapp.medicaltracker.dto.PrescriptionUpsertRequest;
import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.Prescription;
import com.doctorapp.medicaltracker.model.PrescriptionStatus;
import com.doctorapp.medicaltracker.model.PrescriptionType;
import com.doctorapp.medicaltracker.repository.PrescriptionRepository;
import com.doctorapp.medicaltracker.service.impl.PrescriptionServiceImpl;

@ExtendWith(MockitoExtension.class)
class PrescriptionServiceImplTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;
    @Mock
    private MedicalCaseService medicalCaseService;
    @Mock
    private PatientService patientService;
    @Mock
    private AuditEventService auditEventService;

    @InjectMocks
    private PrescriptionServiceImpl prescriptionService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createDraft_snapshotsPatientAndMedicationLines() {
        authenticateDoctor();
        MedicalCase medicalCase = medicalCase(CaseStatus.OPEN);
        when(medicalCaseService.getCaseById(10L)).thenReturn(medicalCase);
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(invocation -> {
            Prescription prescription = invocation.getArgument(0);
            prescription.setId(41L);
            return prescription;
        });

        Prescription created = prescriptionService.createDraft(10L, request());

        assertEquals(PrescriptionStatus.DRAFT, created.getStatus());
        assertEquals("John Doe", created.getPatientNameSnapshot());
        assertEquals("Amoxicillin", created.getItems().get(0).getMedicationName());
        assertEquals("doctorOne", created.getCreatedBy());
        verify(auditEventService).recordEvent(
                eq("PRESCRIPTION"), eq(41L), eq("PRESCRIPTION_DRAFT_CREATED"), contains("caseId=10"));
    }

    @Test
    void issue_assignsImmutableReferenceAndAuditEvent() {
        authenticateDoctor();
        Prescription prescription = draftPrescription();
        when(prescriptionRepository.findById(41L)).thenReturn(Optional.of(prescription));
        when(prescriptionRepository.save(prescription)).thenReturn(prescription);

        Prescription issued = prescriptionService.issue(41L);

        assertEquals(PrescriptionStatus.ISSUED, issued.getStatus());
        assertNotNull(issued.getIssuedAt());
        assertEquals("RX-" + issued.getIssuedAt().getYear() + "-000041", issued.getPrescriptionNumber());
        verify(auditEventService).recordEvent(
                eq("PRESCRIPTION"), eq(41L), eq("PRESCRIPTION_ISSUED"), contains("RX-"));
    }

    @Test
    void updateDraft_rejectsIssuedPrescription() {
        Prescription prescription = draftPrescription();
        prescription.setStatus(PrescriptionStatus.ISSUED);
        when(prescriptionRepository.findById(41L)).thenReturn(Optional.of(prescription));

        assertThrows(IllegalStateException.class, () -> prescriptionService.updateDraft(41L, request()));
        verify(prescriptionRepository, never()).save(any(Prescription.class));
    }

    @Test
    void voidPrescription_retainsRecordAndReason() {
        Prescription prescription = draftPrescription();
        prescription.setStatus(PrescriptionStatus.ISSUED);
        prescription.setPrescriptionNumber("RX-2026-000041");
        when(prescriptionRepository.findById(41L)).thenReturn(Optional.of(prescription));
        when(prescriptionRepository.save(prescription)).thenReturn(prescription);

        Prescription voided = prescriptionService.voidPrescription(41L, "Entered for the wrong patient");

        assertEquals(PrescriptionStatus.VOIDED, voided.getStatus());
        assertEquals("Entered for the wrong patient", voided.getVoidReason());
        assertNotNull(voided.getVoidedAt());
    }

    @Test
    void createDraft_rejectsClosedCase() {
        when(medicalCaseService.getCaseById(10L)).thenReturn(medicalCase(CaseStatus.CLOSED));

        assertThrows(IllegalStateException.class, () -> prescriptionService.createDraft(10L, request()));
        verify(prescriptionRepository, never()).save(any(Prescription.class));
    }

    private void authenticateDoctor() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));
    }

    private PrescriptionUpsertRequest request() {
        return new PrescriptionUpsertRequest(
                PrescriptionType.MEDICATION,
                "Dr. Test",
                "Doctor",
                "CNOM-123",
                "Cabinet Test",
                "1 Avenue Mohammed V, Rabat",
                "+212 500 000 000",
                "Take with food",
                List.of(new PrescriptionItemRequest(
                        "Amoxicillin", "500 mg", "Capsule", "1 capsule", "Oral",
                        "Three times daily", "7 days", "21", "After meals")));
    }

    private Prescription draftPrescription() {
        MedicalCase medicalCase = medicalCase(CaseStatus.OPEN);
        Prescription prescription = new Prescription();
        prescription.setId(41L);
        prescription.setMedicalCase(medicalCase);
        prescription.setStatus(PrescriptionStatus.DRAFT);
        prescription.setPrescriberName("Dr. Test");
        prescription.setPrescriberTitle("Doctor");
        prescription.setPracticeAddress("1 Avenue Mohammed V, Rabat");
        prescription.setPatientNameSnapshot("John Doe");
        prescription.setPatientNumberSnapshot("MT-2026-000001");
        prescription.setPatientDateOfBirthSnapshot(LocalDate.of(1990, 1, 1));
        prescriptionServiceItem(prescription);
        return prescription;
    }

    private void prescriptionServiceItem(Prescription prescription) {
        com.doctorapp.medicaltracker.model.PrescriptionItem item =
                new com.doctorapp.medicaltracker.model.PrescriptionItem();
        item.setPrescription(prescription);
        item.setMedicationName("Amoxicillin");
        prescription.getItems().add(item);
    }

    private MedicalCase medicalCase(CaseStatus status) {
        Patient patient = new Patient();
        patient.setId(1L);
        patient.setFirstName("John");
        patient.setLastName("Doe");
        patient.setPatientNumber("MT-2026-000001");
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));

        MedicalCase medicalCase = new MedicalCase();
        medicalCase.setId(10L);
        medicalCase.setTitle("Follow-up");
        medicalCase.setStatus(status);
        medicalCase.setPatient(patient);
        return medicalCase;
    }
}
