package com.doctorapp.medicaltracker.controller;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.doctorapp.medicaltracker.dto.AppointmentStatusUpdateRequest;
import com.doctorapp.medicaltracker.dto.AppointmentResponse;
import com.doctorapp.medicaltracker.dto.PageResponse;
import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/patients/{patientId}")
    public ResponseEntity<AppointmentResponse> createAppointment(
            @PathVariable Long patientId,
            @Valid @RequestBody Appointment appointment) {
        Appointment createdAppointment = appointmentService.createAppointment(patientId, appointment);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdAppointment.getId())
                .toUri();
        return ResponseEntity.created(location).body(AppointmentResponse.from(createdAppointment));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable Long id) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(AppointmentResponse.from(appointment));
    }

    @GetMapping("/patients/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatientId(patientId).stream()
                .map(AppointmentResponse::from)
                .toList());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<AppointmentResponse>> getUpcomingAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(appointmentService.getUpcomingAppointments(from, to).stream()
                .map(AppointmentResponse::from)
                .toList());
    }

    @GetMapping("/upcoming/page")
    public ResponseEntity<PageResponse<AppointmentResponse>> getUpcomingAppointmentPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        return ResponseEntity.ok(PageResponse.from(
                appointmentService.getUpcomingAppointmentPage(from, PageRequest.of(safePage, safeSize))
                        .map(AppointmentResponse::from)));
    }

    @GetMapping("/checked-in")
    public ResponseEntity<List<AppointmentResponse>> getCheckedInAppointments() {
        return ResponseEntity.ok(appointmentService.getCheckedInAppointments().stream()
                .map(AppointmentResponse::from)
                .toList());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody Appointment appointmentDetails) {
        Appointment updatedAppointment = appointmentService.updateAppointment(id, appointmentDetails);
        return ResponseEntity.ok(AppointmentResponse.from(updatedAppointment));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponse> updateAppointmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentStatusUpdateRequest request) {
        Appointment updatedAppointment = appointmentService.updateAppointmentStatus(id, request.getStatus());
        return ResponseEntity.ok(AppointmentResponse.from(updatedAppointment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}
