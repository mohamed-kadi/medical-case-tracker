import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
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

  it('allows anonymous users', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => guestGuard(route, state));

    expect(result).toBeTrue();
  });

  it('redirects clinic users to dashboard', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');

    const result = TestBed.runInInjectionContext(() => guestGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/dashboard');
  });

  it('redirects patient users to patient portal', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('PATIENT');

    const result = TestBed.runInInjectionContext(() => guestGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/patient-portal');
  });
});
