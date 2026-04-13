import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { languageInterceptor } from './language.interceptor';
import { LanguageService } from '../services/language.service';

describe('languageInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let languageService: LanguageService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([languageInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    languageService = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('adds default Accept-Language header', () => {
    http.get('/api/patients').subscribe();

    const request = httpMock.expectOne('/api/patients');
    expect(request.request.headers.get('Accept-Language')).toBe('en');
    request.flush([]);
  });

  it('adds updated Accept-Language header after language switch', () => {
    languageService.setLanguage('fr');

    http.get('/api/patients').subscribe();

    const request = httpMock.expectOne('/api/patients');
    expect(request.request.headers.get('Accept-Language')).toBe('fr');
    request.flush([]);
  });
});
