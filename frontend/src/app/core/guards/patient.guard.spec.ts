import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { patientGuard } from './patient.guard';
import { AuthService } from '../services/auth.service';

describe('patientGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'getCurrentRole']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    router = TestBed.inject(Router);
  });

  it('redirects anonymous users to login', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => patientGuard({} as any, {} as any));

    expect(router.serializeUrl(result as any)).toBe('/login');
  });

  it('allows patient role', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('PATIENT');

    const result = TestBed.runInInjectionContext(() => patientGuard({} as any, {} as any));

    expect(result).toBeTrue();
  });

  it('redirects internal roles to dashboard', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');

    const result = TestBed.runInInjectionContext(() => patientGuard({} as any, {} as any));

    expect(router.serializeUrl(result as any)).toBe('/dashboard');
  });
});
