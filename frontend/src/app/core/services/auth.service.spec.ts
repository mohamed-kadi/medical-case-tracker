import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should call login endpoint and persist token only for the current browser session', () => {
    service.login({ username: 'doctor', password: 'SecurePass1!' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(request.request.method).toBe('POST');

    request.flush({ token: buildToken({ sub: 'doctor', exp: futureExp() }) });

    expect(sessionStorage.getItem('medicaltracker.accessToken')).toBeTruthy();
    expect(localStorage.getItem('medicaltracker.accessToken')).toBeNull();
  });

  it('should call register endpoint as text response', () => {
    service
      .register({ username: 'patient', email: 'patient@clinic.com', password: 'SecurePass1!' })
      .subscribe((response) => expect(response).toBe('User registered successfully'));

    const request = httpMock.expectOne('http://localhost:8080/api/auth/register');
    expect(request.request.method).toBe('POST');

    request.flush('User registered successfully');
  });

  it('should return false for expired tokens', () => {
    sessionStorage.setItem(
      'medicaltracker.accessToken',
      buildToken({ sub: 'doctor', exp: pastExp() })
    );

    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should return true for non-expired tokens', () => {
    sessionStorage.setItem(
      'medicaltracker.accessToken',
      buildToken({ sub: 'doctor', exp: futureExp() })
    );

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should decode role from token payload', () => {
    sessionStorage.setItem(
      'medicaltracker.accessToken',
      buildToken({ sub: 'admin', role: 'ADMIN', exp: futureExp() })
    );

    expect(service.getCurrentRole()).toBe('ADMIN');
  });

  it('should ignore and remove legacy localStorage tokens', () => {
    localStorage.setItem(
      'medicaltracker.accessToken',
      buildToken({ sub: 'admin', role: 'ADMIN', exp: futureExp() })
    );

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('medicaltracker.accessToken')).toBeNull();
  });
});

function buildToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${body}.signature`;
}

function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 3600;
}

function pastExp(): number {
  return Math.floor(Date.now() / 1000) - 3600;
}
