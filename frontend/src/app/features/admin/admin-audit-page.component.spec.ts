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

  it('renders audit events as designed activity cards instead of a raw table', () => {
    const fixture = TestBed.createComponent(AdminAuditPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('.audit-summary')).not.toBeNull();
    expect(element.querySelector('.audit-event-card')).not.toBeNull();
    expect(element.textContent).toContain('Patient Created');
    expect(element.textContent).toContain('Patient #3');
    expect(element.textContent).toContain('Status: ACTIVE');
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
    expect(component.activeFilterSummary).toBe('PATIENT · PATIENT_CREATED · doctor');
  });

  it('humanizes audit labels and applies action tone classes', () => {
    const fixture = TestBed.createComponent(AdminAuditPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.actionLabel('PATIENT_ACCOUNT_LINK_VERIFIED')).toBe('Patient Account Link Verified');
    expect(component.entityLabel('MEDICAL_CASE')).toBe('Medical Case');
    expect(component.detailLabel('status=ACTIVE,caseId=4')).toBe('Status: ACTIVE · Case Id: 4');
    expect(component.actionToneClass('IMAGE_UPLOADED')).toBe('create');
    expect(component.actionToneClass('PATIENT_ARCHIVED')).toBe('delete');
    expect(component.actionToneClass('PATIENT_ACCOUNT_LINK_VERIFIED')).toBe('link');
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
