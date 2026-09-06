package com.doctorapp.medicaltracker.service.impl;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.doctorapp.medicaltracker.exception.PatientNotFoundException;
import com.doctorapp.medicaltracker.exception.InvalidCaseStatusException;
import com.doctorapp.medicaltracker.exception.MedicalCaseNotFoundException;
import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.repository.MedicalCaseRepository;
import com.doctorapp.medicaltracker.service.AuditEventService;
import com.doctorapp.medicaltracker.service.MedicalCaseService;
import com.doctorapp.medicaltracker.service.PatientService;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalCaseServiceImpl implements MedicalCaseService {

    private static final String AUDIT_ENTITY_TYPE = "MEDICAL_CASE";
    private static final String CASE_MUTATION_FORBIDDEN_MESSAGE = "Only doctors can modify medical cases";
    private static final String CASE_ACCESS_FORBIDDEN_MESSAGE = "Only doctors can access medical cases";

    private final MedicalCaseRepository medicalCaseRepository;
    private final PatientService patientService;
    private final AuditEventService auditEventService;
    
    
    @Override
    @Transactional
    public MedicalCase createCase(Long patientId, MedicalCase medicalCase) {
        try {
            assertCurrentUserCanModifyCases();
            Patient patient = patientService.getPatientById(patientId);
            
            // Check if patient is active
            if (patient.getStatus() != PatientStatus.ACTIVE) {
                throw new IllegalStateException(
                    "Cannot create case: Patient is " + patient.getStatus()
                );
            }

            if (medicalCase == null || medicalCase.getTitle() == null 
                || medicalCase.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Case title is required");
            }

            medicalCase.setPatient(patient);
            medicalCase.setStatus(CaseStatus.OPEN);
            
            log.info("Creating new medical case for patient ID: {}", patientId);
            MedicalCase savedCase = medicalCaseRepository.save(medicalCase);
            auditEventService.recordEvent(
                    AUDIT_ENTITY_TYPE,
                    savedCase.getId(),
                    "CASE_CREATED",
                    "patientId=" + patientId + ",status=" + savedCase.getStatus());
            return savedCase;

        } catch (Exception e) {
            log.error("Error creating medical case for patient ID: {}", patientId, e);
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalCase getCaseById(Long id) {
        assertCurrentUserCanAccessCases();
        MedicalCase medicalCase = medicalCaseRepository.findByIdWithPatient(id)
                .orElseThrow(() -> { 
                    log.error("Medical case not found with ID: {}", id);
                    return new MedicalCaseNotFoundException(id);
                });
        patientService.assertCurrentUserCanAccessPatient(medicalCase.getPatient());
        return medicalCase;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalCase> getCasesByPatientId(Long patientId) {
        try {
            assertCurrentUserCanAccessCases();
            // First verify the patient exists
            patientService.getPatientById(patientId); // This will throw PatientNotFoundException if not found
            List<MedicalCase> cases = medicalCaseRepository.findByPatientId(patientId);
            log.info("Retrieved {} cases for patient ID: {}", cases.size(), patientId);

            if(cases.isEmpty()){
                log.info("No medical cases found for patient ID: {}", patientId);
                // We could either return empty list or throw exception
                return cases;
                // OR throw new RuntimeException("No cases found for patient ID: " + patientId);
            }
            return cases;

        } catch (PatientNotFoundException e) {
            log.error("Failed to get cases: Patient not found with ID: {}", patientId);
            throw e;
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving cases for patient ID: {}", patientId, e);
            throw new RuntimeException("Failed to retrieve medical cases", e);
        }
        
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalCase> getActivePatientCases(Long patientId) {
        try {
            assertCurrentUserCanAccessCases();
            patientService.getPatientById(patientId);
            List<MedicalCase> activeCases = medicalCaseRepository.findByPatientIdAndStatus(patientId, CaseStatus.IN_PROGRESS);
            log.info("Retrieved {} active cases for patient ID: {}", activeCases.size(), patientId);

            if(activeCases.isEmpty()){
                log.info("No active medical cases found for patient ID: {}", patientId);
                return activeCases;
            }
            return activeCases;
        } catch (PatientNotFoundException e) {
            log.error("Failed to get active cases: Patient not found with ID: {}", patientId);
            throw e;
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving active cases for patient ID: {}", patientId, e);
            throw new RuntimeException("Failed to retrieve active medical cases", e);
        }
    }

    @Override
    @Transactional
    public MedicalCase updateCase(Long id, MedicalCase caseDetails) {
        try {
            assertCurrentUserCanModifyCases();
            MedicalCase existingCase = getCaseById(id);
            if (caseDetails == null) {
                return existingCase;
            }
            CaseStatus previousStatus = existingCase.getStatus();

            // validate updates 
            if (caseDetails.getTitle() != null) {
                if (caseDetails.getTitle().trim().isEmpty()) {
                    throw new IllegalArgumentException("Case title cannot be empty");
                }
                existingCase.setTitle(caseDetails.getTitle());
            }
            existingCase.setDescription(caseDetails.getDescription());
            existingCase.setTreatmentPlan(caseDetails.getTreatmentPlan());
            if (caseDetails.getStatus() != null && caseDetails.getStatus() != previousStatus) {
                if (!isValidStatusTransition(previousStatus, caseDetails.getStatus())) {
                    throw new InvalidCaseStatusException(
                            "Invalid status transition from " + previousStatus + " to " + caseDetails.getStatus());
                }
                existingCase.setStatus(caseDetails.getStatus());
            }

            log.info("Updating medical case ID: {}", id);

            MedicalCase savedCase = medicalCaseRepository.save(existingCase);
            auditEventService.recordEvent(
                    AUDIT_ENTITY_TYPE,
                    savedCase.getId(),
                    "CASE_UPDATED",
                    "titleUpdated=" + (caseDetails.getTitle() != null));
            if (previousStatus != savedCase.getStatus()) {
                auditEventService.recordEvent(
                        AUDIT_ENTITY_TYPE,
                        savedCase.getId(),
                        "CASE_STATUS_UPDATED",
                        "status=" + previousStatus + "->" + savedCase.getStatus());
            }
            return savedCase;

        } catch (MedicalCaseNotFoundException e) {
            log.error("Failed to update: {}", e.getMessage());
            throw e;
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating medical case ID: {}", id, e);
            throw new RuntimeException("Failed to update medical case", e);
        

        }
    }

    @Override
    @Transactional
    public MedicalCase updateCaseStatus(Long id, CaseStatus newStatus) {
        try {
            assertCurrentUserCanModifyCases();
            if (newStatus == null) {
                throw new IllegalArgumentException("New status is required");
            }

            MedicalCase existingCase = getCaseById(id);
            CaseStatus previousStatus = existingCase.getStatus();

            //Prevent invalid status transitions
            if (!isValidStatusTransition(previousStatus, newStatus)) {
                throw new InvalidCaseStatusException(
                        "Invalid status transition from " + previousStatus + " to " + newStatus);
            }

            existingCase.setStatus(newStatus);
            log.info("Updated status of medical case ID: {} from {} to {}", id, previousStatus, newStatus);

            MedicalCase savedCase = medicalCaseRepository.save(existingCase);
            auditEventService.recordEvent(
                    AUDIT_ENTITY_TYPE,
                    savedCase.getId(),
                    "CASE_STATUS_UPDATED",
                    "status=" + previousStatus + "->" + newStatus);
            return savedCase;

        } catch (MedicalCaseNotFoundException | InvalidCaseStatusException e) {
            log.error("Failed to update case status: {}", e.getMessage());
            throw e;
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error updating status for medical case ID: {}", id, e);
            throw new RuntimeException("Failed to update case status", e);
        }
    }
    
    public boolean isValidStatusTransition(CaseStatus currentStatus, CaseStatus newStatus) {
        return currentStatus != null && newStatus != null;
    }

    @Override
    public void deleteCase(Long id) {
        try {
            assertCurrentUserCanModifyCases();
            MedicalCase medicalCase = getCaseById(id);
            if (medicalCase.getStatus() == CaseStatus.IN_PROGRESS) {
                throw new IllegalStateException("Cannot delete case in progress");
            }
            log.info("Deleting medical case ID: {}", id);
            medicalCaseRepository.delete(medicalCase);
            auditEventService.recordEvent(
                    AUDIT_ENTITY_TYPE,
                    id,
                    "CASE_DELETED",
                    "status=" + medicalCase.getStatus());
        } catch (MedicalCaseNotFoundException e) {
            log.error("Failed to delete operation: {}", e.getMessage());
            throw e;
        } catch (AccessDeniedException e) {
            throw e;
        } catch (IllegalStateException e) {
            log.error("Invalid delete operation: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error deleting medical case ID: {}", id, e);
            throw new RuntimeException("Failed to delete medical case", e);
        }
   
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalCase getMedicalCase(Long caseId) {
        return getCaseById(caseId);
    }

    private void assertCurrentUserCanModifyCases() {
        assertCurrentUserCanAccessCases(CASE_MUTATION_FORBIDDEN_MESSAGE);
    }

    private void assertCurrentUserCanAccessCases() {
        assertCurrentUserCanAccessCases(CASE_ACCESS_FORBIDDEN_MESSAGE);
    }

    private void assertCurrentUserCanAccessCases(String message) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return;
        }

        if (hasAuthority(authentication, "ROLE_DOCTOR")) {
            return;
        }

        throw new AccessDeniedException(message);
    }

    private boolean hasAuthority(Authentication authentication, String authority) {
        return authentication.getAuthorities()
                .stream()
                .anyMatch(grantedAuthority -> authority.equals(grantedAuthority.getAuthority()));
    }

    

}
