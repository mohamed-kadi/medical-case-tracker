import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { clinicalGuard } from './clinical.guard';
import { AuthService } from '../services/auth.service';

describe('clinicalGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  const route = {} as any;
  const state = {} as any;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'getCurrentRole']);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    });

    router = TestBed.inject(Router);
  });

  it('redirects anonymous users to login', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => clinicalGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/login');
  });

  it('allows doctor role', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');

    const result = TestBed.runInInjectionContext(() => clinicalGuard(route, state));

    expect(result).toBeTrue();
  });

  it('allows staff role', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('STAFF');

    const result = TestBed.runInInjectionContext(() => clinicalGuard(route, state));

    expect(result).toBeTrue();
  });

  it('redirects admin to dashboard', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');

    const result = TestBed.runInInjectionContext(() => clinicalGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/dashboard');
  });

  it('redirects patient to patient portal', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('PATIENT');

    const result = TestBed.runInInjectionContext(() => clinicalGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/patient-portal');
  });
});
