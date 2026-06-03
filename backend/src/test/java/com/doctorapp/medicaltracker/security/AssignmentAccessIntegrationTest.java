package com.doctorapp.medicaltracker.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.nullValue;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.model.Appointment;
import com.doctorapp.medicaltracker.model.AppointmentStatus;
import com.doctorapp.medicaltracker.model.ImageCategory;
import com.doctorapp.medicaltracker.model.MedicalImage;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.repository.AppointmentRepository;
import com.doctorapp.medicaltracker.repository.MedicalCaseRepository;
import com.doctorapp.medicaltracker.repository.MedicalImageRepository;
import com.doctorapp.medicaltracker.repository.PatientRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AssignmentAccessIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private MedicalCaseRepository medicalCaseRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicalImageRepository medicalImageRepository;

    private Patient doctorOnePatient;
    private Patient doctorTwoPatient;
    private Patient staffOnePatient;
    private MedicalCase doctorOneCase;
    private MedicalCase doctorTwoCase;
    private Appointment doctorOneAppointment;
    private Appointment doctorTwoAppointment;

    @BeforeEach
    void setUp() {
        medicalImageRepository.deleteAll();
        appointmentRepository.deleteAll();
        medicalCaseRepository.deleteAll();
        patientRepository.deleteAll();

        doctorOnePatient = patient("John", "DoctorOne", "john.doctor1@clinic.com");
        doctorOnePatient.setAssignedDoctorUsername("doctorOne");

        doctorTwoPatient = patient("Jane", "DoctorTwo", "jane.doctor2@clinic.com");
        doctorTwoPatient.setAssignedDoctorUsername("doctorTwo");

        staffOnePatient = patient("Sam", "StaffOne", "sam.staff1@clinic.com");
        staffOnePatient.setAssignedFrontDeskUsername("staffOne");

        doctorOnePatient = patientRepository.save(doctorOnePatient);
        doctorTwoPatient = patientRepository.save(doctorTwoPatient);
        staffOnePatient = patientRepository.save(staffOnePatient);

        doctorOneCase = medicalCaseRepository.save(caseForPatient(doctorOnePatient, "DoctorOne case"));
        doctorTwoCase = medicalCaseRepository.save(caseForPatient(doctorTwoPatient, "DoctorTwo case"));
        doctorOneAppointment = appointmentRepository
                .save(appointmentForPatient(doctorOnePatient, LocalDateTime.of(2030, 1, 5, 10, 0)));
        doctorTwoAppointment = appointmentRepository
                .save(appointmentForPatient(doctorTwoPatient, LocalDateTime.of(2030, 1, 6, 10, 0)));

        medicalImageRepository.save(imageForCase(doctorOneCase, "doctor-one-progress.jpg", "doctorOne"));
    }

    @Test
    @WithMockUser(username = "adminUser", roles = "ADMIN")
    void patientsList_whenAdmin_returnsAllPatients() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    @WithMockUser(username = "doctorOne", roles = "DOCTOR")
    void patientsList_whenDoctor_returnsOnlyAssignedPatients() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(doctorOnePatient.getId()));
    }

    @Test
    @WithMockUser(username = "staffOne", roles = "FRONT_DESK")
    void patientsList_whenFrontDesk_returnsAllPatientsWithClinicalFieldsHidden() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].medicalHistory").value(nullValue()));
    }

    @Test
    @WithMockUser(username = "staffOne", roles = "FRONT_DESK")
    void caseById_whenFrontDeskRequestsCase_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/cases/{id}", doctorOneCase.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctorOne", roles = "DOCTOR")
    void patientById_whenDoctorRequestsUnassignedPatient_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/patients/{id}", doctorTwoPatient.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You are not allowed to access this patient"));
    }

    @Test
    @WithMockUser(username = "doctorOne", roles = "DOCTOR")
    void caseById_whenDoctorRequestsUnassignedCase_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/cases/{id}", doctorTwoCase.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You are not allowed to access this patient"));
    }

    @Test
    @WithMockUser(username = "doctorOne", roles = "DOCTOR")
    void caseById_whenDoctorRequestsAssignedCase_returnsOk() throws Exception {
        mockMvc.perform(get("/api/cases/{id}", doctorOneCase.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(doctorOneCase.getId()));
    }

    @Test
    @WithMockUser(username = "doctorOne", roles = "DOCTOR")
    void imagesByCase_whenDoctorRequestsAssignedCase_returnsOk() throws Exception {
        mockMvc.perform(get("/api/images/case/{caseId}", doctorOneCase.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser(username = "doctorOne", roles = "DOCTOR")
    void imagesByCase_whenDoctorRequestsUnassignedCase_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/images/case/{caseId}", doctorTwoCase.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You are not allowed to access this patient"));
    }

    @Test
    @WithMockUser(username = "doctorOne", roles = "DOCTOR")
    void upcomingAppointments_whenDoctor_requestsOnlyAssignedAppointments() throws Exception {
        mockMvc.perform(get("/api/appointments/upcoming")
                .param("from", "2029-12-31T00:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(doctorOneAppointment.getId()));
    }

    @Test
    @WithMockUser(username = "doctorOne", roles = "DOCTOR")
    void appointmentById_whenDoctorRequestsUnassignedAppointment_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/appointments/{id}", doctorTwoAppointment.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You are not allowed to access this patient"));
    }

    private Patient patient(String firstName, String lastName, String email) {
        Patient patient = new Patient();
        patient.setFirstName(firstName);
        patient.setLastName(lastName);
        patient.setEmail(email);
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));
        patient.setMedicalHistory("confidential clinical history");
        patient.setStatus(PatientStatus.ACTIVE);
        return patient;
    }

    private MedicalCase caseForPatient(Patient patient, String title) {
        MedicalCase medicalCase = new MedicalCase();
        medicalCase.setPatient(patient);
        medicalCase.setTitle(title);
        medicalCase.setDescription("desc");
        medicalCase.setTreatmentPlan("plan");
        medicalCase.setStatus(CaseStatus.OPEN);
        return medicalCase;
    }

    private Appointment appointmentForPatient(Patient patient, LocalDateTime scheduledAt) {
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setScheduledAt(scheduledAt);
        appointment.setReason("Follow-up");
        appointment.setNotes("notes");
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        return appointment;
    }

    private MedicalImage imageForCase(MedicalCase medicalCase, String fileName, String uploadedBy) {
        MedicalImage image = new MedicalImage();
        image.setMedicalCase(medicalCase);
        image.setFileName(fileName);
        image.setContentType("image/jpeg");
        image.setMimeType("image/jpeg");
        image.setPath("/tmp/" + fileName);
        image.setCategory(ImageCategory.BEFORE_TREATMENT);
        image.setSize(1024L);
        image.setUploadedBy(uploadedBy);
        return image;
    }
}
