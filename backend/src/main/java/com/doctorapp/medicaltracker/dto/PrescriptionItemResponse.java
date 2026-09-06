package com.doctorapp.medicaltracker.dto;

import com.doctorapp.medicaltracker.model.PrescriptionItem;

public record PrescriptionItemResponse(
        Long id,
        int position,
        String medicationName,
        String strength,
        String pharmaceuticalForm,
        String dose,
        String route,
        String frequency,
        String duration,
        String quantity,
        String instructions) {

    public static PrescriptionItemResponse from(PrescriptionItem item) {
        return new PrescriptionItemResponse(
                item.getId(),
                item.getPosition(),
                item.getMedicationName(),
                item.getStrength(),
                item.getPharmaceuticalForm(),
                item.getDose(),
                item.getRoute(),
                item.getFrequency(),
                item.getDuration(),
                item.getQuantity(),
                item.getInstructions());
    }
}
