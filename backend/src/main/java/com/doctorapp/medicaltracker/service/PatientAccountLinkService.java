package com.doctorapp.medicaltracker.service;

import java.util.List;

import com.doctorapp.medicaltracker.dto.PatientAccountCandidateResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkPatientResponse;
import com.doctorapp.medicaltracker.dto.PatientAccountLinkResponse;
import com.doctorapp.medicaltracker.dto.VerifyPatientAccountLinkRequest;

public interface PatientAccountLinkService {

    PatientAccountLinkPatientResponse getPatientByNumber(String patientNumber);

    List<PatientAccountCandidateResponse> searchPatientAccounts(String query);

    PatientAccountLinkResponse verifyLink(VerifyPatientAccountLinkRequest request);
}
