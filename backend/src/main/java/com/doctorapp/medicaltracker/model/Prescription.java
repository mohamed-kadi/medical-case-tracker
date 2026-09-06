package com.doctorapp.medicaltracker.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private MedicalCase medicalCase;

    @Column(name = "prescription_number", unique = true, length = 40)
    private String prescriptionNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PrescriptionType type = PrescriptionType.MEDICATION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PrescriptionStatus status = PrescriptionStatus.DRAFT;

    @Column(name = "prescriber_name", nullable = false, length = 200)
    private String prescriberName;

    @Column(name = "prescriber_title", nullable = false, length = 120)
    private String prescriberTitle;

    @Column(name = "professional_id", length = 100)
    private String professionalId;

    @Column(name = "practice_name", length = 200)
    private String practiceName;

    @Column(name = "practice_address", nullable = false, columnDefinition = "TEXT")
    private String practiceAddress;

    @Column(name = "practice_phone", length = 80)
    private String practicePhone;

    @Column(name = "general_instructions", columnDefinition = "TEXT")
    private String generalInstructions;

    @Column(name = "patient_name_snapshot", nullable = false, length = 300)
    private String patientNameSnapshot;

    @Column(name = "patient_number_snapshot", length = 32)
    private String patientNumberSnapshot;

    @Column(name = "patient_dob_snapshot")
    private LocalDate patientDateOfBirthSnapshot;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @Column(name = "void_reason", columnDefinition = "TEXT")
    private String voidReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC, id ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PrescriptionItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
