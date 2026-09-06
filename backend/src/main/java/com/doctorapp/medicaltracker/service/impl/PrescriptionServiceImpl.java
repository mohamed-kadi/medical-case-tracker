package com.doctorapp.medicaltracker.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.doctorapp.medicaltracker.dto.PrescriptionItemRequest;
import com.doctorapp.medicaltracker.dto.PrescriptionUpsertRequest;
import com.doctorapp.medicaltracker.exception.PrescriptionNotFoundException;
import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.Prescription;
import com.doctorapp.medicaltracker.model.PrescriptionItem;
import com.doctorapp.medicaltracker.model.PrescriptionStatus;
import com.doctorapp.medicaltracker.model.PrescriptionType;
import com.doctorapp.medicaltracker.repository.PrescriptionRepository;
import com.doctorapp.medicaltracker.service.AuditEventService;
import com.doctorapp.medicaltracker.service.MedicalCaseService;
import com.doctorapp.medicaltracker.service.PatientService;
import com.doctorapp.medicaltracker.service.PrescriptionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private static final String AUDIT_ENTITY_TYPE = "PRESCRIPTION";

    private final PrescriptionRepository prescriptionRepository;
    private final MedicalCaseService medicalCaseService;
    private final PatientService patientService;
    private final AuditEventService auditEventService;

    @Override
    @Transactional(readOnly = true)
    public List<Prescription> getByCaseId(Long caseId) {
        medicalCaseService.getCaseById(caseId);
        return prescriptionRepository.findByMedicalCaseIdOrderByCreatedAtDesc(caseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Prescription> getByPatientId(Long patientId) {
        patientService.getPatientById(patientId);
        return prescriptionRepository.findByMedicalCasePatientIdOrderByCreatedAtDesc(patientId);
    }

    @Override
    public Prescription createDraft(Long caseId, PrescriptionUpsertRequest request) {
        MedicalCase medicalCase = medicalCaseService.getCaseById(caseId);
        assertCaseAcceptsPrescriptions(medicalCase);

        Prescription prescription = new Prescription();
        prescription.setMedicalCase(medicalCase);
        prescription.setStatus(PrescriptionStatus.DRAFT);
        prescription.setCreatedBy(currentUsername());
        snapshotPatient(prescription, medicalCase.getPatient());
        applyDraft(prescription, request);

        Prescription saved = prescriptionRepository.save(prescription);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE, saved.getId(), "PRESCRIPTION_DRAFT_CREATED", "caseId=" + caseId);
        return saved;
    }

    @Override
    public Prescription updateDraft(Long id, PrescriptionUpsertRequest request) {
        Prescription prescription = getAccessiblePrescription(id);
        assertDraft(prescription);
        assertCaseAcceptsPrescriptions(prescription.getMedicalCase());
        applyDraft(prescription, request);

        Prescription saved = prescriptionRepository.save(prescription);
        auditEventService.recordEvent(AUDIT_ENTITY_TYPE, id, "PRESCRIPTION_DRAFT_UPDATED", null);
        return saved;
    }

    @Override
    public Prescription issue(Long id) {
        Prescription prescription = getAccessiblePrescription(id);
        assertDraft(prescription);
        assertCaseAcceptsPrescriptions(prescription.getMedicalCase());
        validateReadyToIssue(prescription);
        snapshotPatient(prescription, prescription.getMedicalCase().getPatient());
        prescription.setStatus(PrescriptionStatus.ISSUED);
        prescription.setIssuedAt(LocalDateTime.now());
        prescription.setPrescriptionNumber("RX-%d-%06d".formatted(
                prescription.getIssuedAt().getYear(), prescription.getId()));

        Prescription saved = prescriptionRepository.save(prescription);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE, id, "PRESCRIPTION_ISSUED", "number=" + saved.getPrescriptionNumber());
        return saved;
    }

    @Override
    public Prescription recordPrint(Long id) {
        Prescription prescription = getAccessiblePrescription(id);
        if (prescription.getStatus() != PrescriptionStatus.ISSUED) {
            throw new IllegalStateException("Only an issued prescription can be printed");
        }
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE, id, "PRESCRIPTION_PRINTED", "number=" + prescription.getPrescriptionNumber());
        return prescription;
    }

    @Override
    public Prescription voidPrescription(Long id, String reason) {
        Prescription prescription = getAccessiblePrescription(id);
        if (prescription.getStatus() != PrescriptionStatus.ISSUED) {
            throw new IllegalStateException("Only an issued prescription can be voided");
        }
        String normalizedReason = required(reason, "A reason is required to void a prescription");
        prescription.setStatus(PrescriptionStatus.VOIDED);
        prescription.setVoidedAt(LocalDateTime.now());
        prescription.setVoidReason(normalizedReason);

        Prescription saved = prescriptionRepository.save(prescription);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE, id, "PRESCRIPTION_VOIDED", "reason=" + normalizedReason);
        return saved;
    }

    @Override
    public void deleteDraft(Long id) {
        Prescription prescription = getAccessiblePrescription(id);
        assertDraft(prescription);
        prescriptionRepository.delete(prescription);
        auditEventService.recordEvent(AUDIT_ENTITY_TYPE, id, "PRESCRIPTION_DRAFT_DELETED", null);
    }

    private Prescription getAccessiblePrescription(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new PrescriptionNotFoundException(id));
        patientService.assertCurrentUserCanAccessPatient(prescription.getMedicalCase().getPatient());
        return prescription;
    }

    private void applyDraft(Prescription prescription, PrescriptionUpsertRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Prescription payload is required");
        }
        prescription.setType(request.type() == null ? PrescriptionType.MEDICATION : request.type());
        prescription.setPrescriberName(required(request.prescriberName(), "Prescriber name is required"));
        prescription.setPrescriberTitle(required(request.prescriberTitle(), "Prescriber title is required"));
        prescription.setProfessionalId(optional(request.professionalId()));
        prescription.setPracticeName(optional(request.practiceName()));
        prescription.setPracticeAddress(required(request.practiceAddress(), "Practice address is required"));
        prescription.setPracticePhone(optional(request.practicePhone()));
        prescription.setGeneralInstructions(optional(request.generalInstructions()));

        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("At least one medication is required");
        }
        prescription.getItems().clear();
        for (int index = 0; index < request.items().size(); index++) {
            PrescriptionItemRequest itemRequest = request.items().get(index);
            PrescriptionItem item = new PrescriptionItem();
            item.setPrescription(prescription);
            item.setPosition(index);
            item.setMedicationName(required(itemRequest.medicationName(), "Medication name is required"));
            item.setStrength(optional(itemRequest.strength()));
            item.setPharmaceuticalForm(optional(itemRequest.pharmaceuticalForm()));
            item.setDose(optional(itemRequest.dose()));
            item.setRoute(optional(itemRequest.route()));
            item.setFrequency(optional(itemRequest.frequency()));
            item.setDuration(optional(itemRequest.duration()));
            item.setQuantity(optional(itemRequest.quantity()));
            item.setInstructions(optional(itemRequest.instructions()));
            prescription.getItems().add(item);
        }
    }

    private void validateReadyToIssue(Prescription prescription) {
        required(prescription.getPrescriberName(), "Prescriber name is required before issue");
        required(prescription.getPrescriberTitle(), "Prescriber title is required before issue");
        required(prescription.getPracticeAddress(), "Practice address is required before issue");
        if (prescription.getItems().isEmpty()) {
            throw new IllegalStateException("At least one medication is required before issue");
        }
    }

    private void assertDraft(Prescription prescription) {
        if (prescription.getStatus() != PrescriptionStatus.DRAFT) {
            throw new IllegalStateException("Issued or voided prescriptions cannot be edited or deleted");
        }
    }

    private void assertCaseAcceptsPrescriptions(MedicalCase medicalCase) {
        if (medicalCase.getStatus() != CaseStatus.OPEN && medicalCase.getStatus() != CaseStatus.IN_PROGRESS) {
            throw new IllegalStateException("Prescriptions can only be created or edited for an open case");
        }
    }

    private void snapshotPatient(Prescription prescription, Patient patient) {
        prescription.setPatientNameSnapshot((patient.getFirstName() + " " + patient.getLastName()).trim());
        prescription.setPatientNumberSnapshot(patient.getPatientNumber());
        prescription.setPatientDateOfBirthSnapshot(patient.getDateOfBirth());
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return "system";
        }
        return authentication.getName();
    }

    private String required(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String optional(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }
}
