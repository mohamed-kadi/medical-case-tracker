import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { internalGuard } from './internal.guard';
import { AuthService } from '../services/auth.service';

describe('internalGuard', () => {
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

    const result = TestBed.runInInjectionContext(() => internalGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/login');
  });

  it('allows clinic roles', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');

    const result = TestBed.runInInjectionContext(() => internalGuard(route, state));

    expect(result).toBeTrue();
  });

  it('redirects patient role to patient portal', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('PATIENT');

    const result = TestBed.runInInjectionContext(() => internalGuard(route, state));

    expect(router.serializeUrl(result as any)).toBe('/patient-portal');
  });
});
