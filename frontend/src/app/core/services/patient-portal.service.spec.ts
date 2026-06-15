import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PatientPortalService } from './patient-portal.service';

describe('PatientPortalService', () => {
  let service: PatientPortalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PatientPortalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the patient portal dashboard', () => {
    service.getDashboard().subscribe((dashboard) => {
      expect(dashboard.username).toBe('patient1');
      expect(dashboard.patient?.patientNumber).toBe('MT-2026-0007');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/patient-portal/dashboard');
    expect(request.request.method).toBe('GET');
    request.flush({
      username: 'patient1',
      email: 'patient@clinic.com',
      patient: {
        id: 7,
        patientNumber: 'MT-2026-0007',
        firstName: 'Nora',
        lastName: 'Rami',
        email: 'patient@clinic.com',
        status: 'ACTIVE'
      },
      upcomingAppointments: []
    });
  });
});
