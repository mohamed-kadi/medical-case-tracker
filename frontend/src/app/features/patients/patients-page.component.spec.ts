import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PatientsPageComponent } from './patients-page.component';
import { PatientService } from '../../core/services/patient.service';
import { I18nService } from '../../core/services/i18n.service';

describe('PatientsPageComponent', () => {
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', ['getVisiblePatients']);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    i18nServiceSpy.t.and.callFake((key: string) => key);

    patientServiceSpy.getVisiblePatients.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PatientsPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads visible patients on init', () => {
    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
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
      ])
    );

    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(patientServiceSpy.getVisiblePatients).toHaveBeenCalled();
    expect(component.patients.length).toBe(1);
    expect(component.patients[0].id).toBe(20);
  });

  it('filters patients by search term', () => {
    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1989-05-01',
          email: 'john@clinic.com',
          status: 'ACTIVE'
        },
        {
          id: 2,
          firstName: 'Nora',
          lastName: 'Smith',
          dateOfBirth: '1991-03-12',
          email: 'nora@clinic.com',
          status: 'ACTIVE'
        }
      ])
    );

    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.searchTerm = 'nora';
    expect(component.filteredPatients.length).toBe(1);
    expect(component.filteredPatients[0].id).toBe(2);
  });

  it('filters patients by status', () => {
    patientServiceSpy.getVisiblePatients.and.returnValue(
      of([
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1989-05-01',
          email: 'john@clinic.com',
          status: 'ACTIVE'
        },
        {
          id: 2,
          firstName: 'Nora',
          lastName: 'Smith',
          dateOfBirth: '1991-03-12',
          email: 'nora@clinic.com',
          status: 'INACTIVE'
        }
      ])
    );

    const fixture = TestBed.createComponent(PatientsPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.setStatusFilter('INACTIVE');

    expect(component.filteredPatients.length).toBe(1);
    expect(component.filteredPatients[0].id).toBe(2);
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
