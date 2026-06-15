package com.doctorapp.medicaltracker.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.dto.PatientAccountCandidateResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkPatientResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkResponse;
import com.doctorapp.medicaltracker.model.PatientAccountLinkStatus;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;
import com.doctorapp.medicaltracker.service.PatientAccountLinkService;

@WebMvcTest(PatientAccountLinkController.class)
@AutoConfigureMockMvc(addFilters = false)
class PatientAccountLinkControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PatientAccountLinkService patientAccountLinkService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void getPatientByNumber_returnsPatientLinkStatus() throws Exception {
        when(patientAccountLinkService.getPatientByNumber("MT-2026-000007"))
                .thenReturn(new PatientAccountLinkPatientResponse(
                        7L,
                        "MT-2026-000007",
                        "Nora",
                        "Rami",
                        LocalDate.of(1992, 1, 10),
                        "nora@clinic.com",
                        "+212600000000",
                        PatientStatus.ACTIVE,
                        "patient1",
                        "patient@clinic.com",
                        LocalDateTime.of(2026, 6, 3, 10, 15)));

        mockMvc.perform(get("/api/patient-account-links/patient")
                .param("patientNumber", "MT-2026-000007"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientNumber").value("MT-2026-000007"))
                .andExpect(jsonPath("$.verifiedUsername").value("patient1"));
    }

    @Test
    void searchPatientAccounts_returnsCandidates() throws Exception {
        when(patientAccountLinkService.searchPatientAccounts("patient"))
                .thenReturn(List.of(new PatientAccountCandidateResponse(4L, "patient1", "patient@clinic.com")));

        mockMvc.perform(get("/api/patient-account-links/accounts")
                .param("query", "patient"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("patient1"))
                .andExpect(jsonPath("$[0].email").value("patient@clinic.com"));
    }

    @Test
    void verifyLink_returnsCreatedVerifiedLink() throws Exception {
        when(patientAccountLinkService.verifyLink(any()))
                .thenReturn(new PatientAccountLinkResponse(
                        9L,
                        4L,
                        "patient1",
                        "patient@clinic.com",
                        7L,
                        "MT-2026-000007",
                        "Nora Rami",
                        PatientAccountLinkStatus.VERIFIED,
                        "FRONT_DESK_CARD",
                        "frontdesk1",
                        LocalDateTime.of(2026, 6, 3, 10, 15)));

        mockMvc.perform(post("/api/patient-account-links/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "patientNumber": "MT-2026-000007",
                          "username": "patient1",
                          "verificationMethod": "FRONT_DESK_CARD"
                        }
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.username").value("patient1"))
                .andExpect(jsonPath("$.patientNumber").value("MT-2026-000007"));
    }
}
