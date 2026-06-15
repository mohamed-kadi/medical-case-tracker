package com.doctorapp.medicaltracker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.doctorapp.medicaltracker.dto.PatientPortalDashboardResponse;
import com.doctorapp.medicaltracker.service.PatientPortalService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient-portal")
@RequiredArgsConstructor
public class PatientPortalController {

    private final PatientPortalService patientPortalService;

    @GetMapping("/dashboard")
    public ResponseEntity<PatientPortalDashboardResponse> getDashboard() {
        return ResponseEntity.ok(patientPortalService.getDashboard());
    }
}
