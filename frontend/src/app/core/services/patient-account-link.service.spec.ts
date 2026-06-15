import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PatientAccountLinkService } from './patient-account-link.service';

describe('PatientAccountLinkService', () => {
  let service: PatientAccountLinkService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PatientAccountLinkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads a patient by patient number', () => {
    service.getPatientByNumber('MT-2026-000007').subscribe((patient) => {
      expect(patient.patientNumber).toBe('MT-2026-000007');
    });

    const request = httpMock.expectOne(
      'http://localhost:8080/api/patient-account-links/patient?patientNumber=MT-2026-000007'
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 7,
      patientNumber: 'MT-2026-000007',
      firstName: 'Nora',
      lastName: 'Rami',
      email: 'nora@clinic.com',
      status: 'ACTIVE'
    });
  });

  it('searches patient portal accounts', () => {
    service.searchPatientAccounts('patient').subscribe((accounts) => {
      expect(accounts[0].username).toBe('patient1');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/patient-account-links/accounts?query=patient');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 4, username: 'patient1', email: 'patient@clinic.com' }]);
  });

  it('verifies a patient account link', () => {
    service
      .verifyLink({
        patientNumber: 'MT-2026-000007',
        username: 'patient1',
        verificationMethod: 'FRONT_DESK_CARD'
      })
      .subscribe((link) => {
        expect(link.status).toBe('VERIFIED');
      });

    const request = httpMock.expectOne('http://localhost:8080/api/patient-account-links/verify');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      patientNumber: 'MT-2026-000007',
      username: 'patient1',
      verificationMethod: 'FRONT_DESK_CARD'
    });
    request.flush({
      id: 9,
      userId: 4,
      username: 'patient1',
      email: 'patient@clinic.com',
      patientId: 7,
      patientNumber: 'MT-2026-000007',
      patientName: 'Nora Rami',
      status: 'VERIFIED',
      verificationMethod: 'FRONT_DESK_CARD',
      verifiedByUsername: 'frontdesk1'
    });
  });
});
