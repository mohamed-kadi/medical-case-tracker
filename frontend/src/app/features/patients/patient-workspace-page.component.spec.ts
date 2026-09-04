import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PatientWorkspacePageComponent } from './patient-workspace-page.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { CaseService } from '../../core/services/case.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';

describe('PatientWorkspacePageComponent', () => {
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let caseServiceSpy: jasmine.SpyObj<CaseService>;
  let appointmentServiceSpy: jasmine.SpyObj<AppointmentService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: convertToParamMap({ id: '20' })
    }
  };

  beforeEach(async () => {
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', ['getPatientById']);
    caseServiceSpy = jasmine.createSpyObj<CaseService>('CaseService', [
      'getCasesByPatientId',
      'createCase',
      'updateCase',
      'updateCaseStatus'
    ]);
    appointmentServiceSpy = jasmine.createSpyObj<AppointmentService>('AppointmentService', [
      'getAppointmentsByPatientId',
      'updateAppointmentStatus'
    ]);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentRole']);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);

    authServiceSpy.getCurrentRole.and.returnValue('DOCTOR');
    i18nServiceSpy.t.and.callFake((key: string) => key);

    patientServiceSpy.getPatientById.and.returnValue(
      of({
        id: 20,
        patientNumber: 'MT-2026-000020',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@clinic.com',
        phoneNumber: '+212 600 000 000',
        dateOfBirth: '1990-01-01',
        status: 'ACTIVE',
        assignedDoctorUsername: 'doctor1',
        assignedFrontDeskUsername: 'staff1',
        registeredByUsername: 'front1',
        createdAt: '2030-01-01T08:00:00'
      })
    );

    caseServiceSpy.getCasesByPatientId.and.returnValue(
      of([
        {
          id: 100,
          title: 'Initial assessment',
          description: 'baseline',
          treatmentPlan: 'observe',
          status: 'OPEN',
          updatedAt: '2030-01-03T11:30:00'
        },
        {
          id: 101,
          title: 'Follow-up',
          description: null,
          treatmentPlan: null,
          status: 'RESOLVED',
          updatedAt: '2030-01-02T09:30:00'
        }
      ])
    );

    caseServiceSpy.createCase.and.returnValue(
      of({
        id: 120,
        title: 'New case',
        description: null,
        treatmentPlan: null,
        status: 'OPEN'
      })
    );

    caseServiceSpy.updateCase.and.returnValue(
      of({
        id: 100,
        title: 'Initial assessment updated',
        description: 'new details',
        treatmentPlan: 'updated plan',
        status: 'OPEN'
      })
    );

    caseServiceSpy.updateCaseStatus.and.returnValue(
      of({
        id: 100,
        title: 'Initial assessment updated',
        description: 'new details',
        treatmentPlan: 'updated plan',
        status: 'IN_PROGRESS'
      })
    );

    appointmentServiceSpy.getAppointmentsByPatientId.and.returnValue(
      of([
        {
          id: 50,
          scheduledAt: '2030-01-01T08:30:00',
          reason: 'Follow-up',
          notes: null,
          status: 'SCHEDULED'
        }
      ])
    );

    appointmentServiceSpy.updateAppointmentStatus.and.returnValue(
      of({
        id: 50,
        scheduledAt: '2030-01-01T08:30:00',
        reason: 'Follow-up',
        notes: null,
        status: 'CANCELLED'
      })
    );

    await TestBed.configureTestingModule({
      imports: [PatientWorkspacePageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: AppointmentService, useValue: appointmentServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads patient, cases, and appointments on init', () => {
    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(patientServiceSpy.getPatientById).toHaveBeenCalledWith(20);
    expect(caseServiceSpy.getCasesByPatientId).toHaveBeenCalledWith(20);
    expect(appointmentServiceSpy.getAppointmentsByPatientId).toHaveBeenCalledWith(20);
    expect(component.activeCasesCount).toBe(1);
    expect(component.orderedCases[0].id).toBe(100);
  });

  it('routes scheduling to the appointments page with the patient preselected', () => {
    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[href="/appointments?patientId=20"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="datetime-local"]')).toBeNull();
  });

  it('renders the patient card and prints it', () => {
    const printDocument = jasmine.createSpyObj<Document>('Document', ['open', 'write', 'close']);
    const printWindow = jasmine.createSpyObj<Window>('Window', ['focus', 'print']);
    Object.defineProperty(printWindow, 'document', { value: printDocument });
    spyOn(window, 'open').and.returnValue(printWindow);

    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const component = fixture.componentInstance;
    component.printPatientCard();

    expect(text).toContain('MT-2026-000020');
    expect(text).toContain('John Doe');
    expect(window.open).toHaveBeenCalled();
    expect(printDocument.write).toHaveBeenCalledWith(jasmine.stringContaining('MT-2026-000020'));
    expect(printDocument.write).toHaveBeenCalledWith(jasmine.stringContaining('John Doe'));
    expect(printWindow.print).toHaveBeenCalled();
  });

  it('cancels appointment and preserves it in the patient history', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.cancelAppointment(50);

    expect(appointmentServiceSpy.updateAppointmentStatus).toHaveBeenCalledWith(50, 'CANCELLED');
    expect(component.appointments.length).toBe(1);
    expect(component.appointments[0].status).toBe('CANCELLED');
    expect(component.successMessage).toBe('appointments.cancel.success');
  });

  it('keeps case details read-only and routes editing to the full case workspace', () => {
    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form[formgroup="createCaseForm"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/patients/20/cases?caseId=100"]')).not.toBeNull();
  });

  it('does not load cases when role is front desk', () => {
    authServiceSpy.getCurrentRole.and.returnValue('FRONT_DESK');

    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    expect(caseServiceSpy.getCasesByPatientId).not.toHaveBeenCalled();
  });

  it('shows backend details when patient load fails', () => {
    patientServiceSpy.getPatientById.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'Access denied' } }))
    );

    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.errorMessage).toBe('Access denied');
  });
});
