package com.doctorapp.medicaltracker.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.doctorapp.medicaltracker.model.Patient;
import com.doctorapp.medicaltracker.repository.PatientRepository;
import com.doctorapp.medicaltracker.service.impl.PatientServiceImpl;

@ExtendWith(MockitoExtension.class) // This is a JUnit 5 annotation that tells JUnit to enable and configure the Mockito extension before running the tests
public class PatientServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks    // This annotation is used to inject the mocked dependencies into the PatientServiceImpl class
    private PatientServiceImpl patientService;

    private Patient testPatient;

    @BeforeEach   // This annotation is used to signal that the method should be executed before each test method in the test class
    void setUp() {
        testPatient = new Patient();
        testPatient.setId(1L);
        testPatient.setFirstName("John");
        testPatient.setLastName("Doe");
        testPatient.setEmail("john@example.com");
        testPatient.setDateOfBirth(LocalDate.of(1980, 1, 1));
    }
    
    @Test
    void getPatientById_whenPatientExists_returnPatient() {
        //Arrange
        when(patientRepository.findById(1L)).thenReturn(Optional.of(testPatient));

        //Act
        Patient found = patientService.getPatientById(1L);

        //Assert
        assertNotNull(found);
        assertEquals("John", found.getFirstName());
        assertEquals("Doe", found.getLastName());
        verify(patientRepository).findById(1L);
    }
    
    

}
