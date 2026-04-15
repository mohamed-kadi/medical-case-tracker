import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CaseService } from './case.service';

describe('CaseService', () => {
  let service: CaseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(CaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load cases by patient id', () => {
    service.getCasesByPatientId(10).subscribe((cases) => {
      expect(cases.length).toBe(1);
      expect(cases[0].id).toBe(7);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/cases/patients/10');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 7,
        title: 'Acne follow-up',
        description: 'Week 2 review',
        treatmentPlan: 'Continue treatment',
        status: 'OPEN'
      }
    ]);
  });

  it('should create case for selected patient', () => {
    service
      .createCase(10, {
        title: 'Post-op follow-up',
        description: 'Observe healing',
        treatmentPlan: 'Daily dressing'
      })
      .subscribe((medicalCase) => {
        expect(medicalCase.id).toBe(11);
        expect(medicalCase.title).toBe('Post-op follow-up');
      });

    const request = httpMock.expectOne('http://localhost:8080/api/cases/patients/10');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Post-op follow-up',
      description: 'Observe healing',
      treatmentPlan: 'Daily dressing'
    });
    request.flush({
      id: 11,
      title: 'Post-op follow-up',
      description: 'Observe healing',
      treatmentPlan: 'Daily dressing',
      status: 'OPEN'
    });
  });

  it('should update case status', () => {
    service.updateCaseStatus(11, 'IN_PROGRESS').subscribe((medicalCase) => {
      expect(medicalCase.status).toBe('IN_PROGRESS');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/cases/11/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBe('IN_PROGRESS');
    request.flush({
      id: 11,
      title: 'Post-op follow-up',
      status: 'IN_PROGRESS'
    });
  });
});
