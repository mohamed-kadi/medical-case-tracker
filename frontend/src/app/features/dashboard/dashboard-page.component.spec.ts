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
      'getVisiblePatients',
      'assignPatient'
    ]);
    appointmentServiceSpy = jasmine.createSpyObj<AppointmentService>('AppointmentService', [
      'getUpcomingAppointments',
      'createAppointment'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);

    authServiceSpy.getCurrentUsername.and.returnValue('doctorOne');
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');
    appointmentServiceSpy.getUpcomingAppointments.and.returnValue(of([]));
    appointmentServiceSpy.createAppointment.and.returnValue(
      of({
        id: 99,
        scheduledAt: '2030-01-02T14:00:00',
        reason: 'Follow-up',
        notes: null,
        status: 'SCHEDULED'
      })
    );
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

  it('loads visible patients on init', () => {
    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
        {
          id: 10,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@clinic.com',
          status: 'ACTIVE',
          assignedDoctorUsername: 'doctorOne',
          assignedStaffUsername: null
        }
      ])
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(patientServiceSpy.getVisiblePatients).toHaveBeenCalled();
    expect(appointmentServiceSpy.getUpcomingAppointments).toHaveBeenCalled();
    expect(component.patients.length).toBe(1);
    expect(component.patients[0].id).toBe(10);
    expect(component.isAdmin).toBeFalse();
  });

  it('shows team management quick action for admin users', () => {
    authServiceSpy.getCurrentRole.and.returnValue('ADMIN');
    patientServiceSpy.getVisiblePatients.and.returnValue(of([]));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    expect(appointmentServiceSpy.getUpcomingAppointments).not.toHaveBeenCalled();

    const quickLinks = Array.from(
      fixture.nativeElement.querySelectorAll('.quick-actions .quick-link'),
      (element: Element) => element.textContent?.trim()
    );
    expect(quickLinks).toContain('dashboard.quick.team');
    expect(quickLinks).toContain('dashboard.quick.audit');
    expect(quickLinks).not.toContain('dashboard.quick.patients');
    expect(quickLinks).not.toContain('dashboard.quick.newPatient');
  });

  it('hides team management quick action for non-admin users', () => {
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');
    patientServiceSpy.getVisiblePatients.and.returnValue(of([]));

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const quickLinks = Array.from(
      fixture.nativeElement.querySelectorAll('.quick-actions .quick-link'),
      (element: Element) => element.textContent?.trim()
    );
    expect(quickLinks).not.toContain('dashboard.quick.team');
    expect(quickLinks).not.toContain('dashboard.quick.audit');
  });

  it('sends assignment update when admin saves assignment', () => {
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
          assignedStaffUsername: null
        }
      ])
    );
    patientServiceSpy.assignPatient.and.returnValue(
      of({
        id: 10,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@clinic.com',
        status: 'ACTIVE',
        assignedDoctorUsername: 'doctorOne',
        assignedStaffUsername: 'staffOne'
      })
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.updateDraft(10, 'doctorUsername', 'doctorOne');
    component.updateDraft(10, 'staffUsername', 'staffOne');
    component.saveAssignment(10);

    expect(patientServiceSpy.assignPatient).toHaveBeenCalledWith(10, {
      doctorUsername: 'doctorOne',
      staffUsername: 'staffOne'
    });
    expect(component.patients[0].assignedDoctorUsername).toBe('doctorOne');
    expect(component.patients[0].assignedStaffUsername).toBe('staffOne');
  });

  it('loads upcoming appointments on init', () => {
    patientServiceSpy.getVisiblePatients.and.returnValue(of([]));
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

    expect(component.appointments.length).toBe(1);
    expect(component.appointments[0].id).toBe(55);
  });

  it('creates appointment from dashboard form', () => {
    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
        {
          id: 10,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@clinic.com',
          status: 'ACTIVE',
          assignedDoctorUsername: 'doctorOne',
          assignedStaffUsername: null
        }
      ])
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.appointmentForm.patchValue({
      patientId: 10,
      scheduledAt: '2030-01-02T14:00',
      reason: 'Follow-up',
      notes: 'Bring report'
    });
    component.createAppointment();

    expect(appointmentServiceSpy.createAppointment).toHaveBeenCalledWith(10, {
      scheduledAt: '2030-01-02T14:00:00',
      reason: 'Follow-up',
      notes: 'Bring report'
    });
    expect(component.appointments.length).toBe(1);
    expect(component.appointments[0].id).toBe(99);
  });

  it('does not create appointment for admin users', () => {
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
          assignedStaffUsername: null
        }
      ])
    );

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.appointmentForm.patchValue({
      patientId: 10,
      scheduledAt: '2030-01-02T14:00',
      reason: 'Follow-up',
      notes: 'Bring report'
    });
    component.createAppointment();

    expect(appointmentServiceSpy.createAppointment).not.toHaveBeenCalled();
  });
});
