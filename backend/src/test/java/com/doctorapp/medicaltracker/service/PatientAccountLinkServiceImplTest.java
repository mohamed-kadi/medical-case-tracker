package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.doctorapp.medicaltracker.dto.PatientAccountLinkPatientResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkResponse;
import com.doctorapp.medicaltracker.dto.VerifyPatientAccountLinkRequest;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientAccountLink;
import com.doctorapp.medicaltracker.model.PatientAccountLinkStatus;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.PatientAccountLinkRepository;
import com.doctorapp.medicaltracker.repository.PatientRepository;
import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.service.impl.PatientAccountLinkServiceImpl;

@ExtendWith(MockitoExtension.class)
class PatientAccountLinkServiceImplTest {

    @Mock
    private AuditEventService auditEventService;

    @Mock
    private PatientAccountLinkRepository patientAccountLinkRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PatientAccountLinkServiceImpl patientAccountLinkService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getPatientByNumber_whenVerifiedLinkExists_returnsPatientAndLinkedAccount() {
        Patient patient = patient(7L, "MT-2026-000007");
        User account = patientAccount(4L, "patient1", "patient@clinic.com");
        PatientAccountLink link = verifiedLink(9L, account, patient);

        when(patientRepository.findByPatientNumberIgnoreCase("MT-2026-000007")).thenReturn(Optional.of(patient));
        when(patientAccountLinkRepository.findFirstByPatientIdAndStatusOrderByVerifiedAtDesc(
                7L,
                PatientAccountLinkStatus.VERIFIED)).thenReturn(Optional.of(link));

        PatientAccountLinkPatientResponse response = patientAccountLinkService.getPatientByNumber(" MT-2026-000007 ");

        assertEquals("MT-2026-000007", response.patientNumber());
        assertEquals("patient1", response.verifiedUsername());
        assertEquals("patient@clinic.com", response.verifiedEmail());
    }

    @Test
    void searchPatientAccounts_returnsEnabledPatientCandidates() {
        User account = patientAccount(4L, "patient1", "patient@clinic.com");
        when(userRepository.searchEnabledPatientAccounts("patient")).thenReturn(List.of(account));

        var candidates = patientAccountLinkService.searchPatientAccounts(" patient ");

        assertEquals(1, candidates.size());
        assertEquals("patient1", candidates.get(0).username());
    }

    @Test
    void verifyLink_whenValidRequest_createsVerifiedLinkAndAuditEvent() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("frontdesk1", "n/a", "ROLE_FRONT_DESK"));

        Patient patient = patient(7L, "MT-2026-000007");
        User account = patientAccount(4L, "patient1", "patient@clinic.com");

        when(patientRepository.findByPatientNumberIgnoreCase("MT-2026-000007")).thenReturn(Optional.of(patient));
        when(userRepository.findByUsername("patient1")).thenReturn(Optional.of(account));
        when(patientAccountLinkRepository.findFirstByUserIdAndPatientIdAndStatus(
                4L,
                7L,
                PatientAccountLinkStatus.VERIFIED)).thenReturn(Optional.empty());
        when(patientAccountLinkRepository.findFirstByUserIdAndStatusOrderByVerifiedAtDesc(
                4L,
                PatientAccountLinkStatus.VERIFIED)).thenReturn(Optional.empty());
        when(patientAccountLinkRepository.findFirstByPatientIdAndStatusOrderByVerifiedAtDesc(
                7L,
                PatientAccountLinkStatus.VERIFIED)).thenReturn(Optional.empty());
        when(patientAccountLinkRepository.findFirstByUserIdAndPatientIdAndStatus(
                4L,
                7L,
                PatientAccountLinkStatus.PENDING)).thenReturn(Optional.empty());
        when(patientAccountLinkRepository.save(any(PatientAccountLink.class))).thenAnswer(invocation -> {
            PatientAccountLink saved = invocation.getArgument(0);
            saved.setId(9L);
            return saved;
        });

        PatientAccountLinkResponse response = patientAccountLinkService.verifyLink(request());

        assertEquals(PatientAccountLinkStatus.VERIFIED, response.status());
        assertEquals("frontdesk1", response.verifiedByUsername());
        assertEquals("FRONT_DESK_CARD", response.verificationMethod());

        ArgumentCaptor<PatientAccountLink> linkCaptor = ArgumentCaptor.forClass(PatientAccountLink.class);
        verify(patientAccountLinkRepository).save(linkCaptor.capture());
        assertEquals(account, linkCaptor.getValue().getUser());
        assertEquals(patient, linkCaptor.getValue().getPatient());
        assertEquals(PatientAccountLinkStatus.VERIFIED, linkCaptor.getValue().getStatus());

        verify(auditEventService).recordEvent(
                "PATIENT",
                7L,
                "PATIENT_ACCOUNT_LINK_VERIFIED",
                "patientNumber=MT-2026-000007,username=patient1,method=FRONT_DESK_CARD");
    }

    @Test
    void verifyLink_whenAccountAlreadyLinkedToDifferentPatient_throwsIllegalStateException() {
        Patient patient = patient(7L, "MT-2026-000007");
        Patient otherPatient = patient(8L, "MT-2026-000008");
        User account = patientAccount(4L, "patient1", "patient@clinic.com");

        when(patientRepository.findByPatientNumberIgnoreCase("MT-2026-000007")).thenReturn(Optional.of(patient));
        when(userRepository.findByUsername("patient1")).thenReturn(Optional.of(account));
        when(patientAccountLinkRepository.findFirstByUserIdAndPatientIdAndStatus(
                4L,
                7L,
                PatientAccountLinkStatus.VERIFIED)).thenReturn(Optional.empty());
        when(patientAccountLinkRepository.findFirstByUserIdAndStatusOrderByVerifiedAtDesc(
                4L,
                PatientAccountLinkStatus.VERIFIED)).thenReturn(Optional.of(verifiedLink(10L, account, otherPatient)));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> patientAccountLinkService.verifyLink(request()));

        assertEquals("Patient account is already linked to patient number MT-2026-000008", exception.getMessage());
    }

    private VerifyPatientAccountLinkRequest request() {
        VerifyPatientAccountLinkRequest request = new VerifyPatientAccountLinkRequest();
        request.setPatientNumber("MT-2026-000007");
        request.setUsername("patient1");
        request.setVerificationMethod("FRONT_DESK_CARD");
        return request;
    }

    private User patientAccount(Long id, String username, String email) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword("encoded");
        user.setRole(UserRole.PATIENT);
        user.setEnabled(true);
        return user;
    }

    private Patient patient(Long id, String patientNumber) {
        Patient patient = new Patient();
        patient.setId(id);
        patient.setPatientNumber(patientNumber);
        patient.setFirstName("Nora");
        patient.setLastName("Rami");
        patient.setDateOfBirth(LocalDate.of(1992, 1, 10));
        patient.setEmail("nora@clinic.com");
        patient.setPhoneNumber("+212600000000");
        patient.setStatus(PatientStatus.ACTIVE);
        return patient;
    }

    private PatientAccountLink verifiedLink(Long id, User user, Patient patient) {
        PatientAccountLink link = new PatientAccountLink();
        link.setId(id);
        link.setUser(user);
        link.setPatient(patient);
        link.setStatus(PatientAccountLinkStatus.VERIFIED);
        link.setVerificationMethod("FRONT_DESK_CARD");
        link.setVerifiedByUsername("frontdesk1");
        link.setVerifiedAt(LocalDateTime.of(2026, 6, 3, 10, 15));
        return link;
    }
}
