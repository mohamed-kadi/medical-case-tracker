import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminUsersPageComponent } from './admin-users-page.component';
import { AdminUserService } from '../../core/services/admin-user.service';
import { I18nService } from '../../core/services/i18n.service';

describe('AdminUsersPageComponent', () => {
  let adminUserServiceSpy: jasmine.SpyObj<AdminUserService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    adminUserServiceSpy = jasmine.createSpyObj<AdminUserService>('AdminUserService', [
      'createInternalUser',
      'getInternalUsers'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    i18nServiceSpy.t.and.callFake((key: string) => key);
    adminUserServiceSpy.getInternalUsers.and.returnValue(
      of([
        {
          id: 10,
          username: 'doctor_one',
          email: 'doctor.one@clinic.com',
          role: 'DOCTOR',
          enabled: true
        },
        {
          id: 11,
          username: 'staff_one',
          email: 'staff.one@clinic.com',
          role: 'STAFF',
          enabled: true
        }
      ])
    );

    await TestBed.configureTestingModule({
      imports: [AdminUsersPageComponent],
      providers: [
        provideRouter([]),
        { provide: AdminUserService, useValue: adminUserServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads internal users on init', () => {
    const fixture = TestBed.createComponent(AdminUsersPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(adminUserServiceSpy.getInternalUsers).toHaveBeenCalledWith('ALL');
    expect(component.users.length).toBe(2);
  });

  it('reloads directory when role filter changes', () => {
    const fixture = TestBed.createComponent(AdminUsersPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.onDirectoryRoleChange('STAFF');

    expect(adminUserServiceSpy.getInternalUsers).toHaveBeenCalledWith('STAFF');
  });

  it('filters visible users by search term', () => {
    const fixture = TestBed.createComponent(AdminUsersPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.onSearchInput('staff');

    expect(component.visibleUsers.length).toBe(1);
    expect(component.visibleUsers[0].username).toBe('staff_one');
  });

  it('creates a doctor account from the form', () => {
    adminUserServiceSpy.createInternalUser.and.returnValue(
      of({
        id: 10,
        username: 'doctor_one',
        email: 'doctor.one@clinic.com',
        role: 'DOCTOR',
        enabled: true
      })
    );

    const fixture = TestBed.createComponent(AdminUsersPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.patchValue({
      username: 'doctor_one',
      email: 'doctor.one@clinic.com',
      password: 'StrongPass123!',
      role: 'DOCTOR'
    });
    component.submit();

    expect(adminUserServiceSpy.createInternalUser).toHaveBeenCalledWith({
      username: 'doctor_one',
      email: 'doctor.one@clinic.com',
      password: 'StrongPass123!',
      role: 'DOCTOR'
    });
    expect(adminUserServiceSpy.getInternalUsers).toHaveBeenCalledTimes(2);
    expect(component.successMessage).toContain('admin.users.success');
    expect(component.errorMessage).toBe('');
  });

  it('shows error message when API fails', () => {
    adminUserServiceSpy.createInternalUser.and.returnValue(throwError(() => new Error('failed')));

    const fixture = TestBed.createComponent(AdminUsersPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.patchValue({
      username: 'staff_one',
      email: 'staff.one@clinic.com',
      password: 'StrongPass123!',
      role: 'STAFF'
    });
    component.submit();

    expect(component.errorMessage).toBe('admin.users.error');
    expect(component.isSubmitting).toBeFalse();
  });
});
