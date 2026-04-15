package com.doctorapp.medicaltracker.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;
import com.doctorapp.medicaltracker.service.PatientService;

@WebMvcTest(AdminPatientController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminPatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PatientService patientService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void assignPatient_whenPayloadIsValid_returnsUpdatedPatient() throws Exception {
        Patient patient = new Patient();
        patient.setId(10L);
        patient.setFirstName("John");
        patient.setLastName("Doe");
        patient.setEmail("john@clinic.com");
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));
        patient.setStatus(PatientStatus.ACTIVE);
        patient.setAssignedDoctorUsername("doctorOne");
        patient.setAssignedStaffUsername("staffOne");

        when(patientService.assignPatient(10L, "doctorOne", "staffOne")).thenReturn(patient);

        mockMvc.perform(patch("/api/admin/patients/10/assignment")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "doctorUsername": "doctorOne",
                          "staffUsername": "staffOne"
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.assignedDoctorUsername").value("doctorOne"))
                .andExpect(jsonPath("$.assignedStaffUsername").value("staffOne"));
    }
}
