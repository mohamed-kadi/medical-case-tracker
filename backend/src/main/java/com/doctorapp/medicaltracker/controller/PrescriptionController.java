package com.doctorapp.medicaltracker.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.doctorapp.medicaltracker.dto.PrescriptionResponse;
import com.doctorapp.medicaltracker.dto.PrescriptionUpsertRequest;
import com.doctorapp.medicaltracker.dto.PrescriptionVoidRequest;
import com.doctorapp.medicaltracker.model.Prescription;
import com.doctorapp.medicaltracker.service.PrescriptionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping("/cases/{caseId}")
    public ResponseEntity<List<PrescriptionResponse>> getByCaseId(@PathVariable Long caseId) {
        return ResponseEntity.ok(prescriptionService.getByCaseId(caseId).stream()
                .map(PrescriptionResponse::from)
                .toList());
    }

    @GetMapping("/patients/{patientId}")
    public ResponseEntity<List<PrescriptionResponse>> getByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getByPatientId(patientId).stream()
                .map(PrescriptionResponse::from)
                .toList());
    }

    @PostMapping("/cases/{caseId}")
    public ResponseEntity<PrescriptionResponse> createDraft(
            @PathVariable Long caseId,
            @Valid @RequestBody PrescriptionUpsertRequest request) {
        Prescription created = prescriptionService.createDraft(caseId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/prescriptions/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(PrescriptionResponse.from(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrescriptionResponse> updateDraft(
            @PathVariable Long id,
            @Valid @RequestBody PrescriptionUpsertRequest request) {
        return ResponseEntity.ok(PrescriptionResponse.from(prescriptionService.updateDraft(id, request)));
    }

    @PostMapping("/{id}/issue")
    public ResponseEntity<PrescriptionResponse> issue(@PathVariable Long id) {
        return ResponseEntity.ok(PrescriptionResponse.from(prescriptionService.issue(id)));
    }

    @PostMapping("/{id}/print")
    public ResponseEntity<PrescriptionResponse> recordPrint(@PathVariable Long id) {
        return ResponseEntity.ok(PrescriptionResponse.from(prescriptionService.recordPrint(id)));
    }

    @PostMapping("/{id}/void")
    public ResponseEntity<PrescriptionResponse> voidPrescription(
            @PathVariable Long id,
            @Valid @RequestBody PrescriptionVoidRequest request) {
        return ResponseEntity.ok(PrescriptionResponse.from(
                prescriptionService.voidPrescription(id, request.reason())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        prescriptionService.deleteDraft(id);
        return ResponseEntity.noContent().build();
    }
}
