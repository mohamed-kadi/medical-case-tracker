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
      'createAppointment',
      'deleteAppointment'
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

    appointmentServiceSpy.createAppointment.and.returnValue(
      of({
        id: 51,
        scheduledAt: '2030-01-02T10:00:00',
        reason: 'New visit',
        notes: null,
        status: 'SCHEDULED'
      })
    );
    appointmentServiceSpy.deleteAppointment.and.returnValue(of(void 0));

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
    expect(component.selectedCaseId).toBe(100);
  });

  it('creates appointment for current patient', () => {
    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.appointmentForm.patchValue({
      scheduledAt: '2030-01-02T10:00',
      reason: 'New visit',
      notes: ''
    });

    component.createAppointment();

    expect(appointmentServiceSpy.createAppointment).toHaveBeenCalledWith(20, {
      scheduledAt: '2030-01-02T10:00:00',
      reason: 'New visit',
      notes: null
    });
    expect(component.appointments.length).toBe(2);
    expect(component.successMessage).toBe('appointments.create.success');
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

  it('deletes appointment and updates list', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.deleteAppointment(50);

    expect(appointmentServiceSpy.deleteAppointment).toHaveBeenCalledWith(50);
    expect(component.appointments.length).toBe(0);
    expect(component.successMessage).toBe('appointments.delete.success');
  });

  it('creates case when role is doctor', () => {
    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.createCaseForm.patchValue({
      title: 'New case',
      description: '',
      treatmentPlan: ''
    });

    component.createCase();

    expect(caseServiceSpy.createCase).toHaveBeenCalledWith(20, {
      title: 'New case',
      description: null,
      treatmentPlan: null
    });
    expect(component.successMessage).toBe('patientWorkspace.cases.createSuccess');
  });

  it('updates selected case and status when role is doctor', () => {
    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.caseEditorForm.patchValue({
      title: 'Initial assessment updated',
      description: 'new details',
      treatmentPlan: 'updated plan',
      status: 'IN_PROGRESS'
    });

    component.saveSelectedCase();

    expect(caseServiceSpy.updateCase).toHaveBeenCalledWith(100, {
      title: 'Initial assessment updated',
      description: 'new details',
      treatmentPlan: 'updated plan',
      status: 'IN_PROGRESS'
    });
    expect(caseServiceSpy.updateCaseStatus).toHaveBeenCalledWith(100, 'IN_PROGRESS');
    expect(component.successMessage).toBe('patientWorkspace.cases.updateSuccess');
  });

  it('does not load or create cases when role is front desk', () => {
    authServiceSpy.getCurrentRole.and.returnValue('FRONT_DESK');

    const fixture = TestBed.createComponent(PatientWorkspacePageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.createCaseForm.patchValue({
      title: 'Staff case',
      description: '',
      treatmentPlan: ''
    });

    component.createCase();

    expect(caseServiceSpy.getCasesByPatientId).not.toHaveBeenCalled();
    expect(caseServiceSpy.createCase).not.toHaveBeenCalled();
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
