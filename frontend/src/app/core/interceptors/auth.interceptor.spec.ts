import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('adds Authorization header for protected API requests when token exists', () => {
    sessionStorage.setItem('medicaltracker.accessToken', 'access-token-value');

    http.get('/api/patients').subscribe();

    const request = httpMock.expectOne('/api/patients');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token-value');
    request.flush([]);
  });

  it('does not add Authorization header for auth endpoints', () => {
    sessionStorage.setItem('medicaltracker.accessToken', 'access-token-value');

    http.post('/api/auth/login', { username: 'u', password: 'p' }).subscribe();

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ token: 'jwt' });
  });

  it('does not add Authorization header when token is missing', () => {
    http.get('/api/patients').subscribe();

    const request = httpMock.expectOne('/api/patients');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });

  it('clears the session and redirects when a protected request is unauthorized', () => {
    sessionStorage.setItem('medicaltracker.accessToken', 'access-token-value');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    http.get('/api/patients').subscribe({ error: () => undefined });

    const request = httpMock.expectOne('/api/patients');
    request.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(sessionStorage.getItem('medicaltracker.accessToken')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'expired' } });
  });
});
