package com.doctorapp.medicaltracker.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Data;

@Data
@Entity
@Table(
        name = "patient_account_links",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_patient_account_link_user_patient_status",
                columnNames = {"user_id", "patient_id", "status"}),
        indexes = {
                @Index(name = "idx_patient_account_link_user_status", columnList = "user_id,status"),
                @Index(name = "idx_patient_account_link_patient_status", columnList = "patient_id,status")
        })
public class PatientAccountLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PatientAccountLinkStatus status = PatientAccountLinkStatus.PENDING;

    @Column(name = "verification_method", length = 60)
    private String verificationMethod;

    @Column(name = "verified_by_username", length = 100)
    private String verifiedByUsername;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
