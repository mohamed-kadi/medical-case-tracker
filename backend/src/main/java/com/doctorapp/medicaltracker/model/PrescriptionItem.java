package com.doctorapp.medicaltracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@Entity
@Table(name = "prescription_items")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prescription_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Prescription prescription;

    @Column(nullable = false)
    private int position;

    @Column(name = "medication_name", nullable = false, length = 255)
    private String medicationName;

    @Column(length = 120)
    private String strength;

    @Column(name = "pharmaceutical_form", length = 120)
    private String pharmaceuticalForm;

    @Column(length = 120)
    private String dose;

    @Column(length = 120)
    private String route;

    @Column(length = 160)
    private String frequency;

    @Column(length = 120)
    private String duration;

    @Column(length = 120)
    private String quantity;

    @Column(columnDefinition = "TEXT")
    private String instructions;
}
