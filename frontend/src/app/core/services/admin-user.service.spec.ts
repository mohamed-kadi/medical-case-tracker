import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminUserService } from './admin-user.service';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AdminUserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads all internal users when no filter is provided', () => {
    service.getInternalUsers().subscribe((users) => {
      expect(users.length).toBe(2);
      expect(users[0].role).toBe('DOCTOR');
      expect(users[1].role).toBe('STAFF');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/admin/users');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 1,
        username: 'doctor_a',
        email: 'doctor_a@clinic.com',
        role: 'DOCTOR',
        enabled: true
      },
      {
        id: 2,
        username: 'staff_a',
        email: 'staff_a@clinic.com',
        role: 'STAFF',
        enabled: true
      }
    ]);
  });

  it('loads internal users using role filter', () => {
    service.getInternalUsers('DOCTOR').subscribe((users) => {
      expect(users.length).toBe(1);
      expect(users[0].username).toBe('doctor_a');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/admin/users?role=DOCTOR');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 1,
        username: 'doctor_a',
        email: 'doctor_a@clinic.com',
        role: 'DOCTOR',
        enabled: true
      }
    ]);
  });

  it('creates internal users through admin endpoint', () => {
    service
      .createInternalUser({
        username: 'doctor_one',
        email: 'doctor.one@clinic.com',
        password: 'StrongPass123!',
        role: 'DOCTOR'
      })
      .subscribe((response) => {
        expect(response.username).toBe('doctor_one');
        expect(response.role).toBe('DOCTOR');
      });

    const request = httpMock.expectOne('http://localhost:8080/api/admin/users');
    expect(request.request.method).toBe('POST');
    request.flush({
      id: 12,
      username: 'doctor_one',
      email: 'doctor.one@clinic.com',
      role: 'DOCTOR',
      enabled: true
    });
  });
});
