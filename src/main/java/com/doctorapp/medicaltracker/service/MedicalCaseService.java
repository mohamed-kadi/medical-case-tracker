package com.doctorapp.medicaltracker.service;

import java.util.List;

import com.doctorapp.medicaltracker.model.CaseStatus;
import com.doctorapp.medicaltracker.model.MedicalCase;

public interface MedicalCaseService {

    MedicalCase createCase(Long patientId, MedicalCase medicalCase);

    MedicalCase updateCase(Long id, MedicalCase medicalCase);

    MedicalCase getCaseById(Long id);

    List<MedicalCase> getCasesByPatientId(Long patientId);

    List<MedicalCase> getActivePatientCases(Long patientId);

    void deleteCase(Long id);

    MedicalCase updateCaseStatus(Long id, CaseStatus status);

}
