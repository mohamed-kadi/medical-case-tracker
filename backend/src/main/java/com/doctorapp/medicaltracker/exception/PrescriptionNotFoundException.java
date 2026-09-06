package com.doctorapp.medicaltracker.exception;

public class PrescriptionNotFoundException extends RuntimeException {
    public PrescriptionNotFoundException(Long id) {
        super("Prescription not found with id: " + id);
    }
}
