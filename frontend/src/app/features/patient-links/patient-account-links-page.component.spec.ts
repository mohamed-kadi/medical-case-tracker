import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PatientAccountLinksPageComponent } from './patient-account-links-page.component';
import { I18nService } from '../../core/services/i18n.service';
import { PatientAccountLinkService } from '../../core/services/patient-account-link.service';

describe('PatientAccountLinksPageComponent', () => {
  let linkServiceSpy: jasmine.SpyObj<PatientAccountLinkService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    linkServiceSpy = jasmine.createSpyObj<PatientAccountLinkService>('PatientAccountLinkService', [
      'getPatientByNumber',
      'searchPatientAccounts',
      'verifyLink'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    i18nServiceSpy.t.and.callFake((key: string) => key);

    linkServiceSpy.getPatientByNumber.and.returnValue(
      of({
        id: 7,
        patientNumber: 'MT-2026-000007',
        firstName: 'Nora',
        lastName: 'Rami',
        email: 'nora@clinic.com',
        phoneNumber: '+212600000000',
        status: 'ACTIVE'
      })
    );
    linkServiceSpy.searchPatientAccounts.and.returnValue(
      of([{ id: 4, username: 'patient1', email: 'patient@clinic.com' }])
    );
    linkServiceSpy.verifyLink.and.returnValue(
      of({
        id: 9,
        userId: 4,
        username: 'patient1',
        email: 'patient@clinic.com',
        patientId: 7,
        patientNumber: 'MT-2026-000007',
        patientName: 'Nora Rami',
        status: 'VERIFIED',
        verificationMethod: 'FRONT_DESK_CARD',
        verifiedByUsername: 'frontdesk1'
      })
    );

    await TestBed.configureTestingModule({
      imports: [PatientAccountLinksPageComponent],
      providers: [
        { provide: PatientAccountLinkService, useValue: linkServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads patient by patient number', () => {
    const fixture = TestBed.createComponent(PatientAccountLinksPageComponent);
    const component = fixture.componentInstance;

    component.patientNumber = ' MT-2026-000007 ';
    component.lookupPatient();

    expect(linkServiceSpy.getPatientByNumber).toHaveBeenCalledWith('MT-2026-000007');
    expect(component.patient?.patientNumber).toBe('MT-2026-000007');
    expect(component.patientNumber).toBe('MT-2026-000007');
  });

  it('searches and selects a patient portal account', () => {
    const fixture = TestBed.createComponent(PatientAccountLinksPageComponent);
    const component = fixture.componentInstance;

    component.accountQuery = 'patient';
    component.searchAccounts();
    component.selectAccount(component.accountResults[0]);

    expect(linkServiceSpy.searchPatientAccounts).toHaveBeenCalledWith('patient');
    expect(component.selectedUsername).toBe('patient1');
  });

  it('verifies a selected account against the loaded patient', () => {
    const fixture = TestBed.createComponent(PatientAccountLinksPageComponent);
    const component = fixture.componentInstance;

    component.patientNumber = 'MT-2026-000007';
    component.lookupPatient();
    component.selectedUsername = 'patient1';
    component.verifyLink();

    expect(linkServiceSpy.verifyLink).toHaveBeenCalledWith({
      patientNumber: 'MT-2026-000007',
      username: 'patient1',
      verificationMethod: 'FRONT_DESK_CARD'
    });
    expect(component.patient?.verifiedUsername).toBe('patient1');
    expect(component.successMessage).toBe('patientLinks.verify.success');
  });

  it('shows an error when patient lookup fails', () => {
    linkServiceSpy.getPatientByNumber.and.returnValue(throwError(() => new Error('failed')));
    const fixture = TestBed.createComponent(PatientAccountLinksPageComponent);
    const component = fixture.componentInstance;

    component.patientNumber = 'MT-2026-999999';
    component.lookupPatient();

    expect(component.patient).toBeNull();
    expect(component.errorMessage).toBe('patientLinks.errors.patientLoad');
  });
});
