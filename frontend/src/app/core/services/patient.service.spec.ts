import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PatientService } from './patient.service';

describe('PatientService', () => {
  let service: PatientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PatientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load visible patients', () => {
    service.getVisiblePatients().subscribe((patients) => {
      expect(patients.length).toBe(1);
      expect(patients[0].id).toBe(10);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/patients');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 10,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@clinic.com',
        status: 'ACTIVE',
        assignedDoctorUsername: 'doctorOne',
        assignedFrontDeskUsername: null
      }
    ]);
  });

  it('should call admin assignment endpoint', () => {
    service
      .assignPatient(10, { doctorUsername: 'doctorOne', frontDeskUsername: 'staffOne' })
      .subscribe((patient) => {
        expect(patient.assignedDoctorUsername).toBe('doctorOne');
        expect(patient.assignedFrontDeskUsername).toBe('staffOne');
      });

    const request = httpMock.expectOne('http://localhost:8080/api/admin/patients/10/assignment');
    expect(request.request.method).toBe('PATCH');
    request.flush({
      id: 10,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@clinic.com',
      status: 'ACTIVE',
      assignedDoctorUsername: 'doctorOne',
      assignedFrontDeskUsername: 'staffOne'
    });
  });

  it('should create patient', () => {
    service
      .createPatient({
        firstName: 'Nora',
        lastName: 'Smith',
        dateOfBirth: '1991-03-12',
        email: 'nora@clinic.com',
        phoneNumber: '+212600000000',
        medicalHistory: 'none',
        status: 'ACTIVE'
      })
      .subscribe((patient) => {
        expect(patient.id).toBe(15);
        expect(patient.firstName).toBe('Nora');
      });

    const request = httpMock.expectOne('http://localhost:8080/api/patients');
    expect(request.request.method).toBe('POST');
    request.flush({
      id: 15,
      firstName: 'Nora',
      lastName: 'Smith',
      dateOfBirth: '1991-03-12',
      email: 'nora@clinic.com',
      phoneNumber: '+212600000000',
      medicalHistory: 'none',
      status: 'ACTIVE'
    });
  });

  it('should load patient by id', () => {
    service.getPatientById(15).subscribe((patient) => {
      expect(patient.id).toBe(15);
      expect(patient.firstName).toBe('Nora');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/patients/15');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 15,
      firstName: 'Nora',
      lastName: 'Smith',
      dateOfBirth: '1991-03-12',
      email: 'nora@clinic.com',
      phoneNumber: '+212600000000',
      medicalHistory: 'none',
      status: 'ACTIVE'
    });
  });

  it('should update patient', () => {
    service
      .updatePatient(15, {
        firstName: 'Nora',
        lastName: 'Smith',
        dateOfBirth: '1991-03-12',
        email: 'nora.updated@clinic.com',
        phoneNumber: '+212600000111',
        medicalHistory: 'updated',
        status: 'ACTIVE'
      })
      .subscribe((patient) => {
        expect(patient.email).toBe('nora.updated@clinic.com');
      });

    const request = httpMock.expectOne('http://localhost:8080/api/patients/15');
    expect(request.request.method).toBe('PUT');
    request.flush({
      id: 15,
      firstName: 'Nora',
      lastName: 'Smith',
      dateOfBirth: '1991-03-12',
      email: 'nora.updated@clinic.com',
      phoneNumber: '+212600000111',
      medicalHistory: 'updated',
      status: 'ACTIVE'
    });
  });
});
