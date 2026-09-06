package com.doctorapp.medicaltracker.service;

import java.util.List;

import com.doctorapp.medicaltracker.dto.PrescriptionUpsertRequest;
import com.doctorapp.medicaltracker.model.Prescription;

public interface PrescriptionService {
    List<Prescription> getByCaseId(Long caseId);

    List<Prescription> getByPatientId(Long patientId);

    Prescription createDraft(Long caseId, PrescriptionUpsertRequest request);

    Prescription updateDraft(Long id, PrescriptionUpsertRequest request);

    Prescription issue(Long id);

    Prescription recordPrint(Long id);

    Prescription voidPrescription(Long id, String reason);

    void deleteDraft(Long id);
}
