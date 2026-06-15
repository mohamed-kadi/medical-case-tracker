package com.doctorapp.medicaltracker.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.doctorapp.medicaltracker.dto.PatientAccountCandidateResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkPatientResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkResponse;
import com.doctorapp.medicaltracker.dto.VerifyPatientAccountLinkRequest;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientAccountLink;
import com.doctorapp.medicaltracker.model.PatientAccountLinkStatus;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.PatientAccountLinkRepository;
import com.doctorapp.medicaltracker.repository.PatientRepository;
import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.service.AuditEventService;
import com.doctorapp.medicaltracker.service.PatientAccountLinkService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientAccountLinkServiceImpl implements PatientAccountLinkService {

    private static final int ACCOUNT_SEARCH_LIMIT = 12;
    private static final String DEFAULT_VERIFICATION_METHOD = "FRONT_DESK_CARD";
    private static final String AUDIT_ENTITY_TYPE = "PATIENT";

    private final AuditEventService auditEventService;
    private final PatientAccountLinkRepository patientAccountLinkRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public PatientAccountLinkPatientResponse getPatientByNumber(String patientNumber) {
        Patient patient = loadPatientByNumber(patientNumber);
        PatientAccountLink verifiedLink = patientAccountLinkRepository
                .findFirstByPatientIdAndStatusOrderByVerifiedAtDesc(patient.getId(), PatientAccountLinkStatus.VERIFIED)
                .orElse(null);

        return PatientAccountLinkPatientResponse.from(patient, verifiedLink);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientAccountCandidateResponse> searchPatientAccounts(String query) {
        String normalizedQuery = normalizeRequired(query, "Search query is required");
        if (normalizedQuery.length() < 2) {
            throw new IllegalArgumentException("Search query must contain at least 2 characters");
        }

        return userRepository.searchEnabledPatientAccounts(normalizedQuery)
                .stream()
                .limit(ACCOUNT_SEARCH_LIMIT)
                .map(PatientAccountCandidateResponse::from)
                .toList();
    }

    @Override
    public PatientAccountLinkResponse verifyLink(VerifyPatientAccountLinkRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Link request is required");
        }

        Patient patient = loadPatientByNumber(request.getPatientNumber());
        User account = loadPatientAccount(request.getUsername());

        PatientAccountLink existingSameLink = patientAccountLinkRepository
                .findFirstByUserIdAndPatientIdAndStatus(account.getId(), patient.getId(), PatientAccountLinkStatus.VERIFIED)
                .orElse(null);
        if (existingSameLink != null) {
            return PatientAccountLinkResponse.from(existingSameLink);
        }

        PatientAccountLink existingUserLink = patientAccountLinkRepository
                .findFirstByUserIdAndStatusOrderByVerifiedAtDesc(account.getId(), PatientAccountLinkStatus.VERIFIED)
                .orElse(null);
        if (existingUserLink != null) {
            throw new IllegalStateException("Patient account is already linked to patient number "
                    + existingUserLink.getPatient().getPatientNumber());
        }

        PatientAccountLink existingPatientLink = patientAccountLinkRepository
                .findFirstByPatientIdAndStatusOrderByVerifiedAtDesc(patient.getId(), PatientAccountLinkStatus.VERIFIED)
                .orElse(null);
        if (existingPatientLink != null) {
            throw new IllegalStateException("Patient file is already linked to account "
                    + existingPatientLink.getUser().getUsername());
        }

        PatientAccountLink link = patientAccountLinkRepository
                .findFirstByUserIdAndPatientIdAndStatus(account.getId(), patient.getId(), PatientAccountLinkStatus.PENDING)
                .orElseGet(PatientAccountLink::new);

        link.setUser(account);
        link.setPatient(patient);
        link.setStatus(PatientAccountLinkStatus.VERIFIED);
        link.setVerificationMethod(resolveVerificationMethod(request.getVerificationMethod()));
        link.setVerifiedByUsername(currentUsername());
        link.setVerifiedAt(LocalDateTime.now());

        PatientAccountLink savedLink = patientAccountLinkRepository.save(link);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                patient.getId(),
                "PATIENT_ACCOUNT_LINK_VERIFIED",
                "patientNumber=" + patient.getPatientNumber()
                        + ",username=" + account.getUsername()
                        + ",method=" + savedLink.getVerificationMethod());

        return PatientAccountLinkResponse.from(savedLink);
    }

    private Patient loadPatientByNumber(String patientNumber) {
        String normalizedPatientNumber = normalizeRequired(patientNumber, "Patient number is required");
        return patientRepository.findByPatientNumberIgnoreCase(normalizedPatientNumber)
                .orElseThrow(() -> new IllegalArgumentException("Patient number not found: " + normalizedPatientNumber));
    }

    private User loadPatientAccount(String username) {
        String normalizedUsername = normalizeRequired(username, "Patient account username is required");
        User account = userRepository.findByUsername(normalizedUsername)
                .orElseThrow(() -> new IllegalArgumentException("Patient account not found: " + normalizedUsername));

        if (account.getRole() != UserRole.PATIENT || !account.isEnabled()) {
            throw new IllegalArgumentException("Account must be an enabled PATIENT account: " + normalizedUsername);
        }

        return account;
    }

    private String resolveVerificationMethod(String verificationMethod) {
        if (verificationMethod == null || verificationMethod.isBlank()) {
            return DEFAULT_VERIFICATION_METHOD;
        }
        return verificationMethod.trim();
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return "system";
        }
        return authentication.getName();
    }
}
