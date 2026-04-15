import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AppointmentService } from './appointment.service';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load upcoming appointments without filters', () => {
    service.getUpcomingAppointments().subscribe((appointments) => {
      expect(appointments.length).toBe(1);
      expect(appointments[0].id).toBe(5);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/appointments/upcoming');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 5,
        scheduledAt: '2030-01-01T10:30:00',
        reason: 'Follow-up',
        notes: null,
        status: 'SCHEDULED'
      }
    ]);
  });

  it('should pass from filter for upcoming appointments', () => {
    service.getUpcomingAppointments('2030-01-01T00:00:00').subscribe();

    const request = httpMock.expectOne(
      'http://localhost:8080/api/appointments/upcoming?from=2030-01-01T00:00:00'
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('should create appointment for selected patient', () => {
    service
      .createAppointment(42, {
        scheduledAt: '2030-01-01T10:00:00',
        reason: 'Follow-up',
        notes: 'Bring lab results'
      })
      .subscribe((appointment) => {
        expect(appointment.id).toBe(21);
        expect(appointment.reason).toBe('Follow-up');
      });

    const request = httpMock.expectOne('http://localhost:8080/api/appointments/patients/42');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      scheduledAt: '2030-01-01T10:00:00',
      reason: 'Follow-up',
      notes: 'Bring lab results'
    });
    request.flush({
      id: 21,
      scheduledAt: '2030-01-01T10:00:00',
      reason: 'Follow-up',
      notes: 'Bring lab results',
      status: 'SCHEDULED'
    });
  });
});
