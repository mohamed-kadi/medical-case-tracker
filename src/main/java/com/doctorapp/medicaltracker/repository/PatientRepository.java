package com.doctorapp.medicaltracker.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.doctorapp.medicaltracker.model.Patient;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    // JpaRepository provides basic CRUD operations:
    // save(), findById(), findAll(), delete(), etc.
    Optional<Patient> findByEmail(String email);

    List<Patient> findByLastName(String lastName);

    List<Patient> findByLastNameContainingIgnoreCase(String lastName);

    boolean existsByEmail(String email); // check if a patient with the given email exists
}
