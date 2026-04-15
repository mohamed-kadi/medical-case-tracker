import { TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { PatientFormPageComponent } from './patient-form-page.component';
import { PatientService } from '../../core/services/patient.service';
import { I18nService } from '../../core/services/i18n.service';

describe('PatientFormPageComponent', () => {
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;
  const activatedRouteMock = {
    snapshot: {
      paramMap: convertToParamMap({})
    }
  };

  beforeEach(async () => {
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', [
      'getPatientById',
      'createPatient',
      'updatePatient'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    i18nServiceSpy.t.and.callFake((key: string) => key);

    patientServiceSpy.getPatientById.and.returnValue(
      of({
        id: 20,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1989-05-01',
        email: 'john@clinic.com',
        phoneNumber: '+212600000000',
        medicalHistory: 'history',
        status: 'ACTIVE'
      })
    );
    patientServiceSpy.createPatient.and.returnValue(
      of({
        id: 101,
        firstName: 'Nora',
        lastName: 'Smith',
        dateOfBirth: '1991-03-12',
        email: 'nora@clinic.com',
        phoneNumber: null,
        medicalHistory: null,
        status: 'ACTIVE'
      })
    );
    patientServiceSpy.updatePatient.and.returnValue(
      of({
        id: 20,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1989-05-01',
        email: 'john.updated@clinic.com',
        phoneNumber: '+212600000111',
        medicalHistory: 'updated',
        status: 'ACTIVE'
      })
    );

    await TestBed.configureTestingModule({
      imports: [PatientFormPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('submits create flow and navigates back to patients', () => {
    activatedRouteMock.snapshot.paramMap = convertToParamMap({});
    const fixture = TestBed.createComponent(PatientFormPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    component.form.patchValue({
      firstName: 'Nora',
      lastName: 'Smith',
      dateOfBirth: '1991-03-12',
      email: 'nora@clinic.com',
      phoneNumber: '',
      medicalHistory: '',
      status: 'ACTIVE'
    });
    component.submit();

    expect(patientServiceSpy.createPatient).toHaveBeenCalledWith({
      firstName: 'Nora',
      lastName: 'Smith',
      dateOfBirth: '1991-03-12',
      email: 'nora@clinic.com',
      phoneNumber: null,
      medicalHistory: null,
      status: 'ACTIVE'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/patients');
  });

  it('loads patient in edit mode and submits update', () => {
    activatedRouteMock.snapshot.paramMap = convertToParamMap({ id: '20' });
    const fixture = TestBed.createComponent(PatientFormPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    expect(component.mode).toBe('edit');
    expect(patientServiceSpy.getPatientById).toHaveBeenCalledWith(20);
    expect(component.form.controls.firstName.value).toBe('John');

    component.form.patchValue({
      email: 'john.updated@clinic.com',
      phoneNumber: '+212600000111',
      medicalHistory: 'updated'
    });
    component.submit();

    expect(patientServiceSpy.updatePatient).toHaveBeenCalledWith(20, {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1989-05-01',
      email: 'john.updated@clinic.com',
      phoneNumber: '+212600000111',
      medicalHistory: 'updated',
      status: 'ACTIVE'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/patients');
  });
});
