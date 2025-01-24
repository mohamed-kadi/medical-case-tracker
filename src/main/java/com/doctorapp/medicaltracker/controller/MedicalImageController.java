package com.doctorapp.medicaltracker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import com.doctorapp.medicaltracker.model.ImageCategory;
import com.doctorapp.medicaltracker.model.MedicalImage;
import com.doctorapp.medicaltracker.service.MedicalImageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class MedicalImageController {

    private final MedicalImageService medicalImageService;

    @GetMapping("/{id}")
    public ResponseEntity<MedicalImage> getImageMetadata(@PathVariable Long id) {
        MedicalImage image = medicalImageService.getImage(id);
        return ResponseEntity.ok(image);
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadImage(@PathVariable Long id) {
        byte[] imageData = medicalImageService.retrieveImageData(id);
        MedicalImage image = medicalImageService.getImage(id);
        return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(image.getContentType()))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + image.getFileName() + "\"" )
                .body(imageData);
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<MedicalImage>> getImagesByCase(@PathVariable Long caseId) {
        List<MedicalImage> images = medicalImageService.getImagesByCase(caseId);
        return ResponseEntity.ok(images);
    }

    @GetMapping("/case/{caseId}/category")
    public ResponseEntity<List<MedicalImage>> getImagesByCaseAndCategory(
            @PathVariable Long caseId,
            @RequestParam ImageCategory category
    ) {
        List<MedicalImage> images = medicalImageService.getImagesByCaseAndCategory(caseId, category);
        return ResponseEntity.ok(images);
    }

    @PostMapping("/upload")
    public ResponseEntity<MedicalImage> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("caseId") Long caseId,
            @RequestParam("category") ImageCategory category,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("uploadedBy") String uploadedBy
    ) {
        MedicalImage savedImage = medicalImageService.saveImage(file, caseId, category, description, uploadedBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedImage);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        medicalImageService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }
}
