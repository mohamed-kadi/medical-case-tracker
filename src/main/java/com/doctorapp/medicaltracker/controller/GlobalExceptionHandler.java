package com.doctorapp.medicaltracker.controller;

import java.io.IOException;
//import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
//import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;

import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.doctorapp.medicaltracker.exception.InvalidCaseStatusException;
import com.doctorapp.medicaltracker.exception.MedicalCaseNotFoundException;
import com.doctorapp.medicaltracker.exception.PatientNotFoundException;

@RestControllerAdvice   // Marks this as a Rest Controller Advice
public class GlobalExceptionHandler {

    // handle patient not found exception
    @ExceptionHandler(PatientNotFoundException.class)
    public ResponseEntity<Map<String, String>> handlePatientNotFound(PatientNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    // handle validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    // handle all other exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    ///////////////////////////// Medical case handles

    @ExceptionHandler(MedicalCaseNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleMedicalCaseNotFound(MedicalCaseNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    // custom error class (DTO)

    // @ExceptionHandler(MedicalCaseNotFoundException.class)
    // public ResponseEntity<ErrorResponse> handleMedicalCaseNotFound(MedicalCaseNotFoundException ex) {
    //     ErrorResponse error = new ErrorResponse(
    //         ex.getMessage(),
    //         HttpStatus.NOT_FOUND.value(),
    //         LocalDateTime.now().toString()
    //     );
    //     return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    // }

    @ExceptionHandler(InvalidCaseStatusException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCaseStatus(InvalidCaseStatusException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // This can handle cases where status transition is invalid
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    ////////////////////////////////// image handles
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleGenericException(RuntimeException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.toString());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "File size exceeds maximum limit");
        errorResponse.put("status", HttpStatus.PAYLOAD_TOO_LARGE.toString());
        return new ResponseEntity<>(errorResponse, HttpStatus.PAYLOAD_TOO_LARGE);
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, String>> handleIOException(IOException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Error processing file");
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.toString());
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.toString());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

}
