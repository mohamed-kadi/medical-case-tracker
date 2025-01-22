package com.doctorapp.medicaltracker.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.service.MedicalCaseService;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class MedicalCaseController {

    private final MedicalCaseService medicalCaseService;

    @PostMapping("/patients/{patientId}")
    public ResponseEntity<MedicalCase> createCase(@PathVariable Long patientId,
            @Valid @RequestBody MedicalCase medicalCase) {
        MedicalCase createdCase = medicalCaseService.createCase(patientId, medicalCase);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdCase.getId())
                .toUri();

        return ResponseEntity.created(location).body(createdCase);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MedicalCase> getCaseById(@PathVariable Long id) {
        MedicalCase medicalCase = medicalCaseService.getCaseById(id);
        return ResponseEntity.ok(medicalCase);
    }

    @GetMapping("/patients/{patientId}")
    public ResponseEntity<List<MedicalCase>> getCasesByPatientId(@PathVariable Long patientId) {
        List<MedicalCase> cases = medicalCaseService.getCasesByPatientId(patientId);
        return ResponseEntity.ok(cases);
    }

    @GetMapping("/patients/{patientId}/active")
    public ResponseEntity<List<MedicalCase>> getActivePatientCases(@PathVariable Long patientId) {
        List<MedicalCase> activeCases = medicalCaseService.getActivePatientCases(patientId);
        return ResponseEntity.ok(activeCases);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MedicalCase> updateCase(@PathVariable Long id, @Valid @RequestBody MedicalCase caseDetails) {
        MedicalCase updatedCase = medicalCaseService.updateCase(id, caseDetails);
        return ResponseEntity.ok(updatedCase);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MedicalCase> updateCaseStatus(@PathVariable Long id,
            @Valid @RequestBody CaseStatus newStatus) {
        MedicalCase updatedCase = medicalCaseService.updateCaseStatus(id, newStatus);
        return ResponseEntity.ok(updatedCase);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCase(@PathVariable Long id) {
         medicalCaseService.deleteCase(id);
        return ResponseEntity.noContent().build();
    }

}
