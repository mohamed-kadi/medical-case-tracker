package com.doctorapp.medicaltracker.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "medical_images")

public class MedicalImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name ="file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "path", nullable = false)
    private String path;

    @Column(name = "description", columnDefinition = "TEXT", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "image_category", nullable = false)
    private ImageCategory category;

    @Column(name ="mime_type", nullable = false)
    private String mimeType; // image/jpeg, image/png, etc.

    @Column(name = "size", nullable = false)
    private Long size;
    
    @JsonBackReference
    @ManyToMany(fetch = FetchType.LAZY)  
    @JoinColumn(name = "case_id", nullable = false)
    private MedicalCase medicalCase;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;

    private boolean isDeleted = false;
}
