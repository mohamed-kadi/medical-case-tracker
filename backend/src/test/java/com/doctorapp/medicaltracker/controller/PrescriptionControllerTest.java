package com.doctorapp.medicaltracker.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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

import com.doctorapp.medicaltracker.dto.PrescriptionUpsertRequest;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.model.Prescription;
import com.doctorapp.medicaltracker.model.PrescriptionItem;
import com.doctorapp.medicaltracker.model.PrescriptionStatus;
import com.doctorapp.medicaltracker.model.PrescriptionType;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;
import com.doctorapp.medicaltracker.service.PrescriptionService;

@WebMvcTest(PrescriptionController.class)
@AutoConfigureMockMvc(addFilters = false)
class PrescriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PrescriptionService prescriptionService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void createDraft_whenPayloadIsValid_returnsStructuredPrescription() throws Exception {
        Prescription prescription = prescription(PrescriptionStatus.DRAFT);
        when(prescriptionService.createDraft(eq(10L), any(PrescriptionUpsertRequest.class)))
                .thenReturn(prescription);

        mockMvc.perform(post("/api/prescriptions/cases/10")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/prescriptions/41"))
                .andExpect(jsonPath("$.id").value(41L))
                .andExpect(jsonPath("$.caseId").value(10L))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.patientNumber").value("MT-2026-000001"))
                .andExpect(jsonPath("$.items[0].medicationName").value("Amoxicillin"));
    }

    @Test
    void createDraft_whenMedicationIsMissing_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/prescriptions/cases/10")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "prescriberName": "Dr. Test",
                          "prescriberTitle": "Doctor",
                          "practiceAddress": "1 Avenue Mohammed V, Rabat",
                          "items": []
                        }
                        """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getByPatientId_returnsIssuedHistory() throws Exception {
        Prescription prescription = prescription(PrescriptionStatus.ISSUED);
        prescription.setPrescriptionNumber("RX-2026-000041");
        prescription.setIssuedAt(LocalDateTime.of(2026, 9, 6, 10, 30));
        when(prescriptionService.getByPatientId(1L)).thenReturn(List.of(prescription));

        mockMvc.perform(get("/api/prescriptions/patients/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].prescriptionNumber").value("RX-2026-000041"))
                .andExpect(jsonPath("$[0].caseTitle").value("Follow-up"))
                .andExpect(jsonPath("$[0].status").value("ISSUED"));
    }

    @Test
    void issue_returnsLockedIssuedPrescription() throws Exception {
        Prescription prescription = prescription(PrescriptionStatus.ISSUED);
        prescription.setPrescriptionNumber("RX-2026-000041");
        prescription.setIssuedAt(LocalDateTime.of(2026, 9, 6, 10, 30));
        when(prescriptionService.issue(41L)).thenReturn(prescription);

        mockMvc.perform(post("/api/prescriptions/41/issue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ISSUED"))
                .andExpect(jsonPath("$.prescriptionNumber").value("RX-2026-000041"));
    }

    @Test
    void voidPrescription_requiresReason() throws Exception {
        mockMvc.perform(post("/api/prescriptions/41/void")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    private Prescription prescription(PrescriptionStatus status) {
        MedicalCase medicalCase = new MedicalCase();
        medicalCase.setId(10L);
        medicalCase.setTitle("Follow-up");

        Prescription prescription = new Prescription();
        prescription.setId(41L);
        prescription.setMedicalCase(medicalCase);
        prescription.setType(PrescriptionType.MEDICATION);
        prescription.setStatus(status);
        prescription.setPrescriberName("Dr. Test");
        prescription.setPrescriberTitle("Doctor");
        prescription.setPracticeAddress("1 Avenue Mohammed V, Rabat");
        prescription.setPatientNameSnapshot("John Doe");
        prescription.setPatientNumberSnapshot("MT-2026-000001");
        prescription.setPatientDateOfBirthSnapshot(LocalDate.of(1990, 1, 1));
        prescription.setCreatedBy("doctorOne");
        prescription.setCreatedAt(LocalDateTime.of(2026, 9, 6, 10, 0));
        prescription.setUpdatedAt(LocalDateTime.of(2026, 9, 6, 10, 0));

        PrescriptionItem item = new PrescriptionItem();
        item.setId(51L);
        item.setPrescription(prescription);
        item.setPosition(0);
        item.setMedicationName("Amoxicillin");
        item.setStrength("500 mg");
        prescription.getItems().add(item);
        return prescription;
    }

    private String validPayload() {
        return """
                {
                  "type": "MEDICATION",
                  "prescriberName": "Dr. Test",
                  "prescriberTitle": "Doctor",
                  "professionalId": "CNOM-123",
                  "practiceName": "Cabinet Test",
                  "practiceAddress": "1 Avenue Mohammed V, Rabat",
                  "practicePhone": "+212 500 000 000",
                  "generalInstructions": "Take with food",
                  "items": [{
                    "medicationName": "Amoxicillin",
                    "strength": "500 mg",
                    "dose": "1 capsule",
                    "route": "Oral",
                    "frequency": "Three times daily",
                    "duration": "7 days",
                    "quantity": "21"
                  }]
                }
                """;
    }
}
