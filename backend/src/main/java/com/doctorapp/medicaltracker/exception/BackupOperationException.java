package com.doctorapp.medicaltracker.exception;

public class BackupOperationException extends RuntimeException {

    public BackupOperationException(String message) {
        super(message);
    }

    public BackupOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
