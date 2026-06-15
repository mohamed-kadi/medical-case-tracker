package com.doctorapp.medicaltracker.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.dto.PatientPortalAppointmentResponse;
import com.doctorapp.medicaltracker.dto.PatientPortalDashboardResponse;
import com.doctorapp.medicaltracker.dto.PatientPortalPatientResponse;
import com.doctorapp.medicaltracker.model.AppointmentStatus;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;
import com.doctorapp.medicaltracker.service.PatientPortalService;

@WebMvcTest(PatientPortalController.class)
@AutoConfigureMockMvc(addFilters = false)
class PatientPortalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PatientPortalService patientPortalService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void getDashboard_returnsPatientPortalDashboard() throws Exception {
        PatientPortalDashboardResponse response = new PatientPortalDashboardResponse(
                "patient1",
                "patient@clinic.com",
                new PatientPortalPatientResponse(
                        7L,
                        "MT-2026-0007",
                        "Nora",
                        "Rami",
                        LocalDate.of(1992, 1, 10),
                        "patient@clinic.com",
                        "+212600000000",
                        PatientStatus.ACTIVE,
                        "doctorOne",
                        "receptionOne"),
                List.of(new PatientPortalAppointmentResponse(
                        20L,
                        LocalDateTime.of(2026, 7, 5, 10, 30),
                        "Consultation",
                        AppointmentStatus.SCHEDULED)));

        when(patientPortalService.getDashboard()).thenReturn(response);

        mockMvc.perform(get("/api/patient-portal/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("patient1"))
                .andExpect(jsonPath("$.patient.patientNumber").value("MT-2026-0007"))
                .andExpect(jsonPath("$.upcomingAppointments[0].reason").value("Consultation"));
    }
}
