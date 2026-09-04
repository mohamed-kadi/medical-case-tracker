import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  function setRouterUrl(url: string): void {
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => url
    });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('keeps Patients active while creating a patient', () => {
    setRouterUrl('/patients/new');

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.isRoutePrefix('/patients')).toBeTrue();
  });

  it('keeps Patients prefix active for patient workspace routes', () => {
    setRouterUrl('/patients/25');

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.isRoutePrefix('/patients')).toBeTrue();
  });

  it('groups appointments into selectable calendar days', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.agendaMonth = new Date(2030, 0, 1);
    app.agendaItems = [
      {
        id: 7,
        patientId: 4,
        patientName: 'Jane Doe',
        patientNumber: 'MT-2030-000004',
        scheduledAt: '2030-01-12T09:30:00',
        reason: 'Follow-up',
        notes: null,
        status: 'SCHEDULED'
      }
    ];

    const appointmentDay = app.agendaCalendarDays.find((day) => day.key === '2030-01-12');
    expect(appointmentDay?.appointmentCount).toBe(1);
    app.selectAgendaDay(appointmentDay!);
    expect(app.selectedAgendaItems[0].patientName).toBe('Jane Doe');
  });

  it('opens and closes the mobile navigation with Escape', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.toggleMobileNavigation();
    expect(app.mobileNavigationOpen).toBeTrue();

    app.handleEscapeKey();
    expect(app.mobileNavigationOpen).toBeFalse();
  });
});
