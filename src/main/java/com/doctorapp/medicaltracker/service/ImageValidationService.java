package com.doctorapp.medicaltracker.service;

import org.springframework.web.multipart.MultipartFile;

public interface ImageValidationService {

    void validateImage(MultipartFile file);

}
