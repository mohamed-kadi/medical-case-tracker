package com.doctorapp.medicaltracker.service.impl;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.doctorapp.medicaltracker.exception.PatientNotFoundException;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.repository.PatientRepository;
import com.doctorapp.medicaltracker.service.PatientService;

import org.springframework.transaction.annotation.Transactional;
import lombok.AllArgsConstructor;

@Service // Marks this as a service component
@AllArgsConstructor //
@RequiredArgsConstructor // Creates constructor with final fields
@Transactional // makes all methods transactional
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow( () -> new PatientNotFoundException(id));

    }

    @Override
    @Transactional(readOnly = true)
    public List<Patient> searchPatientsByLastName(String lastName) {
        if(lastName == null || lastName.trim().isEmpty()) {
            throw new IllegalArgumentException("Last name cannot be null or empty");
        }
       return patientRepository.findByLastNameContainingIgnoreCase(lastName.trim());
    }

    @Override
    public Patient createPatient(Patient patient) {
        // add validation logic
        if (!isEmailAvailable(patient.getEmail())) {
            throw new IllegalStateException("Email is already taken:" + patient.getEmail());
        }
        validatePatient(patient);
                return patientRepository.save(patient);
            }
               
    @Override
    public Patient updatePatient(Long id, Patient patientDetails) {
        Patient existingPatient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));
        validatePatient(existingPatient);
        
        try {
            updatePatientFields(existingPatient, patientDetails);
                        return patientRepository.save(existingPatient);
                    }catch (DataIntegrityViolationException exception) {
                        throw new IllegalStateException("Email is already taken:" + patientDetails.getEmail());
                    }
                }
            
                private void updatePatientFields(Patient existingPatient, Patient patientDetails) {
                    existingPatient.setFirstName(patientDetails.getFirstName());
                    existingPatient.setLastName(patientDetails.getLastName());
                    existingPatient.setDateOfBirth(patientDetails.getDateOfBirth());
                    existingPatient.setEmail(patientDetails.getEmail());
                    existingPatient.setPhoneNumber(patientDetails.getPhoneNumber());
                    existingPatient.setMedicalHistory(patientDetails.getMedicalHistory());
                    existingPatient.setStatus(patientDetails.getStatus());
                }
            
    @Override
    public void deletePatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));
        patient.setStatus(PatientStatus.ARCHIVED);
        patientRepository.save(patient);
    }
  
    @Override
    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return !patientRepository.existsByEmail(email);
    }

    // helper method to validate patient before creating or updating
    private void validatePatient(Patient patient) {
        if (patient.getDateOfBirth() == null) {
            throw new IllegalArgumentException("Date of birth cannot be null");
        }
        if (patient.getEmail() == null || patient.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        if (patient.getFirstName() == null || patient.getFirstName().trim().isEmpty()) {
            throw new IllegalArgumentException("First name cannot be null or empty");
        }
    }

}
