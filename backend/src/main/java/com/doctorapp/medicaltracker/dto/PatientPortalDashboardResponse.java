package com.doctorapp.medicaltracker.dto;

import java.util.List;

public record PatientPortalDashboardResponse(
        String username,
        String email,
        PatientPortalPatientResponse patient,
        List<PatientPortalAppointmentResponse> upcomingAppointments) {
}
