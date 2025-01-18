package com.doctorapp.medicaltracker.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.service.PatientService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController // Marks this as a Rest Controller
@RequestMapping("/api/patients") // Base URL for all enpoints
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    
    @GetMapping
        public ResponseEntity<List<Patient>> getAllPatients() {
        List<Patient> patients = patientService.getAllPatients();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/{id}")    
        public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        Patient patient = patientService.getPatientById(id);
        return ResponseEntity.ok(patient);
    }

    @PostMapping // POST /api/patients - Create new patient
        public ResponseEntity<Patient> createPatient(@Valid @RequestBody Patient patient) {
        Patient newPatient = patientService.createPatient(patient);

        // create a url for the new patient
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(newPatient.getId())
                .toUri();
        // Return 201 Created status and the created patient
        return ResponseEntity.created(location).body(newPatient);
    }

    // PUT /api/patients/{id} - Update existing patient
    @PutMapping("/{id}")
        public ResponseEntity<Patient> updatePatient(@PathVariable Long id, @Valid @RequestBody Patient patientDetails) {
        Patient updatedPatient = patientService.updatePatient(id, patientDetails);
        return ResponseEntity.ok(updatedPatient);
    }

    // DELETE /api/patients/{id} - Delete patient
    @DeleteMapping("/{id}")
        public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/patients/search?lastName=Smith - Search patients by last name
    @GetMapping("/search")
    public ResponseEntity<?> searchPatientsByLastName(@RequestParam String lastName) {
    List<Patient> patients = patientService.searchPatientsByLastName(lastName);
    if (patients.isEmpty()) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "No patients found with last name: " + lastName);
        return ResponseEntity.ok(response);
    }
    return ResponseEntity.ok(patients);
}
     
     // GET /api/patients/check-email?email=test@example.com - Check if email exists
     @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmailAvailability(@RequestParam String email) {
    boolean isAvailable = patientService.isEmailAvailable(email);
    return ResponseEntity.ok(Map.of("isAvailable", isAvailable));
}
        

}
