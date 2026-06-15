package com.doctorapp.medicaltracker.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.doctorapp.medicaltracker.dto.PatientPortalAppointmentResponse;
import com.doctorapp.medicaltracker.dto.PatientPortalDashboardResponse;
import com.doctorapp.medicaltracker.dto.PatientPortalPatientResponse;
import com.doctorapp.medicaltracker.model.AppointmentStatus;
import com.doctorapp.medicaltracker.model.PatientAccountLink;
import com.doctorapp.medicaltracker.model.PatientAccountLinkStatus;
import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;
import com.doctorapp.medicaltracker.repository.AppointmentRepository;
import com.doctorapp.medicaltracker.repository.PatientAccountLinkRepository;
import com.doctorapp.medicaltracker.repository.UserRepository;
import com.doctorapp.medicaltracker.service.PatientPortalService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatientPortalServiceImpl implements PatientPortalService {

    private static final String ACCESS_DENIED_MESSAGE = "Patient portal is available to patient accounts only";

    private final AppointmentRepository appointmentRepository;
    private final PatientAccountLinkRepository patientAccountLinkRepository;
    private final UserRepository userRepository;

    @Override
    public PatientPortalDashboardResponse getDashboard() {
        User account = getCurrentPatientAccount();
        PatientAccountLink verifiedLink = patientAccountLinkRepository
                .findFirstByUserUsernameAndStatusOrderByVerifiedAtDesc(
                        account.getUsername(),
                        PatientAccountLinkStatus.VERIFIED)
                .orElse(null);

        if (verifiedLink == null) {
            return new PatientPortalDashboardResponse(account.getUsername(), account.getEmail(), null, List.of());
        }

        Patient patient = verifiedLink.getPatient();
        List<PatientPortalAppointmentResponse> appointments = appointmentRepository
                .findByPatientIdAndScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
                        patient.getId(),
                        LocalDateTime.now(),
                        AppointmentStatus.SCHEDULED)
                .stream()
                .limit(8)
                .map(PatientPortalAppointmentResponse::from)
                .toList();

        return new PatientPortalDashboardResponse(
                account.getUsername(),
                account.getEmail(),
                PatientPortalPatientResponse.from(patient),
                appointments);
    }

    private User getCurrentPatientAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        }

        User account = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException(ACCESS_DENIED_MESSAGE));

        if (account.getRole() != UserRole.PATIENT || !account.isEnabled()) {
            throw new AccessDeniedException(ACCESS_DENIED_MESSAGE);
        }

        return account;
    }
}
