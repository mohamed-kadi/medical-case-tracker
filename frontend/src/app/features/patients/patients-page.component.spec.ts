import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PatientsPageComponent } from './patients-page.component';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { I18nService } from '../../core/services/i18n.service';
import { AppointmentService } from '../../core/services/appointment.service';

describe('PatientsPageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;
  let appointmentServiceSpy: jasmine.SpyObj<AppointmentService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentRole']);
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', ['getVisiblePatientPage']);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    appointmentServiceSpy = jasmine.createSpyObj<AppointmentService>('AppointmentService', [
      'getCheckedInAppointments',
      'updateAppointmentStatus'
    ]);
    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');
    i18nServiceSpy.t.and.callFake((key: string) => key);
    appointmentServiceSpy.getCheckedInAppointments.and.returnValue(of([]));

    patientServiceSpy.getVisiblePatientPage.and.returnValue(
      of({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0, last: true })
    );

    await TestBed.configureTestingModule({
      imports: [PatientsPageComponent],
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
    patientServiceSpy.getVisiblePatientPage.and.returnValue(
      of({ content: [
        {
          id: 20,
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1989-05-01',
          email: 'john@clinic.com',
          phoneNumber: '+212600000000',
          medicalHistory: null,
          status: 'ACTIVE'
        }
      ], page: 0, size: 25, totalElements: 1, totalPages: 1, last: true })
    );

    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(patientServiceSpy.getVisiblePatientPage).toHaveBeenCalledWith(0, 25, '', undefined);
    expect(component.patients.length).toBe(1);
    expect(component.patients[0].id).toBe(20);
    expect(component.directoryExpanded).toBeFalse();
    expect(appointmentServiceSpy.getCheckedInAppointments).toHaveBeenCalled();
  });

  it('shows checked-in patients to their assigned doctor and completes the visit', () => {
    appointmentServiceSpy.getCheckedInAppointments.and.returnValue(of([{
      id: 91,
      patientId: 20,
      patientName: 'John Doe',
      patientNumber: 'MT-2026-000020',
      scheduledAt: '2030-01-01T09:30:00',
      reason: 'FOLLOW_UP',
      notes: null,
      status: 'CHECKED_IN'
    }]));
    appointmentServiceSpy.updateAppointmentStatus.and.returnValue(of({
      id: 91,
      patientId: 20,
      patientName: 'John Doe',
      patientNumber: 'MT-2026-000020',
      scheduledAt: '2030-01-01T09:30:00',
      reason: 'FOLLOW_UP',
      notes: null,
      status: 'COMPLETED'
    }));

    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(fixture.nativeElement.textContent).toContain('John Doe');
    component.completeAppointment(91);
    expect(appointmentServiceSpy.updateAppointmentStatus).toHaveBeenCalledWith(91, 'COMPLETED');
    expect(component.checkedInAppointments).toEqual([]);
  });

  it('sends debounced search terms to the server', fakeAsync(() => {
    patientServiceSpy.getVisiblePatientPage.and.returnValue(
      of({
        content: [{ id: 2, firstName: 'Nora', lastName: 'Smith', email: 'nora@clinic.com', status: 'ACTIVE' }],
        page: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
        last: true
      })
    );

    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.updateSearchTerm('nora');
    tick(250);

    expect(patientServiceSpy.getVisiblePatientPage).toHaveBeenCalledWith(0, 25, 'nora', undefined);
    expect(component.patients[0].id).toBe(2);
  }));

  it('searches patient numbers and limits the initial rendered batch', () => {
    patientServiceSpy.getVisiblePatientPage.and.callFake((page) =>
      of({
        content: Array.from({ length: page === 0 ? 25 : 5 }, (_, index) => ({
          id: page * 25 + index + 1,
          patientNumber: `MT-2030-${String(page * 25 + index + 1).padStart(6, '0')}`,
          firstName: `Patient${index + 1}`,
          lastName: 'Example',
          email: `patient${index + 1}@clinic.com`,
          status: 'ACTIVE'
        })),
        page,
        size: 25,
        totalElements: 30,
        totalPages: 2,
        last: page === 1
      })
    );

    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.visiblePatients.length).toBe(25);
    component.showMore();
    expect(component.visiblePatients.length).toBe(30);

    expect(patientServiceSpy.getVisiblePatientPage).toHaveBeenCalledWith(1, 25, '', undefined);
  });

  it('filters patients by status', () => {
    patientServiceSpy.getVisiblePatientPage.and.returnValue(
      of({ content: [{
          id: 2,
          firstName: 'Nora',
          lastName: 'Smith',
          dateOfBirth: '1991-03-12',
          email: 'nora@clinic.com',
          status: 'INACTIVE'
        }], page: 0, size: 25, totalElements: 1, totalPages: 1, last: true })
    );

    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.setStatusFilter('INACTIVE');

    expect(patientServiceSpy.getVisiblePatientPage).toHaveBeenCalledWith(0, 25, '', 'INACTIVE');
    expect(component.patients[0].id).toBe(2);
  });

  it('clears search and status filters', () => {
    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.searchTerm = 'abc';
    component.setStatusFilter('ARCHIVED');
    component.clearFilters();

    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('ALL');
  });

  it('returns patient id from trackByPatientId', () => {
    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    const id = component.trackByPatientId(0, {
      id: 77,
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      status: 'ACTIVE'
    });

    expect(id).toBe(77);
  });
});
