import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

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
        provideHttpClientTesting()
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
});
