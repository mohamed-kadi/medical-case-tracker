import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AppointmentService } from '../../core/services/appointment.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';
import { AppointmentsPageComponent } from './appointments-page.component';

describe('AppointmentsPageComponent', () => {
  let appointmentServiceSpy: jasmine.SpyObj<AppointmentService>;
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    appointmentServiceSpy = jasmine.createSpyObj<AppointmentService>('AppointmentService', [
      'getUpcomingAppointments',
      'createAppointment',
      'updateAppointmentStatus'
    ]);
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', ['getVisiblePatients']);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);

    appointmentServiceSpy.getUpcomingAppointments.and.returnValue(of([]));
    appointmentServiceSpy.createAppointment.and.returnValue(
      of({
        id: 81,
        scheduledAt: '2030-01-02T14:00:00',
        reason: 'Follow-up',
        notes: null,
        status: 'SCHEDULED'
      })
    );
    appointmentServiceSpy.updateAppointmentStatus.and.returnValue(
      of({
        id: 81,
        scheduledAt: '2030-01-02T14:00:00',
        reason: 'Follow-up',
        notes: null,
        status: 'CANCELLED'
      })
    );
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
    i18nServiceSpy.t.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [AppointmentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AppointmentService, useValue: appointmentServiceSpy },
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads patients and appointments on init', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(patientServiceSpy.getVisiblePatients).toHaveBeenCalled();
    expect(appointmentServiceSpy.getUpcomingAppointments).toHaveBeenCalled();
    expect(component.patients.length).toBe(1);
    expect(component.patients[0].id).toBe(10);
  });

  it('creates appointment with normalized values', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.patchValue({
      patientId: 10,
      scheduledAt: '2030-01-02T14:00',
      reason: '  Follow-up  ',
      notes: '  '
    });
    component.createAppointment();

    expect(appointmentServiceSpy.createAppointment).toHaveBeenCalledWith(10, {
      scheduledAt: '2030-01-02T14:00:00',
      reason: 'Follow-up',
      notes: null
    });
    expect(component.successMessage).toBe('appointments.create.success');
  });

  it('does not create appointment when reason is only whitespace', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.patchValue({
      patientId: 10,
      scheduledAt: '2030-01-02T14:00',
      reason: '   ',
      notes: ''
    });
    component.createAppointment();

    expect(appointmentServiceSpy.createAppointment).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('common.required');
  });

  it('shows backend message when create appointment fails', () => {
    appointmentServiceSpy.createAppointment.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Reason is required' } }))
    );

    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.patchValue({
      patientId: 10,
      scheduledAt: '2030-01-02T14:00',
      reason: 'Follow-up',
      notes: ''
    });
    component.createAppointment();

    expect(component.errorMessage).toBe('Reason is required');
  });

  it('cancels appointment when user confirms', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.appointments = [
      {
        id: 81,
        scheduledAt: '2030-01-02T14:00:00',
        reason: 'Follow-up',
        notes: null,
        status: 'SCHEDULED'
      }
    ];

    component.cancelAppointment(81);

    expect(appointmentServiceSpy.updateAppointmentStatus).toHaveBeenCalledWith(81, 'CANCELLED');
    expect(component.appointments.length).toBe(0);
    expect(component.successMessage).toBe('appointments.cancel.success');
  });

  it('does not cancel appointment when user cancels confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.cancelAppointment(81);

    expect(appointmentServiceSpy.updateAppointmentStatus).not.toHaveBeenCalled();
  });
});
