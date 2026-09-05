import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AppointmentService } from '../../core/services/appointment.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';
import { ConfirmationService } from '../../shared/confirmation.service';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentsPageComponent } from './appointments-page.component';

describe('AppointmentsPageComponent', () => {
  let appointmentServiceSpy: jasmine.SpyObj<AppointmentService>;
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;
  let confirmationSpy: jasmine.SpyObj<ConfirmationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const patient = {
    id: 10,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@clinic.com',
    status: 'ACTIVE',
    assignedDoctorUsername: 'doctorOne',
    assignedFrontDeskUsername: null
  };

  beforeEach(async () => {
    appointmentServiceSpy = jasmine.createSpyObj<AppointmentService>('AppointmentService', [
      'getUpcomingAppointmentPage',
      'createAppointment',
      'updateAppointmentStatus'
    ]);
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', [
      'getVisiblePatientPage',
      'getPatientById'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    confirmationSpy = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm']);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentRole']);
    authServiceSpy.getCurrentRole.and.returnValue('FRONT_DESK');

    appointmentServiceSpy.getUpcomingAppointmentPage.and.returnValue(
      of({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0, last: true })
    );
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
    patientServiceSpy.getVisiblePatientPage.and.returnValue(
      of({ content: [patient], page: 0, size: 10, totalElements: 1, totalPages: 1, last: true })
    );
    patientServiceSpy.getPatientById.and.returnValue(of(patient));
    confirmationSpy.confirm.and.returnValue(Promise.resolve(true));
    i18nServiceSpy.t.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [AppointmentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AppointmentService, useValue: appointmentServiceSpy },
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: ConfirmationService, useValue: confirmationSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('starts with patient search and loads appointments on init', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(patientServiceSpy.getVisiblePatientPage).not.toHaveBeenCalled();
    expect(appointmentServiceSpy.getUpcomingAppointmentPage).toHaveBeenCalledWith(0, 25);
    expect(component.selectedPatient).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('appointments.search.title');
  });

  it('searches patient files before scheduling', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.patientSearchForm.controls.query.setValue('John');
    component.searchPatients();

    expect(patientServiceSpy.getVisiblePatientPage).toHaveBeenCalledWith(0, 10, 'John');
    expect(component.patients).toEqual([patient]);
  });

  it('shows patient identity in the upcoming appointments table', () => {
    appointmentServiceSpy.getUpcomingAppointmentPage.and.returnValue(
      of({ content: [
        {
          id: 81,
          patientId: 10,
          patientName: 'John Doe',
          patientNumber: 'MT-2030-000010',
          scheduledAt: '2030-01-02T14:00:00',
          reason: 'Follow-up',
          notes: null,
          status: 'SCHEDULED'
        }
      ], page: 0, size: 25, totalElements: 1, totalPages: 1, last: true })
    );
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.scheduleExpanded = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('John Doe');
    expect(fixture.nativeElement.textContent).toContain('MT-2030-000010');
    expect(fixture.nativeElement.querySelector('a[href="/patients/10"]')).not.toBeNull();
  });

  it('creates appointment with normalized values', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectPatient(patient);

    component.form.patchValue({
      scheduledAt: '2030-01-02T14:00',
      reasonChoice: 'FOLLOW_UP',
      notes: '  '
    });
    component.createAppointment();

    expect(appointmentServiceSpy.createAppointment).toHaveBeenCalledWith(10, {
      scheduledAt: '2030-01-02T14:00:00',
      reason: 'FOLLOW_UP',
      notes: null
    });
    expect(component.successMessage).toBe('appointments.create.success');
  });

  it('does not create appointment when reason is only whitespace', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectPatient(patient);

    component.form.patchValue({
      scheduledAt: '2030-01-02T14:00',
      reasonChoice: 'OTHER',
      otherReason: '   ',
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
    component.selectPatient(patient);

    component.form.patchValue({
      scheduledAt: '2030-01-02T14:00',
      reasonChoice: 'FOLLOW_UP',
      notes: ''
    });
    component.createAppointment();

    expect(component.errorMessage).toBe('Reason is required');
  });

  it('shows localized feedback when the appointment slot conflicts', () => {
    appointmentServiceSpy.createAppointment.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'APPOINTMENT_TIME_CONFLICT', error: 'server fallback' }
          })
      )
    );

    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectPatient(patient);
    component.form.patchValue({
      scheduledAt: '2030-01-02T14:00',
      reasonChoice: 'FOLLOW_UP',
      notes: ''
    });

    component.createAppointment();

    expect(component.errorMessage).toBe('appointments.create.conflictError');
  });

  it('rejects a past date before calling the API', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectPatient(patient);
    component.form.patchValue({
      scheduledAt: '2020-01-02T14:00',
      reasonChoice: 'FOLLOW_UP',
      notes: ''
    });

    component.createAppointment();

    expect(appointmentServiceSpy.createAppointment).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('appointments.create.pastError');
  });

  it('cancels appointment when user confirms', async () => {
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

    await component.cancelAppointment(81);

    expect(confirmationSpy.confirm).toHaveBeenCalled();
    expect(appointmentServiceSpy.updateAppointmentStatus).toHaveBeenCalledWith(81, 'CANCELLED');
    expect(component.appointments.length).toBe(0);
    expect(component.successMessage).toBe('appointments.cancel.success');
  });

  it('does not cancel appointment when user cancels confirmation', async () => {
    confirmationSpy.confirm.and.returnValue(Promise.resolve(false));
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    await component.cancelAppointment(81);

    expect(appointmentServiceSpy.updateAppointmentStatus).not.toHaveBeenCalled();
  });

  it('lets front desk check in a scheduled patient for the doctor queue', () => {
    appointmentServiceSpy.updateAppointmentStatus.and.returnValue(of({
      id: 81,
      patientId: 10,
      patientName: 'John Doe',
      scheduledAt: '2030-01-02T14:00:00',
      reason: 'FOLLOW_UP',
      notes: null,
      status: 'CHECKED_IN'
    }));
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.appointments = [{
      id: 81,
      patientId: 10,
      patientName: 'John Doe',
      scheduledAt: '2030-01-02T14:00:00',
      reason: 'FOLLOW_UP',
      notes: null,
      status: 'SCHEDULED'
    }];
    component.totalAppointments = 1;

    component.checkInAppointment(81);

    expect(appointmentServiceSpy.updateAppointmentStatus).toHaveBeenCalledWith(81, 'CHECKED_IN');
    expect(component.appointments).toEqual([]);
    expect(component.successMessage).toBe('appointments.checkIn.success');
  });

  it('adds patient-reported checklist items to optional notes', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectPatient(patient);
    component.form.patchValue({
      scheduledAt: '2030-01-02T14:00',
      reasonChoice: 'GENERAL_CONSULTATION',
      reportsPastSurgery: true,
      reportsAllergies: true,
      notes: 'Bring documents'
    });

    component.createAppointment();

    expect(appointmentServiceSpy.createAppointment).toHaveBeenCalledWith(10, {
      scheduledAt: '2030-01-02T14:00:00',
      reason: 'GENERAL_CONSULTATION',
      notes: 'appointments.intake.notesPrefix: appointments.intake.pastSurgery; appointments.intake.allergies\nBring documents'
    });
  });
});
