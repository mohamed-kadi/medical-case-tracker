package com.doctorapp.medicaltracker.service;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface PatientService {

    List<Patient> getAllPatients();

    Page<Patient> getPatientPage(String query, PatientStatus status, Pageable pageable);

    Patient getPatientById(Long id);

    void assertCurrentUserCanAccessPatient(Patient patient);

    Patient assignPatient(Long id, String doctorUsername, String frontDeskUsername);

    List<Patient> searchPatientsByLastName(String lastName);
    
    Patient createPatient(Patient patient);

    Patient updatePatient(Long id, Patient patient);
    
    Patient updatePatientStatus(Long id, PatientStatus status);
    
    void deletePatient(Long id);

    boolean isEmailAvailable(String email);

    


    
}
