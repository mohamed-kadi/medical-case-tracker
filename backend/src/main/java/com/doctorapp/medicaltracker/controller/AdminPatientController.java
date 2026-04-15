package com.doctorapp.medicaltracker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.doctorapp.medicaltracker.dto.AdminAssignPatientRequest;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/patients")
@RequiredArgsConstructor
public class AdminPatientController {

    private final PatientService patientService;

    @PatchMapping("/{id}/assignment")
    public ResponseEntity<Patient> assignPatient(
            @PathVariable Long id,
            @RequestBody AdminAssignPatientRequest request) {
        Patient updatedPatient = patientService.assignPatient(
                id,
                request == null ? null : request.getDoctorUsername(),
                request == null ? null : request.getStaffUsername());
        return ResponseEntity.ok(updatedPatient);
    }
}
