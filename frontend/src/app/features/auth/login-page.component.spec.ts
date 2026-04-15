import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter, Router } from '@angular/router';

import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

describe('LoginPageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'getCurrentRole'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    i18nServiceSpy.t.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('redirects patient users to patient portal after login', () => {
    authServiceSpy.login.and.returnValue(of(void 0));
    authServiceSpy.getCurrentRole.and.returnValue('PATIENT');
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.patchValue({ username: 'patient1', password: 'pass1234' });
    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/patient-portal');
  });

  it('redirects clinic users to dashboard after login', () => {
    authServiceSpy.login.and.returnValue(of(void 0));
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.patchValue({ username: 'admin', password: 'Admin123!' });
    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
