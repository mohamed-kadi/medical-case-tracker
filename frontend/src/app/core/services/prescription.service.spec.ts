import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PrescriptionService } from './prescription.service';

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PrescriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates a structured draft for a case', () => {
    const request = {
      type: 'MEDICATION' as const,
      prescriberName: 'Dr. Test',
      prescriberTitle: 'Doctor',
      practiceAddress: '1 Clinic Street',
      items: [{ medicationName: 'Amoxicillin', strength: '500 mg' }]
    };
    service.createDraft(10, request).subscribe((prescription) => expect(prescription.status).toBe('DRAFT'));

    const httpRequest = httpMock.expectOne('http://localhost:8080/api/prescriptions/cases/10');
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);
    httpRequest.flush({ id: 1, caseId: 10, status: 'DRAFT', items: request.items });
  });

  it('issues, records printing, and voids without deleting history', () => {
    service.issue(4).subscribe();
    const issue = httpMock.expectOne('http://localhost:8080/api/prescriptions/4/issue');
    expect(issue.request.method).toBe('POST');
    issue.flush({ id: 4, status: 'ISSUED' });

    service.recordPrint(4).subscribe();
    const print = httpMock.expectOne('http://localhost:8080/api/prescriptions/4/print');
    expect(print.request.method).toBe('POST');
    print.flush({ id: 4, status: 'ISSUED' });

    service.voidPrescription(4, 'Incorrect medication').subscribe();
    const voidRequest = httpMock.expectOne('http://localhost:8080/api/prescriptions/4/void');
    expect(voidRequest.request.method).toBe('POST');
    expect(voidRequest.request.body).toEqual({ reason: 'Incorrect medication' });
    voidRequest.flush({ id: 4, status: 'VOIDED' });
  });
});
