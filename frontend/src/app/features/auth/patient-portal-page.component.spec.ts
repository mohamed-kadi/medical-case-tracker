import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PatientPortalPageComponent } from './patient-portal-page.component';
import { PatientPortalService } from '../../core/services/patient-portal.service';
import { I18nService } from '../../core/services/i18n.service';

describe('PatientPortalPageComponent', () => {
  let patientPortalServiceSpy: jasmine.SpyObj<PatientPortalService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    patientPortalServiceSpy = jasmine.createSpyObj<PatientPortalService>('PatientPortalService', ['getDashboard']);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    i18nServiceSpy.t.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [PatientPortalPageComponent],
      providers: [
        { provide: PatientPortalService, useValue: patientPortalServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('renders linked patient dashboard details', () => {
    patientPortalServiceSpy.getDashboard.and.returnValue(
      of({
        username: 'patient1',
        email: 'patient@clinic.com',
        patient: {
          id: 7,
          patientNumber: 'MT-2026-0007',
          firstName: 'Nora',
          lastName: 'Rami',
          dateOfBirth: '1992-01-10',
          email: 'patient@clinic.com',
          phoneNumber: '+212600000000',
          status: 'ACTIVE',
          assignedDoctorUsername: 'doctorOne',
          assignedFrontDeskUsername: 'receptionOne'
        },
        upcomingAppointments: [
          {
            id: 20,
            scheduledAt: '2030-07-05T10:30:00',
            reason: 'Consultation',
            status: 'SCHEDULED'
          }
        ]
      })
    );

    const fixture = TestBed.createComponent(PatientPortalPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('MT-2026-0007');
    expect(text).toContain('Nora Rami');
    expect(text).toContain('doctorOne');
    expect(text).toContain('Consultation');
  });

  it('renders unlinked account state when no patient file matches the account email', () => {
    patientPortalServiceSpy.getDashboard.and.returnValue(
      of({
        username: 'patient1',
        email: 'patient@clinic.com',
        patient: null,
        upcomingAppointments: []
      })
    );

    const fixture = TestBed.createComponent(PatientPortalPageComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('patientPortal.unlinked.title');
    expect(text).toContain('patient@clinic.com');
  });

  it('renders load error when dashboard request fails', () => {
    patientPortalServiceSpy.getDashboard.and.returnValue(throwError(() => new Error('failed')));

    const fixture = TestBed.createComponent(PatientPortalPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('patientPortal.error');
  });
});
