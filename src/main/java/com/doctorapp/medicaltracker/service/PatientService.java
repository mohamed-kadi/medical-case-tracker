package com.doctorapp.medicaltracker.service;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;

import java.util.List;


public interface PatientService {

    List<Patient> getAllPatients();

    Patient getPatientById(Long id);

    List<Patient> searchPatientsByLastName(String lastName);
    
    Patient createPatient(Patient patient);

    Patient updatePatient(Long id, Patient patient);
    
    Patient updatePatientStatus(Long id, PatientStatus status);
    
    void deletePatient(Long id);

    boolean isEmailAvailable(String email);

    


    
}
