package com.doctorapp.medicaltracker.service.impl;

import java.util.List;

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
import com.doctorapp.medicaltracker.service.MedicalCaseService;
import com.doctorapp.medicaltracker.service.PatientService;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalCaseServiceImpl implements MedicalCaseService {

    private final MedicalCaseRepository medicalCaseRepository;
    private final PatientService patientService;

    @Override
    @Transactional
    public MedicalCase createCase(Long patientId, MedicalCase medicalCase) {
        try {
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
            return medicalCaseRepository.save(medicalCase);

        } catch (Exception e) {
            log.error("Error creating medical case for patient ID: {}", patientId, e);
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalCase getCaseById(Long id) {
        return medicalCaseRepository.findById(id)
                .orElseThrow(() -> { 
                    log.error("Medical case not found with ID: {}", id);
                    return new MedicalCaseNotFoundException(id);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalCase> getCasesByPatientId(Long patientId) {
        try {
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
        } catch (Exception e) {
            log.error("Error retrieving cases for patient ID: {}", patientId, e);
            throw new RuntimeException("Failed to retrieve medical cases", e);
        }
        
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicalCase> getActivePatientCases(Long patientId) {
        try {
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
        } catch (Exception e) {
            log.error("Error retrieving active cases for patient ID: {}", patientId, e);
            throw new RuntimeException("Failed to retrieve active medical cases", e);
        }
    }

    @Override
    @Transactional
    public MedicalCase updateCase(Long id, MedicalCase caseDetails) {
        try {
            MedicalCase existingCase = getCaseById(id);
            // validate updates 
            if (caseDetails != null) {
                if (caseDetails.getTitle().trim().isEmpty()) {
                    throw new IllegalArgumentException("Case title cannot be empty");
                }
                existingCase.setTitle(caseDetails.getTitle());
            }
            existingCase.setDescription(caseDetails.getDescription());
            existingCase.setTreatmentPlan(caseDetails.getTreatmentPlan());

            log.info("Updating medical case ID: {}", id);

            return medicalCaseRepository.save(existingCase);

        } catch (MedicalCaseNotFoundException e) {
            log.error("Failed to update: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error updating medical case ID: {}", id, e);
            throw new RuntimeException("Failed to update medical case", e);
        

        }
    }

    @Override
    public MedicalCase updateCaseStatus(Long id, CaseStatus newStatus) {
        try {
            if (newStatus == null) {
                throw new IllegalArgumentException("New status is required");
            }

            MedicalCase existingCase = medicalCaseRepository.findById(id)
                    .orElseThrow(() -> new MedicalCaseNotFoundException(id));

            //Prevent invalid status transitions
            if (!isValidStatusTransition(existingCase.getStatus(), newStatus)) {
                throw new InvalidCaseStatusException(
                        "Invalid status transition from " + existingCase.getStatus() + " to " + newStatus);
            }

            existingCase.setStatus(newStatus);
            log.info("Updated status of medical case ID: {} from {} to {}", id, existingCase.getStatus(), newStatus);

            return medicalCaseRepository.save(existingCase);

        } catch (MedicalCaseNotFoundException | InvalidCaseStatusException e) {
            log.error("Failed to update case status: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error updating status for medical case ID: {}", id, e);
            throw new RuntimeException("Failed to update case status", e);
        }
    }
    
    public boolean isValidStatusTransition(CaseStatus currentStatus, CaseStatus newStatus) {
        if (currentStatus == newStatus) {
            return true;
        }
        switch (currentStatus) {
            case OPEN:
            // from OPEN, we can only move to IN_PROGRESS 
            return newStatus == CaseStatus.IN_PROGRESS;
            case IN_PROGRESS:
                return newStatus == CaseStatus.RESOLVED;
            case RESOLVED:
                return newStatus == CaseStatus.CLOSED;
            case CLOSED:
                return false;
            default:
                return false;
        }
    }

    @Override
    public void deleteCase(Long id) {
        try {
            MedicalCase medicalCase = medicalCaseRepository.findById(id).orElseThrow(() -> new MedicalCaseNotFoundException(id));
            if (medicalCase.getStatus() == CaseStatus.IN_PROGRESS) {
                throw new RuntimeException("Cannot delete case in progress");
            }
            log.info("Deleting medical case ID: {}", id);
             medicalCaseRepository.delete(medicalCase);   
        } catch (MedicalCaseNotFoundException e) {
            log.error("Failed to delete operation: {}", e.getMessage());
            throw e;
        } catch (IllegalStateException e) {
            log.error("Invalid delete operation: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error deleting medical case ID: {}", id, e);
            throw new RuntimeException("Failed to delete medical case", e);
        }
   
    }

    

}
