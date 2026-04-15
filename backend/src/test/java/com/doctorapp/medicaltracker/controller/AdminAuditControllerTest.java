package com.doctorapp.medicaltracker.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.doctorapp.medicaltracker.model.AuditEvent;
import com.doctorapp.medicaltracker.repository.AuditEventRepository;
import com.doctorapp.medicaltracker.security.JwtTokenProvider;

@WebMvcTest(AdminAuditController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminAuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuditEventRepository auditEventRepository;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void listEvents_returnsAuditEvents() throws Exception {
        AuditEvent event = new AuditEvent();
        event.setId(11L);
        event.setEntityType("PATIENT");
        event.setEntityId(4L);
        event.setAction("PATIENT_CREATED");
        event.setActorUsername("doctorOne");
        event.setDetails("status=ACTIVE");
        event.setCreatedAt(LocalDateTime.of(2026, 4, 15, 9, 10));

        when(auditEventRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(event)));

        mockMvc.perform(get("/api/admin/audit/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(11L))
                .andExpect(jsonPath("$[0].entityType").value("PATIENT"))
                .andExpect(jsonPath("$[0].action").value("PATIENT_CREATED"))
                .andExpect(jsonPath("$[0].actorUsername").value("doctorOne"));
    }

    @Test
    void listEvents_whenLimitAboveMax_clampsToMaxLimit() throws Exception {
        when(auditEventRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/admin/audit/events").param("limit", "500"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(auditEventRepository).findAll(any(Specification.class), pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals(200, pageable.getPageSize());
        org.junit.jupiter.api.Assertions.assertEquals(0, pageable.getPageNumber());
    }
}
