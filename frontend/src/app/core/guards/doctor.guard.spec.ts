import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { doctorGuard } from './doctor.guard';
import { AuthService } from '../services/auth.service';

describe('doctorGuard', () => {
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

    const result = TestBed.runInInjectionContext(() => doctorGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/login');
  });

  it('allows doctor role', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');

    const result = TestBed.runInInjectionContext(() => doctorGuard(route, state));

    expect(result).toBeTrue();
  });

  it('redirects front desk to dashboard', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('FRONT_DESK');

    const result = TestBed.runInInjectionContext(() => doctorGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/dashboard');
  });

  it('redirects patient to patient portal', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('PATIENT');

    const result = TestBed.runInInjectionContext(() => doctorGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/patient-portal');
  });
});
