package com.doctorapp.medicaltracker.exception;

public class AppointmentConflictException extends RuntimeException {

    public AppointmentConflictException() {
        super("This appointment time is already booked for the patient or assigned doctor");
    }
}
