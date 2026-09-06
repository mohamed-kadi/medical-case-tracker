package com.doctorapp.medicaltracker.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginEndpointShouldBePublic() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patientsEndpointShouldRejectAnonymousAccess() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "patientUser", roles = "PATIENT")
    void patientsEndpointShouldRejectPatientRole() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void patientsEndpointShouldAllowDoctorRole() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void patientsGetEndpointShouldAllowAdminRole() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void patientsCreateEndpointShouldRejectAdminRole() throws Exception {
        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void patientsCreateEndpointShouldAllowDoctorRole() throws Exception {
        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "staffUser", roles = "FRONT_DESK")
    void patientsCreateEndpointShouldAllowFrontDeskRole() throws Exception {
        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "patientUser", roles = "PATIENT")
    void appointmentsEndpointShouldRejectPatientRole() throws Exception {
        mockMvc.perform(get("/api/appointments/upcoming"))
                .andExpect(status().isForbidden());
    }

    @Test
    void patientPortalEndpointShouldRejectAnonymousAccess() throws Exception {
        mockMvc.perform(get("/api/patient-portal/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void patientPortalEndpointShouldRejectDoctorRole() throws Exception {
        mockMvc.perform(get("/api/patient-portal/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void patientAccountLinkEndpointShouldRejectDoctorRole() throws Exception {
        mockMvc.perform(get("/api/patient-account-links/accounts")
                .param("query", "patient"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "patientUser", roles = "PATIENT")
    void patientAccountLinkEndpointShouldRejectPatientRole() throws Exception {
        mockMvc.perform(get("/api/patient-account-links/accounts")
                .param("query", "patient"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "staffUser", roles = "FRONT_DESK")
    void patientAccountLinkEndpointShouldAllowFrontDeskRole() throws Exception {
        mockMvc.perform(get("/api/patient-account-links/accounts")
                .param("query", "patient"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void patientAccountLinkEndpointShouldAllowAdminRole() throws Exception {
        mockMvc.perform(get("/api/patient-account-links/accounts")
                .param("query", "patient"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void appointmentsEndpointShouldRejectAdminRole() throws Exception {
        mockMvc.perform(get("/api/appointments/upcoming"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "staffUser", roles = "FRONT_DESK")
    void appointmentsEndpointShouldAllowFrontDeskRole() throws Exception {
        mockMvc.perform(get("/api/appointments/upcoming"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "staffUser", roles = "FRONT_DESK")
    void appointmentsStatusEndpointShouldAllowFrontDeskRole() throws Exception {
        mockMvc.perform(patch("/api/appointments/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "status": "CANCELLED"
                        }
                        """))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void casesEndpointShouldRejectAdminRole() throws Exception {
        mockMvc.perform(get("/api/cases/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void casesEndpointShouldAllowDoctorRole() throws Exception {
        mockMvc.perform(get("/api/cases/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "staffUser", roles = "FRONT_DESK")
    void casesGetEndpointShouldRejectFrontDeskRole() throws Exception {
        mockMvc.perform(get("/api/cases/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "staffUser", roles = "FRONT_DESK")
    void casesCreateEndpointShouldRejectFrontDeskRole() throws Exception {
        mockMvc.perform(post("/api/cases/patients/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void casesCreateEndpointShouldAllowDoctorRole() throws Exception {
        mockMvc.perform(post("/api/cases/patients/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void prescriptionsEndpointShouldRejectAnonymousAccess() throws Exception {
        mockMvc.perform(get("/api/prescriptions/cases/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void prescriptionsEndpointShouldAllowDoctorRole() throws Exception {
        mockMvc.perform(get("/api/prescriptions/cases/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "staffUser", roles = "FRONT_DESK")
    void prescriptionsEndpointShouldRejectFrontDeskRole() throws Exception {
        mockMvc.perform(get("/api/prescriptions/cases/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void prescriptionsEndpointShouldRejectAdminRole() throws Exception {
        mockMvc.perform(get("/api/prescriptions/cases/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void imagesEndpointShouldRejectAdminRole() throws Exception {
        mockMvc.perform(get("/api/images/case/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "staffUser", roles = "FRONT_DESK")
    void imagesEndpointShouldRejectFrontDeskRole() throws Exception {
        mockMvc.perform(get("/api/images/case/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void adminUserProvisionEndpointShouldRejectDoctorRole() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void adminUserProvisionEndpointShouldAllowAdminRole() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "doctorUser", roles = "DOCTOR")
    void patientAssignmentEndpointShouldRejectDoctorRole() throws Exception {
        mockMvc.perform(patch("/api/admin/patients/1/assignment")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void patientAssignmentEndpointShouldAllowAdminRole() throws Exception {
        mockMvc.perform(patch("/api/admin/patients/999/assignment")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isNotFound());
    }
}
