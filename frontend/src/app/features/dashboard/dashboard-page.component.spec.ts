import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DashboardPageComponent } from './dashboard-page.component';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AdminUserService } from '../../core/services/admin-user.service';
import { AuditService } from '../../core/services/audit.service';

describe('DashboardPageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let appointmentServiceSpy: jasmine.SpyObj<AppointmentService>;
  let adminUserServiceSpy: jasmine.SpyObj<AdminUserService>;
  let auditServiceSpy: jasmine.SpyObj<AuditService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getCurrentUsername',
      'getCurrentRole'
    ]);
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', [
      'getVisiblePatients'
    ]);
    appointmentServiceSpy = jasmine.createSpyObj<AppointmentService>('AppointmentService', [
      'getUpcomingAppointments'
    ]);
    adminUserServiceSpy = jasmine.createSpyObj<AdminUserService>('AdminUserService', [
      'getInternalUsers'
    ]);
    auditServiceSpy = jasmine.createSpyObj<AuditService>('AuditService', ['getEvents']);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);

    authServiceSpy.getCurrentUsername.and.returnValue('doctorOne');
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');
    patientServiceSpy.getVisiblePatients.and.returnValue(of([]));
    appointmentServiceSpy.getUpcomingAppointments.and.returnValue(of([]));
    adminUserServiceSpy.getInternalUsers.and.returnValue(of([]));
    auditServiceSpy.getEvents.and.returnValue(of([]));
    i18nServiceSpy.t.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: AppointmentService, useValue: appointmentServiceSpy },
        { provide: AdminUserService, useValue: adminUserServiceSpy },
        { provide: AuditService, useValue: auditServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads visible patients and upcoming appointments for clinical users', () => {
    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
        {
          id: 10,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@clinic.com',
          status: 'ACTIVE',
          assignedDoctorUsername: 'doctorOne',
          assignedFrontDeskUsername: null
        }
      ])
    );
    appointmentServiceSpy.getUpcomingAppointments.and.returnValue(
      of([
        {
          id: 55,
          scheduledAt: '2030-01-01T09:30:00',
          reason: 'Follow-up',
          notes: null,
          status: 'SCHEDULED'
        }
      ])
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(patientServiceSpy.getVisiblePatients).toHaveBeenCalled();
    expect(appointmentServiceSpy.getUpcomingAppointments).toHaveBeenCalled();
    expect(component.patients.length).toBe(1);
    expect(component.appointments.length).toBe(1);
    expect(component.isAdmin).toBeFalse();
  });

  it('shows a focused intake action and patient preview for doctors', () => {
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dashboard-command')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/patients/new"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.patients-preview-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.workflow-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.schedule-panel')).toBeNull();
  });

  it('shows front desk operational content without duplicating module navigation', () => {
    authServiceSpy.getCurrentRole.and.returnValue('FRONT_DESK');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.dashboard-command')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.patients-preview-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.workflow-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.schedule-panel')).toBeNull();
  });

  it('uses a doctor-specific dashboard theme without repeating page identity', () => {
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.dashboardRoleClass).toBe('role-doctor');
    expect(fixture.nativeElement.querySelector('h1')).toBeNull();
    expect(fixture.nativeElement.querySelector('.role-chip')).toBeNull();
  });

  it('uses a front-desk-specific dashboard title and theme', () => {
    authServiceSpy.getCurrentRole.and.returnValue('FRONT_DESK');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.dashboardRoleClass).toBe('role-front-desk');
  });

  it('shows admin operational panels and skips repeated module shortcuts', () => {
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(appointmentServiceSpy.getUpcomingAppointments).not.toHaveBeenCalled();
    expect(adminUserServiceSpy.getInternalUsers).toHaveBeenCalledOnceWith('ALL');
    expect(auditServiceSpy.getEvents).toHaveBeenCalledOnceWith({ limit: 5 });

    expect(fixture.nativeElement.querySelector('.workflow-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dashboard-command')).toBeNull();
    expect(fixture.nativeElement.querySelector('.admin-attention-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.admin-audit-panel')).not.toBeNull();
  });

  it('summarizes assignment gaps for admin users', () => {
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');
    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
        {
          id: 10,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@clinic.com',
          status: 'ACTIVE',
          assignedDoctorUsername: null,
          assignedFrontDeskUsername: null
        },
        {
          id: 11,
          firstName: 'Jane',
          lastName: 'Roe',
          email: 'jane@clinic.com',
          status: 'ACTIVE',
          assignedDoctorUsername: 'doctorOne',
          assignedFrontDeskUsername: 'frontOne'
        }
      ])
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.unassignedDoctorCount).toBe(1);
    expect(component.unassignedFrontDeskCount).toBe(1);
    expect(component.assignmentGapCount).toBe(1);
  });

  it('organizes admin dashboard with staff metrics, attention queue, and recent audit', () => {
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');
    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
        {
          id: 10,
          patientNumber: 'MT-2026-000010',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@clinic.com',
          status: 'ACTIVE',
          assignedDoctorUsername: null,
          assignedFrontDeskUsername: 'frontOne'
        }
      ])
    );
    adminUserServiceSpy.getInternalUsers.and.returnValue(
      of([
        {
          id: 1,
          username: 'doctorOne',
          email: 'doctor@clinic.local',
          role: 'DOCTOR',
          enabled: true
        },
        {
          id: 2,
          username: 'frontOne',
          email: 'front@clinic.local',
          role: 'FRONT_DESK',
          enabled: true
        },
        {
          id: 3,
          username: 'frontDisabled',
          email: 'disabled@clinic.local',
          role: 'FRONT_DESK',
          enabled: false
        }
      ])
    );
    auditServiceSpy.getEvents.and.returnValue(
      of([
        {
          id: 99,
          entityType: 'PATIENT',
          entityId: 10,
          action: 'CREATE',
          actorUsername: 'frontOne',
          details: null,
          createdAt: '2030-01-01T09:30:00'
        }
      ])
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const text = fixture.nativeElement.textContent as string;

    expect(component.enabledDoctorCount).toBe(1);
    expect(component.enabledFrontDeskCount).toBe(1);
    expect(component.inactiveInternalUserCount).toBe(1);
    expect(component.assignmentQueuePreview.length).toBe(1);
    expect(component.recentAuditEvents.length).toBe(1);
    expect(text).toContain('dashboard.adminAttention.title');
    expect(text).toContain('dashboard.adminAudit.title');
    expect(text).not.toContain('dashboard.adminSystem.title');
    expect(text).toContain('MT-2026-000010');
    expect(text).toContain('CREATE');
  });

  it('links admin users to the dedicated assignments workspace', () => {
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const assignmentLink = fixture.nativeElement.querySelector('a[href="/admin/assignments"]');
    expect(assignmentLink).not.toBeNull();
  });
});
