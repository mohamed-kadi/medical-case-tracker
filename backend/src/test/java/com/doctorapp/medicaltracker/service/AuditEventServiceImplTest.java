package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.doctorapp.medicaltracker.model.AuditEvent;
import com.doctorapp.medicaltracker.repository.AuditEventRepository;
import com.doctorapp.medicaltracker.service.impl.AuditEventServiceImpl;

@ExtendWith(MockitoExtension.class)
class AuditEventServiceImplTest {

    @Mock
    private AuditEventRepository auditEventRepository;

    @InjectMocks
    private AuditEventServiceImpl auditEventService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordEvent_whenAuthenticated_usesCurrentUsername() {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken("doctorOne", "n/a", "ROLE_DOCTOR"));
        when(auditEventRepository.save(any(AuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        auditEventService.recordEvent("MEDICAL_CASE", 5L, "CASE_CREATED", "patientId=3");

        ArgumentCaptor<AuditEvent> captor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(auditEventRepository).save(captor.capture());
        AuditEvent savedEvent = captor.getValue();
        assertEquals("doctorOne", savedEvent.getActorUsername());
        assertEquals("MEDICAL_CASE", savedEvent.getEntityType());
        assertEquals("CASE_CREATED", savedEvent.getAction());
    }

    @Test
    void recordEvent_whenUnauthenticated_usesSystemActor() {
        when(auditEventRepository.save(any(AuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        auditEventService.recordEvent("MEDICAL_IMAGE", 9L, "IMAGE_UPLOADED", "caseId=4");

        ArgumentCaptor<AuditEvent> captor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(auditEventRepository).save(captor.capture());
        assertEquals("system", captor.getValue().getActorUsername());
    }
}
