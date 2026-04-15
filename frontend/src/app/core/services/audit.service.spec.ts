import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads recent audit events with no filters', () => {
    service.getEvents().subscribe((events) => {
      expect(events.length).toBe(1);
      expect(events[0].entityType).toBe('PATIENT');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/admin/audit/events');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 1,
        entityType: 'PATIENT',
        entityId: 10,
        action: 'PATIENT_CREATED',
        actorUsername: 'doctorOne',
        details: 'status=ACTIVE',
        createdAt: '2026-04-15T09:20:00'
      }
    ]);
  });

  it('loads audit events using filters', () => {
    service
      .getEvents({
        entityType: 'PATIENT',
        action: 'PATIENT_CREATED',
        actor: 'doctor',
        limit: 25
      })
      .subscribe();

    const request = httpMock.expectOne(
      'http://localhost:8080/api/admin/audit/events?entityType=PATIENT&action=PATIENT_CREATED&actor=doctor&limit=25'
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
