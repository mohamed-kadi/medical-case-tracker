package com.doctorapp.medicaltracker.service.impl;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.doctorapp.medicaltracker.exception.PatientNotFoundException;
import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.PatientStatus;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.MedicalCaseRepository;
import com.doctorapp.medicaltracker.repository.PatientRepository;
import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.service.AuditEventService;
import com.doctorapp.medicaltracker.service.PatientService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientServiceImpl implements PatientService {
    private static final Logger log = LoggerFactory.getLogger(PatientServiceImpl.class);
    private static final String ACCESS_DENIED_MESSAGE = "You are not allowed to access this patient";
    private static final String AUDIT_ENTITY_TYPE = "PATIENT";
    private static final String PATIENT_NUMBER_PREFIX = "MT";

    private final MedicalCaseRepository medicalCaseRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final AuditEventService auditEventService;

    @Override
    @Transactional(readOnly = true)
    public List<Patient> getAllPatients() {
        AccessScope accessScope = getAccessScope();
        return switch (accessScope.role()) {
            case ADMIN_OR_SYSTEM -> redactPatients(patientRepository.findAll(), accessScope);
            case DOCTOR -> patientRepository.findByAssignedDoctorUsername(accessScope.username());
            case FRONT_DESK -> redactPatients(patientRepository.findAll(), accessScope);
            case DENIED -> throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        };
    }

    @Override
    @Transactional(readOnly = true)
    public Patient getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));
        assertCurrentUserCanAccessPatient(patient);
        return redactPatient(patient, getAccessScope());
    }

    @Override
    public void assertCurrentUserCanAccessPatient(Patient patient) {
        AccessScope accessScope = getAccessScope();

        if (accessScope.role() == AccessRole.ADMIN_OR_SYSTEM || accessScope.role() == AccessRole.FRONT_DESK) {
            return;
        }

        if (accessScope.role() == AccessRole.DOCTOR
                && accessScope.username().equals(patient.getAssignedDoctorUsername())) {
            return;
        }

        throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Patient> searchPatientsByLastName(String lastName) {
        if (lastName == null || lastName.trim().isEmpty()) {
            throw new IllegalArgumentException("Last name cannot be null or empty");
        }

        String normalizedLastName = lastName.trim();
        AccessScope accessScope = getAccessScope();

        return switch (accessScope.role()) {
            case ADMIN_OR_SYSTEM -> redactPatients(
                    patientRepository.findByLastNameContainingIgnoreCase(normalizedLastName),
                    accessScope);
            case DOCTOR -> patientRepository.findByLastNameContainingIgnoreCaseAndAssignedDoctorUsername(
                    normalizedLastName,
                    accessScope.username());
            case FRONT_DESK -> redactPatients(
                    patientRepository.findByLastNameContainingIgnoreCase(normalizedLastName),
                    accessScope);
            case DENIED -> throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        };
    }

    @Override
    public Patient createPatient(Patient patient) {
        if (!isEmailAvailable(patient.getEmail())) {
            throw new IllegalStateException("Email is already taken:" + patient.getEmail());
        }
        validatePatient(patient);
        patient.setPatientNumber(generatePatientNumber());
        if (getAccessScope().role() == AccessRole.FRONT_DESK) {
            patient.setMedicalHistory(null);
        }
        applyRegistrationForCreator(patient);
        Patient savedPatient = patientRepository.save(patient);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                savedPatient.getId(),
                "PATIENT_CREATED",
                "status=" + savedPatient.getStatus()
                        + ",doctor=" + valueOrUnassigned(savedPatient.getAssignedDoctorUsername())
                        + ",frontDesk=" + valueOrUnassigned(savedPatient.getAssignedFrontDeskUsername())
                        + ",registeredBy=" + valueOrUnassigned(savedPatient.getRegisteredByUsername())
                        + ",patientNumber=" + savedPatient.getPatientNumber());
        return redactPatient(savedPatient, getAccessScope());
    }

    @Override
    public Patient updatePatient(Long id, Patient patientDetails) {
        Patient existingPatient = loadMutablePatient(id);
        validatePatient(patientDetails);

        try {
            updatePatientFields(existingPatient, patientDetails, canManageAssignments(), canManageClinicalDetails());
            Patient savedPatient = patientRepository.save(existingPatient);
            auditEventService.recordEvent(
                    AUDIT_ENTITY_TYPE,
                    savedPatient.getId(),
                    "PATIENT_UPDATED",
                    "status=" + savedPatient.getStatus());
            return redactPatient(savedPatient, getAccessScope());
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Email is already taken:" + patientDetails.getEmail());
        }
    }

    @Override
    public Patient assignPatient(Long id, String doctorUsername, String frontDeskUsername) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));

        patient.setAssignedDoctorUsername(resolveAndValidateAssignee(doctorUsername, UserRole.DOCTOR));
        patient.setAssignedFrontDeskUsername(resolveAndValidateAssignee(frontDeskUsername, UserRole.FRONT_DESK));

        Patient savedPatient = patientRepository.save(patient);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                savedPatient.getId(),
                "PATIENT_ASSIGNED",
                "doctor=" + valueOrUnassigned(savedPatient.getAssignedDoctorUsername())
                        + ",frontDesk=" + valueOrUnassigned(savedPatient.getAssignedFrontDeskUsername()));
        return redactPatient(savedPatient, getAccessScope());
    }

    private void updatePatientFields(
            Patient existingPatient,
            Patient patientDetails,
            boolean includeAssignments,
            boolean includeClinicalDetails) {
        existingPatient.setFirstName(patientDetails.getFirstName());
        existingPatient.setLastName(patientDetails.getLastName());
        existingPatient.setDateOfBirth(patientDetails.getDateOfBirth());
        existingPatient.setEmail(patientDetails.getEmail());
        existingPatient.setPhoneNumber(patientDetails.getPhoneNumber());
        existingPatient.setStatus(patientDetails.getStatus());

        if (includeClinicalDetails) {
            existingPatient.setMedicalHistory(patientDetails.getMedicalHistory());
        }

        if (includeAssignments) {
            existingPatient.setAssignedDoctorUsername(patientDetails.getAssignedDoctorUsername());
            existingPatient.setAssignedFrontDeskUsername(patientDetails.getAssignedFrontDeskUsername());
        }
    }

    @Override
    public Patient updatePatientStatus(Long id, PatientStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("New status cannot be null");
        }
        Patient patient = loadMutablePatient(id);
        PatientStatus previousStatus = patient.getStatus();

        if (!isValidPatientStatusTransition(previousStatus, newStatus)) {
            throw new IllegalStateException("Invalid status transition from " + previousStatus + " to " + newStatus);
        }

        if (newStatus != PatientStatus.ACTIVE) {
            List<MedicalCase> activeCases = medicalCaseRepository.findByPatientIdAndStatus(id, CaseStatus.IN_PROGRESS);
            if (!activeCases.isEmpty()) {
                throw new IllegalStateException(
                        "Cannot change patient status: Patient has " + activeCases.size() + " active cases");
            }
        }

        log.info("Updating statatus of patient ID: {} from {} to {}", id, previousStatus, newStatus);
        patient.setStatus(newStatus);
        Patient savedPatient = patientRepository.save(patient);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                savedPatient.getId(),
                "PATIENT_STATUS_UPDATED",
                "status=" + previousStatus + "->" + newStatus);
        return savedPatient;
    }

    private boolean isValidPatientStatusTransition(PatientStatus currentStatus, PatientStatus newStatus) {
        if (currentStatus == newStatus) {
            return false;
        }
        return switch (currentStatus) {
            case ACTIVE -> newStatus == PatientStatus.INACTIVE || newStatus == PatientStatus.ARCHIVED;
            case INACTIVE -> newStatus == PatientStatus.ACTIVE || newStatus == PatientStatus.ARCHIVED;
            case ARCHIVED -> false;
        };
    }

    @Override
    public void deletePatient(Long id) {
        Patient patient = loadMutablePatient(id);
        PatientStatus previousStatus = patient.getStatus();
        patient.setStatus(PatientStatus.ARCHIVED);
        patientRepository.save(patient);
        auditEventService.recordEvent(
                AUDIT_ENTITY_TYPE,
                patient.getId(),
                "PATIENT_ARCHIVED",
                "status=" + previousStatus + "->" + PatientStatus.ARCHIVED);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return !patientRepository.existsByEmail(email);
    }

    private void validatePatient(Patient patient) {
        if (patient.getDateOfBirth() == null) {
            throw new IllegalArgumentException("Date of birth cannot be null");
        }
        if (patient.getEmail() == null || patient.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        if (patient.getFirstName() == null || patient.getFirstName().trim().isEmpty()) {
            throw new IllegalArgumentException("First name cannot be null or empty");
        }
    }

    private String resolveAndValidateAssignee(String username, UserRole expectedRole) {
        if (username == null || username.trim().isEmpty()) {
            return null;
        }

        String normalizedUsername = username.trim();
        User user = userRepository.findByUsername(normalizedUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + normalizedUsername));

        if (user.getRole() != expectedRole) {
            throw new IllegalArgumentException(
                    "User " + normalizedUsername + " must have role " + expectedRole.name());
        }
        return normalizedUsername;
    }

    private void applyRegistrationForCreator(Patient patient) {
        AccessScope accessScope = getAccessScope();
        patient.setRegisteredByUsername(accessScope.username().isBlank() ? null : accessScope.username());

        if (accessScope.role() == AccessRole.DOCTOR) {
            patient.setAssignedDoctorUsername(accessScope.username());
            patient.setAssignedFrontDeskUsername(null);
        } else if (accessScope.role() == AccessRole.FRONT_DESK) {
            patient.setAssignedFrontDeskUsername(accessScope.username());
            patient.setAssignedDoctorUsername(resolveSoleDoctorUsername());
        } else {
            patient.setAssignedDoctorUsername(null);
            patient.setAssignedFrontDeskUsername(null);
        }
    }

    private String resolveSoleDoctorUsername() {
        List<User> enabledDoctors = userRepository.findByRoleOrderByUsernameAsc(UserRole.DOCTOR)
                .stream()
                .filter(User::isEnabled)
                .toList();
        return enabledDoctors.size() == 1 ? enabledDoctors.get(0).getUsername() : null;
    }

    private Patient loadMutablePatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));
        assertCurrentUserCanAccessPatient(patient);
        return patient;
    }

    private boolean canManageAssignments() {
        return getAccessScope().role() == AccessRole.ADMIN_OR_SYSTEM;
    }

    private boolean canManageClinicalDetails() {
        return getAccessScope().role() == AccessRole.DOCTOR;
    }

    private String generatePatientNumber() {
        String prefix = PATIENT_NUMBER_PREFIX + "-" + LocalDate.now().getYear() + "-";
        long nextSequence = patientRepository.countByPatientNumberStartingWith(prefix) + 1;
        String patientNumber = formatPatientNumber(prefix, nextSequence);
        while (patientRepository.existsByPatientNumber(patientNumber)) {
            nextSequence++;
            patientNumber = formatPatientNumber(prefix, nextSequence);
        }
        return patientNumber;
    }

    private String formatPatientNumber(String prefix, long sequence) {
        return prefix + String.format("%06d", sequence);
    }

    private List<Patient> redactPatients(List<Patient> patients, AccessScope accessScope) {
        return patients.stream()
                .map(patient -> redactPatient(patient, accessScope))
                .toList();
    }

    private Patient redactPatient(Patient patient, AccessScope accessScope) {
        if (accessScope.role() == AccessRole.DOCTOR) {
            return patient;
        }

        Patient redacted = new Patient();
        redacted.setId(patient.getId());
        redacted.setPatientNumber(patient.getPatientNumber());
        redacted.setRegisteredByUsername(patient.getRegisteredByUsername());
        redacted.setFirstName(patient.getFirstName());
        redacted.setLastName(patient.getLastName());
        redacted.setDateOfBirth(patient.getDateOfBirth());
        redacted.setEmail(patient.getEmail());
        redacted.setPhoneNumber(patient.getPhoneNumber());
        redacted.setAssignedDoctorUsername(patient.getAssignedDoctorUsername());
        redacted.setAssignedFrontDeskUsername(patient.getAssignedFrontDeskUsername());
        redacted.setStatus(patient.getStatus());
        redacted.setCreatedAt(patient.getCreatedAt());
        redacted.setUpdatedAt(patient.getUpdatedAt());
        redacted.setVersion(patient.getVersion());
        return redacted;
    }

    private String valueOrUnassigned(String value) {
        if (value == null || value.isBlank()) {
            return "unassigned";
        }
        return value.trim();
    }

    private AccessScope getAccessScope() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return new AccessScope("", AccessRole.ADMIN_OR_SYSTEM);
        }

        if (hasAuthority(authentication, "ROLE_ADMIN")) {
            return new AccessScope(authentication.getName(), AccessRole.ADMIN_OR_SYSTEM);
        }
        if (hasAuthority(authentication, "ROLE_DOCTOR")) {
            return new AccessScope(authentication.getName(), AccessRole.DOCTOR);
        }
        if (hasAuthority(authentication, "ROLE_FRONT_DESK")) {
            return new AccessScope(authentication.getName(), AccessRole.FRONT_DESK);
        }
        return new AccessScope(authentication.getName(), AccessRole.DENIED);
    }

    private boolean hasAuthority(Authentication authentication, String authority) {
        return authentication.getAuthorities()
                .stream()
                .anyMatch(grantedAuthority -> authority.equals(grantedAuthority.getAuthority()));
    }

    private enum AccessRole {
        ADMIN_OR_SYSTEM,
        DOCTOR,
        FRONT_DESK,
        DENIED
    }

    private record AccessScope(String username, AccessRole role) {
    }
}
