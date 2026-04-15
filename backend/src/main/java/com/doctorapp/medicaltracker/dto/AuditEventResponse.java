package com.doctorapp.medicaltracker.dto;

import java.time.LocalDateTime;

import com.doctorapp.medicaltracker.model.AuditEvent;

public record AuditEventResponse(
        Long id,
        String entityType,
        Long entityId,
        String action,
        String actorUsername,
        String details,
        LocalDateTime createdAt) {

    public static AuditEventResponse from(AuditEvent event) {
        return new AuditEventResponse(
                event.getId(),
                event.getEntityType(),
                event.getEntityId(),
                event.getAction(),
                event.getActorUsername(),
                event.getDetails(),
                event.getCreatedAt());
    }
}
