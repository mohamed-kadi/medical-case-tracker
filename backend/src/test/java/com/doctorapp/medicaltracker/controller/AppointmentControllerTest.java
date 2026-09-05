package com.doctorapp.medicaltracker.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.exception.AppointmentConflictException;
import com.doctorapp.medicaltracker.model.AppointmentStatus;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;
import com.doctorapp.medicaltracker.service.AppointmentService;

@WebMvcTest(AppointmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppointmentService appointmentService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void createAppointment_whenPayloadIsValid_returnsCreatedAppointment() throws Exception {
        Appointment appointment = new Appointment();
        appointment.setId(7L);
        appointment.setScheduledAt(LocalDateTime.of(2026, 4, 20, 10, 0));
        appointment.setReason("Routine check");
        appointment.setNotes("Bring reports");
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setPatient(patient(3L, "MT-2026-000003", "Jane", "Doe"));

        when(appointmentService.createAppointment(org.mockito.ArgumentMatchers.eq(3L), org.mockito.ArgumentMatchers.any(Appointment.class)))
                .thenReturn(appointment);

        mockMvc.perform(post("/api/appointments/patients/3")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "scheduledAt": "2026-04-20T10:00:00",
                          "reason": "Routine check",
                          "notes": "Bring reports"
                        }
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7L))
                .andExpect(jsonPath("$.patientId").value(3L))
                .andExpect(jsonPath("$.patientNumber").value("MT-2026-000003"))
                .andExpect(jsonPath("$.patientName").value("Jane Doe"))
                .andExpect(jsonPath("$.reason").value("Routine check"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    void getUpcomingAppointments_returnsList() throws Exception {
        Appointment appointment = new Appointment();
        appointment.setId(11L);
        appointment.setScheduledAt(LocalDateTime.of(2026, 4, 22, 14, 30));
        appointment.setReason("Follow-up");
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setPatient(patient(5L, "MT-2026-000005", "John", "Smith"));

        when(appointmentService.getUpcomingAppointments(LocalDateTime.of(2026, 4, 21, 0, 0), null))
                .thenReturn(List.of(appointment));

        mockMvc.perform(get("/api/appointments/upcoming")
                .param("from", "2026-04-21T00:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(11L))
                .andExpect(jsonPath("$[0].patientName").value("John Smith"));
    }

    @Test
    void getCheckedInAppointments_returnsPatientIdentity() throws Exception {
        Appointment appointment = new Appointment();
        appointment.setId(13L);
        appointment.setScheduledAt(LocalDateTime.of(2026, 4, 22, 14, 30));
        appointment.setReason("Follow-up");
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        appointment.setPatient(patient(5L, "MT-2026-000005", "John", "Smith"));
        when(appointmentService.getCheckedInAppointments()).thenReturn(List.of(appointment));

        mockMvc.perform(get("/api/appointments/checked-in"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(13L))
                .andExpect(jsonPath("$[0].patientNumber").value("MT-2026-000005"))
                .andExpect(jsonPath("$[0].patientName").value("John Smith"))
                .andExpect(jsonPath("$[0].status").value("CHECKED_IN"));
    }

    @Test
    void createAppointment_whenSlotConflicts_returnsLocalizedErrorCode() throws Exception {
        when(appointmentService.createAppointment(org.mockito.ArgumentMatchers.eq(3L), org.mockito.ArgumentMatchers.any(Appointment.class)))
                .thenThrow(new AppointmentConflictException());

        mockMvc.perform(post("/api/appointments/patients/3")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "scheduledAt": "2030-04-20T10:00:00",
                          "reason": "Routine check"
                        }
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("APPOINTMENT_TIME_CONFLICT"));
    }

    @Test
    void updateAppointmentStatus_whenPayloadIsValid_returnsUpdatedAppointment() throws Exception {
        Appointment appointment = new Appointment();
        appointment.setId(12L);
        appointment.setScheduledAt(LocalDateTime.of(2026, 4, 22, 14, 30));
        appointment.setReason("Follow-up");
        appointment.setStatus(AppointmentStatus.CANCELLED);

        when(appointmentService.updateAppointmentStatus(12L, AppointmentStatus.CANCELLED))
                .thenReturn(appointment);

        mockMvc.perform(patch("/api/appointments/12/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "status": "CANCELLED"
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(12L))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    private Patient patient(Long id, String patientNumber, String firstName, String lastName) {
        Patient patient = new Patient();
        patient.setId(id);
        patient.setPatientNumber(patientNumber);
        patient.setFirstName(firstName);
        patient.setLastName(lastName);
        return patient;
    }
}
