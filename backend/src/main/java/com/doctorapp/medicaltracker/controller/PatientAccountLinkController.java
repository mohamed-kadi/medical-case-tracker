package com.doctorapp.medicaltracker.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.doctorapp.medicaltracker.dto.PatientAccountCandidateResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkPatientResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkResponse;
import com.doctorapp.medicaltracker.dto.VerifyPatientAccountLinkRequest;
import com.doctorapp.medicaltracker.service.PatientAccountLinkService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient-account-links")
@RequiredArgsConstructor
public class PatientAccountLinkController {

    private final PatientAccountLinkService patientAccountLinkService;

    @GetMapping("/patient")
    public ResponseEntity<PatientAccountLinkPatientResponse> getPatientByNumber(
            @RequestParam String patientNumber) {
        return ResponseEntity.ok(patientAccountLinkService.getPatientByNumber(patientNumber));
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<PatientAccountCandidateResponse>> searchPatientAccounts(
            @RequestParam String query) {
        return ResponseEntity.ok(patientAccountLinkService.searchPatientAccounts(query));
    }

    @PostMapping("/verify")
    public ResponseEntity<PatientAccountLinkResponse> verifyLink(
            @Valid @RequestBody VerifyPatientAccountLinkRequest request) {
        PatientAccountLinkResponse response = patientAccountLinkService.verifyLink(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
