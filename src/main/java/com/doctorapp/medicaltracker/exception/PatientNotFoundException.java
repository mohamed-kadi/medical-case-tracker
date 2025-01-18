package com.doctorapp.medicaltracker.exception;

public class PatientNotFoundException extends RuntimeException {
    public PatientNotFoundException(Long id) {
        super("Patient not found with the given id:" + id);
     
    }

}
