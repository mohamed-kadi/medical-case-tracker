package com.doctorapp.medicaltracker.dto;

import lombok.Data;

@Data
public class AdminAssignPatientRequest {
    private String doctorUsername;
    private String staffUsername;
}
