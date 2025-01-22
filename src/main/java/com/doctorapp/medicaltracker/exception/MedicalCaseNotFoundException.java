package com.doctorapp.medicaltracker.exception;

public class MedicalCaseNotFoundException extends RuntimeException {

    public MedicalCaseNotFoundException(Long id) {
        super("Medical case not found with id: " +id);
    }


}
