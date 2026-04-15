package com.doctorapp.medicaltracker.service.impl;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.doctorapp.medicaltracker.model.AuditEvent;
import com.doctorapp.medicaltracker.repository.AuditEventRepository;
import com.doctorapp.medicaltracker.service.AuditEventService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditEventServiceImpl implements AuditEventService {

    private final AuditEventRepository auditEventRepository;

    @Override
    @Transactional
    public void recordEvent(String entityType, Long entityId, String action, String details) {
        if (entityId == null) {
            throw new IllegalArgumentException("Audit entity ID is required");
        }

        AuditEvent event = new AuditEvent();
        event.setEntityType(normalizeRequired(entityType, "entity type"));
        event.setEntityId(entityId);
        event.setAction(normalizeRequired(action, "action"));
        event.setActorUsername(resolveActorUsername());
        event.setDetails(details);
        auditEventRepository.save(event);
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Audit " + fieldName + " is required");
        }
        return value.trim();
    }

    private String resolveActorUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return "system";
        }
        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            return "system";
        }
        return username.trim();
    }
}
