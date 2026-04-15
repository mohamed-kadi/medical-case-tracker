package com.doctorapp.medicaltracker.service;

public interface AuditEventService {

    void recordEvent(String entityType, Long entityId, String action, String details);

}
