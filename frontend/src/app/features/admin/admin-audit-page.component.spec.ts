import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminAuditPageComponent } from './admin-audit-page.component';
import { AuditService } from '../../core/services/audit.service';
import { I18nService } from '../../core/services/i18n.service';

describe('AdminAuditPageComponent', () => {
  let auditServiceSpy: jasmine.SpyObj<AuditService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    auditServiceSpy = jasmine.createSpyObj<AuditService>('AuditService', ['getEvents']);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    i18nServiceSpy.t.and.callFake((key: string) => key);
    auditServiceSpy.getEvents.and.returnValue(
      of([
        {
          id: 10,
          entityType: 'PATIENT',
          entityId: 3,
          action: 'PATIENT_CREATED',
          actorUsername: 'doctorOne',
          details: 'status=ACTIVE',
          createdAt: '2026-04-15T09:30:00'
        }
      ])
    );

    await TestBed.configureTestingModule({
      imports: [AdminAuditPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuditService, useValue: auditServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy }
      ]
    }).compileComponents();
  });

  it('loads audit events on init', () => {
    const fixture = TestBed.createComponent(AdminAuditPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(auditServiceSpy.getEvents).toHaveBeenCalledWith({
      entityType: '',
      action: '',
      actor: '',
      limit: 50
    });
    expect(component.events.length).toBe(1);
    expect(component.events[0].action).toBe('PATIENT_CREATED');
  });

  it('applies filters from the form', () => {
    const fixture = TestBed.createComponent(AdminAuditPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.filterForm.patchValue({
      entityType: 'PATIENT',
      action: 'PATIENT_CREATED',
      actor: 'doctor',
      limit: 25
    });
    component.applyFilters();

    expect(auditServiceSpy.getEvents).toHaveBeenCalledWith({
      entityType: 'PATIENT',
      action: 'PATIENT_CREATED',
      actor: 'doctor',
      limit: 25
    });
  });

  it('shows error state when API fails', () => {
    auditServiceSpy.getEvents.and.returnValue(throwError(() => new Error('failed')));

    const fixture = TestBed.createComponent(AdminAuditPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.errorMessage).toBe('admin.audit.error');
    expect(component.events.length).toBe(0);
    expect(component.isLoading).toBeFalse();
  });
});
