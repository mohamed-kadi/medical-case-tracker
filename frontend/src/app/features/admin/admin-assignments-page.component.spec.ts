import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminAssignmentsPageComponent } from './admin-assignments-page.component';
import { AdminUserService } from '../../core/services/admin-user.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';

describe('AdminAssignmentsPageComponent', () => {
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let adminUserServiceSpy: jasmine.SpyObj<AdminUserService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', [
      'getVisiblePatients',
      'assignPatient'
    ]);
    adminUserServiceSpy = jasmine.createSpyObj<AdminUserService>('AdminUserService', [
      'getInternalUsers'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);

    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
        {
          id: 10,
          patientNumber: 'MT-2026-000001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@clinic.com',
          status: 'ACTIVE',
          assignedDoctorUsername: null,
          assignedFrontDeskUsername: null
        },
        {
          id: 11,
          patientNumber: 'MT-2026-000002',
          firstName: 'Jane',
          lastName: 'Roe',
          email: 'jane@clinic.com',
          status: 'ACTIVE',
          assignedDoctorUsername: 'doctor_one',
          assignedFrontDeskUsername: 'front_one'
        }
      ])
    );
    adminUserServiceSpy.getInternalUsers.and.returnValue(
      of([
        {
          id: 20,
          username: 'doctor_one',
          email: 'doctor.one@clinic.com',
          role: 'DOCTOR',
          enabled: true
        },
        {
          id: 21,
          username: 'front_one',
          email: 'front.one@clinic.com',
          role: 'FRONT_DESK',
          enabled: true
        },
        {
          id: 22,
          username: 'disabled_doctor',
          email: 'disabled.doctor@clinic.com',
          role: 'DOCTOR',
          enabled: false
        }
      ])
    );
    i18nServiceSpy.t.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [AdminAssignmentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: AdminUserService, useValue: adminUserServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads patients and internal users on init', () => {
    const fixture = TestBed.createComponent(AdminAssignmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(patientServiceSpy.getVisiblePatients).toHaveBeenCalled();
    expect(adminUserServiceSpy.getInternalUsers).toHaveBeenCalledWith('ALL');
    expect(component.patients.length).toBe(2);
    expect(component.doctors.map((user) => user.username)).toEqual(['doctor_one']);
    expect(component.frontDeskUsers.map((user) => user.username)).toEqual(['front_one']);
  });

  it('filters to missing assignments by default', () => {
    const fixture = TestBed.createComponent(AdminAssignmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.filteredPatients.length).toBe(1);
    expect(component.filteredPatients[0].id).toBe(10);
    expect(component.missingDoctorCount).toBe(1);
    expect(component.missingFrontDeskCount).toBe(1);
  });

  it('supports search and complete assignment filter', () => {
    const fixture = TestBed.createComponent(AdminAssignmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.setAssignmentFilter('COMPLETE');
    component.onSearchInput('jane');

    expect(component.filteredPatients.length).toBe(1);
    expect(component.filteredPatients[0].id).toBe(11);
  });

  it('saves assignment updates', () => {
    patientServiceSpy.assignPatient.and.returnValue(
      of({
        id: 10,
        patientNumber: 'MT-2026-000001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@clinic.com',
        status: 'ACTIVE',
        assignedDoctorUsername: 'doctor_one',
        assignedFrontDeskUsername: 'front_one'
      })
    );

    const fixture = TestBed.createComponent(AdminAssignmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.updateDraft(10, 'doctorUsername', 'doctor_one');
    component.updateDraft(10, 'frontDeskUsername', 'front_one');
    component.saveAssignment(10);

    expect(patientServiceSpy.assignPatient).toHaveBeenCalledWith(10, {
      doctorUsername: 'doctor_one',
      frontDeskUsername: 'front_one'
    });
    expect(component.patients[0].assignedDoctorUsername).toBe('doctor_one');
    expect(component.patients[0].assignedFrontDeskUsername).toBe('front_one');
    expect(component.successMessage).toBe('admin.assignments.save.success');
  });

  it('shows load error when workspace data cannot be loaded', () => {
    patientServiceSpy.getVisiblePatients.and.returnValue(throwError(() => new Error('failed')));

    const fixture = TestBed.createComponent(AdminAssignmentsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.errorMessage).toBe('admin.assignments.error');
    expect(component.patients).toEqual([]);
    expect(component.internalUsers).toEqual([]);
  });
});
