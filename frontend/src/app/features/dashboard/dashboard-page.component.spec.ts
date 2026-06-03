import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DashboardPageComponent } from './dashboard-page.component';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';
import { AppointmentService } from '../../core/services/appointment.service';

describe('DashboardPageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let appointmentServiceSpy: jasmine.SpyObj<AppointmentService>;
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
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);

    authServiceSpy.getCurrentUsername.and.returnValue('doctorOne');
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');
    patientServiceSpy.getVisiblePatients.and.returnValue(of([]));
    appointmentServiceSpy.getUpcomingAppointments.and.returnValue(of([]));
    i18nServiceSpy.t.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: AppointmentService, useValue: appointmentServiceSpy },
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

  it('shows clinical workflow cards for doctors and front desk users', () => {
    authServiceSpy.getCurrentRole.and.returnValue('FRONT_DESK');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const cards = Array.from(
      fixture.nativeElement.querySelectorAll('.workflow-card'),
      (element: Element) => element.textContent?.trim()
    );

    expect(cards.join(' ')).toContain('dashboard.path.intake.title');
    expect(cards.join(' ')).toContain('dashboard.path.patients.title');
    expect(cards.join(' ')).toContain('dashboard.path.schedule.title');
  });

  it('uses a doctor-specific dashboard title and compact role chip', () => {
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const chip = fixture.nativeElement.querySelector('.role-chip') as HTMLElement;

    expect(component.dashboardTitleKey).toBe('dashboard.title.doctor');
    expect(component.dashboardDescriptionKey).toBe('dashboard.description.doctor');
    expect(component.dashboardRoleClass).toBe('role-doctor');
    expect(chip.textContent).toContain('roles.doctor');
    expect(chip.textContent).not.toContain('dashboard.role');
  });

  it('uses a front-desk-specific dashboard title and theme', () => {
    authServiceSpy.getCurrentRole.and.returnValue('FRONT_DESK');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.dashboardTitleKey).toBe('dashboard.title.frontDesk');
    expect(component.dashboardDescriptionKey).toBe('dashboard.description.frontDesk');
    expect(component.dashboardRoleClass).toBe('role-front-desk');
    expect(component.roleLabelKey).toBe('roles.frontDesk');
  });

  it('shows admin workflow cards and skips appointment loading for admin users', () => {
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(appointmentServiceSpy.getUpcomingAppointments).not.toHaveBeenCalled();

    const cards = Array.from(
      fixture.nativeElement.querySelectorAll('.workflow-card'),
      (element: Element) => element.textContent?.trim()
    );
    expect(cards.join(' ')).toContain('dashboard.path.team.title');
    expect(cards.join(' ')).toContain('dashboard.path.assignments.title');
    expect(cards.join(' ')).toContain('dashboard.path.audit.title');
    expect(cards.join(' ')).not.toContain('dashboard.path.intake.title');
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
  });

  it('links admin users to the dedicated assignments workspace', () => {
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const assignmentLink = fixture.nativeElement.querySelector('a[href="/admin/assignments"]');
    expect(assignmentLink).not.toBeNull();
  });
});
