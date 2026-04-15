package com.doctorapp.medicaltracker.controller;

import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.doctorapp.medicaltracker.dto.AuditEventResponse;
import com.doctorapp.medicaltracker.model.AuditEvent;
import com.doctorapp.medicaltracker.repository.AuditEventRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
public class AdminAuditController {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 200;

    private final AuditEventRepository auditEventRepository;

    @GetMapping("/events")
    public ResponseEntity<List<AuditEventResponse>> listEvents(
            @RequestParam(name = "entityType", required = false) String entityType,
            @RequestParam(name = "action", required = false) String action,
            @RequestParam(name = "actor", required = false) String actorUsername,
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        int effectiveLimit = normalizeLimit(limit);
        Pageable pageable = PageRequest.of(
                0,
                effectiveLimit,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));

        Specification<AuditEvent> specification = buildSpecification(entityType, action, actorUsername);
        List<AuditEventResponse> response = auditEventRepository
                .findAll(specification, pageable)
                .stream()
                .map(AuditEventResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private Specification<AuditEvent> buildSpecification(String entityType, String action, String actorUsername) {
        Specification<AuditEvent> specification = Specification.where(null);

        if (StringUtils.hasText(entityType)) {
            String normalizedEntityType = entityType.trim().toUpperCase(Locale.ROOT);
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("entityType"), normalizedEntityType));
        }

        if (StringUtils.hasText(action)) {
            String normalizedAction = action.trim().toUpperCase(Locale.ROOT);
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("action"), normalizedAction));
        }

        if (StringUtils.hasText(actorUsername)) {
            String normalizedActor = "%" + actorUsername.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("actorUsername")), normalizedActor));
        }
        return specification;
    }
}
