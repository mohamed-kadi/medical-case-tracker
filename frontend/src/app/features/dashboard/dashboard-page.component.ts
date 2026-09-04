import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { Patient } from '../../core/models/patient.model';
import { PatientService } from '../../core/services/patient.service';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { AdminUserResponse } from '../../core/models/admin-user.model';
import { AdminUserService } from '../../core/services/admin-user.service';
import { AuditEvent } from '../../core/models/audit-event.model';
import { AuditService } from '../../core/services/audit.service';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { StatusLabelPipe } from '../../shared/status-label.pipe';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LocalizedDatePipe, StatusLabelPipe],
  template: `
    <section class="dashboard-shell" [ngClass]="dashboardRoleClass">
      <section class="dashboard-command" *ngIf="isClinicalUser">
        <div>
          <span class="command-eyebrow">{{ i18n.t('dashboard.next.eyebrow') }}</span>
          <strong>{{ i18n.t('dashboard.next.title') }}</strong>
          <small>{{ i18n.t('dashboard.next.description') }}</small>
        </div>
        <a class="primary-action" routerLink="/patients/new">{{ i18n.t('dashboard.quick.newPatient') }}</a>
      </section>

      <section class="metric-grid" *ngIf="!isAdmin">
        <article class="metric-card">
          <span>{{ i18n.t('dashboard.metrics.visiblePatients') }}</span>
          <strong>{{ patients.length }}</strong>
        </article>
        <article class="metric-card" *ngIf="isClinicalUser">
          <span>{{ i18n.t('dashboard.metrics.upcomingAppointments') }}</span>
          <strong>{{ appointments.length }}</strong>
        </article>
      </section>

      <section class="metric-grid admin-metrics" *ngIf="isAdmin">
        <article class="metric-card">
          <span>{{ i18n.t('dashboard.adminMetrics.totalPatients') }}</span>
          <strong>{{ patients.length }}</strong>
        </article>
        <article class="metric-card">
          <span>{{ i18n.t('dashboard.adminMetrics.enabledDoctors') }}</span>
          <strong>{{ enabledDoctorCount }}</strong>
        </article>
        <article class="metric-card">
          <span>{{ i18n.t('dashboard.adminMetrics.enabledFrontDesk') }}</span>
          <strong>{{ enabledFrontDeskCount }}</strong>
        </article>
        <article class="metric-card attention">
          <span>{{ i18n.t('dashboard.adminMetrics.assignmentGaps') }}</span>
          <strong>{{ assignmentGapCount }}</strong>
        </article>
        <article class="metric-card">
          <span>{{ i18n.t('dashboard.adminMetrics.inactiveUsers') }}</span>
          <strong>{{ inactiveInternalUserCount }}</strong>
        </article>
      </section>

      <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="feedback error" *ngIf="appointmentsError">{{ appointmentsError }}</p>
      <p class="feedback error" *ngIf="adminOverviewError">{{ adminOverviewError }}</p>
      <p class="loading" *ngIf="isLoading || isAppointmentsLoading || isAdminOverviewLoading">
        {{ i18n.t('dashboard.loading') }}
      </p>

      <section class="dashboard-grid">
        <article class="panel patients-preview-panel" *ngIf="isClinicalUser">
          <header class="panel-header">
            <div>
              <h2>{{ i18n.t('dashboard.patients.title') }}</h2>
              <p>{{ i18n.t('dashboard.patients.description') }}</p>
            </div>
            <a routerLink="/patients">{{ i18n.t('dashboard.quick.patients') }}</a>
          </header>

          <div class="compact-list" *ngIf="patientsPreview.length > 0; else noPatients">
            <a
              class="compact-item patient-preview"
              *ngFor="let patient of patientsPreview; trackBy: trackByPatientId"
              [routerLink]="['/patients', patient.id]"
            >
              <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
              <span>{{ patient.patientNumber || patient.email }}</span>
              <small>{{ patient.status | statusLabel: 'patients' }}</small>
            </a>
          </div>

          <ng-template #noPatients>
            <p class="empty">{{ i18n.t('dashboard.patients.empty') }}</p>
          </ng-template>
        </article>

        <article class="panel admin-attention-panel" *ngIf="isAdmin">
          <header class="panel-header">
            <div>
              <h2>{{ i18n.t('dashboard.adminAttention.title') }}</h2>
              <p>{{ i18n.t('dashboard.adminAttention.description') }}</p>
            </div>
            <a routerLink="/admin/assignments">{{ i18n.t('dashboard.quick.assignments') }}</a>
          </header>

          <div class="compact-list" *ngIf="assignmentQueuePreview.length > 0; else noAssignmentGaps">
            <article
              class="compact-item attention-item"
              *ngFor="let patient of assignmentQueuePreview; trackBy: trackByPatientId"
            >
              <strong>{{ patient.lastName }}, {{ patient.firstName }}</strong>
              <span>{{ patient.patientNumber || patient.email }}</span>
              <small>
                <ng-container *ngIf="!patient.assignedDoctorUsername">
                  {{ i18n.t('dashboard.adminAttention.missingDoctor') }}
                </ng-container>
                <ng-container *ngIf="!patient.assignedDoctorUsername && !patient.assignedFrontDeskUsername">
                  ·
                </ng-container>
                <ng-container *ngIf="!patient.assignedFrontDeskUsername">
                  {{ i18n.t('dashboard.adminAttention.missingFrontDesk') }}
                </ng-container>
              </small>
            </article>
          </div>

          <ng-template #noAssignmentGaps>
            <p class="empty">{{ i18n.t('dashboard.adminAttention.empty') }}</p>
          </ng-template>
        </article>

        <article class="panel admin-audit-panel" *ngIf="isAdmin">
          <header class="panel-header">
            <div>
              <h2>{{ i18n.t('dashboard.adminAudit.title') }}</h2>
              <p>{{ i18n.t('dashboard.adminAudit.description') }}</p>
            </div>
            <a routerLink="/admin/audit">{{ i18n.t('dashboard.quick.audit') }}</a>
          </header>

          <div class="compact-list" *ngIf="recentAuditEvents.length > 0; else noRecentAudit">
            <article class="compact-item" *ngFor="let event of recentAuditEvents; trackBy: trackByAuditEventId">
              <strong>{{ event.action }}</strong>
              <span>{{ event.actorUsername }} · {{ event.entityType }} #{{ event.entityId }}</span>
              <small>{{ event.createdAt | localizedDate: 'medium' }}</small>
            </article>
          </div>

          <ng-template #noRecentAudit>
            <p class="empty">{{ i18n.t('dashboard.adminAudit.empty') }}</p>
          </ng-template>
        </article>

      </section>
    </section>
  `,
  styles: `
    .dashboard-shell {
      width: min(86rem, 100%);
      display: grid;
      gap: 1rem;
      --dash-accent: var(--accent);
      --dash-accent-2: #62a8ff;
    }

    .dashboard-shell.role-admin {
      --dash-accent: #f4a340;
      --dash-accent-2: #e76f51;
    }

    .dashboard-shell.role-doctor {
      --dash-accent: #43d9c5;
      --dash-accent-2: #4aa3ff;
    }

    .dashboard-shell.role-front-desk {
      --dash-accent: #8bd46e;
      --dash-accent-2: #ff9f6e;
    }

    .dashboard-command {
      border: 1px solid var(--surface-strong);
      border-radius: 1rem;
      background:
        radial-gradient(circle at 8% 10%, color-mix(in srgb, var(--dash-accent) 22%, transparent), transparent 18rem),
        radial-gradient(circle at 96% 0%, color-mix(in srgb, var(--dash-accent-2) 18%, transparent), transparent 18rem),
        linear-gradient(135deg, color-mix(in srgb, var(--dash-accent) 12%, transparent), transparent 52%),
        var(--surface-elevated);
      box-shadow: var(--elevation-soft);
      padding: clamp(1rem, 2.2vw, 1.45rem);
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 1rem;
    }

    .dashboard-command > div {
      display: grid;
      gap: 0.15rem;
    }

    .dashboard-command strong {
      font-size: 1.05rem;
    }

    .dashboard-command small,
    .panel p, .empty, .loading {
      color: var(--muted);
      line-height: 1.42;
    }

    .panel p,
    .empty,
    .loading {
      margin: 0.35rem 0 0;
    }

    .command-eyebrow {
      color: var(--dash-accent);
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
      gap: 0.75rem;
    }

    .metric-card, .panel {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.95rem;
      box-shadow: var(--elevation-soft);
    }

    .metric-card {
      padding: 0.9rem;
      display: grid;
      gap: 0.2rem;
    }

    .metric-card.attention {
      border-color: color-mix(in srgb, var(--dash-accent-2) 54%, var(--surface-strong));
      background:
        radial-gradient(circle at 95% 0%, color-mix(in srgb, var(--dash-accent-2) 22%, transparent), transparent 9rem),
        var(--surface-elevated);
    }

    .metric-card span {
      color: var(--muted);
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 800;
    }

    .metric-card strong {
      font-size: 1.55rem;
      line-height: 1.05;
    }

    .primary-action {
      color: #071510;
      text-decoration: none;
      border: 1px solid color-mix(in srgb, var(--dash-accent) 70%, white);
      border-radius: 0.68rem;
      background: var(--dash-accent);
      padding: 0.62rem 0.85rem;
      font-weight: 900;
      white-space: nowrap;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
      gap: 1rem;
    }

    .panel {
      padding: 1rem;
      display: grid;
      gap: 0.8rem;
      min-width: 0;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 0.8rem;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .panel-header a {
      color: var(--ink);
      text-decoration: none;
      border: 1px solid var(--surface-strong);
      border-radius: 0.58rem;
      background: var(--surface);
      padding: 0.42rem 0.58rem;
      font-size: 0.8rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .compact-list {
      display: grid;
      gap: 0.55rem;
      max-height: 24rem;
      overflow: auto;
      padding-right: 0.15rem;
    }

    .compact-item {
      display: grid;
      gap: 0.16rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.78rem;
      background: var(--surface);
      padding: 0.7rem;
    }

    .patient-preview {
      color: inherit;
      text-decoration: none;
      transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
    }

    .patient-preview:hover {
      border-color: color-mix(in srgb, var(--accent) 48%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 10%, var(--surface));
      transform: translateY(-1px);
    }

    .attention-item {
      border-color: color-mix(in srgb, var(--dash-accent-2) 42%, var(--surface-strong));
    }

    .compact-item strong,
    .compact-item span {
      color: var(--ink);
      font-size: 0.88rem;
    }

    .compact-item small {
      color: var(--muted);
      font-size: 0.78rem;
    }

    .feedback {
      margin: 0;
      font-weight: 800;
    }

    .feedback.success {
      color: var(--success);
    }

    .feedback.error {
      color: var(--danger);
    }

    @media (max-width: 900px) {
      .dashboard-command,
      .panel-header {
        display: grid;
      }

    }
  `
})
export class DashboardPageComponent implements OnInit {
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  internalUsers: AdminUserResponse[] = [];
  auditEvents: AuditEvent[] = [];
  isLoading = false;
  isAppointmentsLoading = false;
  isAdminOverviewLoading = false;
  errorMessage = '';
  appointmentsError = '';
  adminOverviewError = '';

  constructor(
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
    private readonly adminUserService: AdminUserService,
    private readonly auditService: AuditService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    if (this.isClinicalUser) {
      this.loadUpcomingAppointments();
    }
    if (this.isAdmin) {
      this.loadAdminOverview();
    }
  }

  get currentRole(): string {
    return this.authService.getCurrentRole();
  }

  get isAdmin(): boolean {
    return this.currentRole === 'ADMIN';
  }

  get isDoctor(): boolean {
    return this.currentRole === 'DOCTOR';
  }

  get isFrontDesk(): boolean {
    return this.currentRole === 'FRONT_DESK';
  }

  get isClinicalUser(): boolean {
    return this.isDoctor || this.isFrontDesk;
  }

  get dashboardRoleClass(): string {
    if (this.isAdmin) {
      return 'role-admin';
    }
    if (this.currentRole === 'DOCTOR') {
      return 'role-doctor';
    }
    if (this.currentRole === 'FRONT_DESK') {
      return 'role-front-desk';
    }
    return '';
  }

  get unassignedDoctorCount(): number {
    return this.patients.filter((patient) => !patient.assignedDoctorUsername).length;
  }

  get unassignedFrontDeskCount(): number {
    return this.patients.filter((patient) => !patient.assignedFrontDeskUsername).length;
  }

  get enabledDoctorCount(): number {
    return this.internalUsers.filter((user) => user.role === 'DOCTOR' && user.enabled).length;
  }

  get enabledFrontDeskCount(): number {
    return this.internalUsers.filter((user) => user.role === 'FRONT_DESK' && user.enabled).length;
  }

  get inactiveInternalUserCount(): number {
    return this.internalUsers.filter((user) => !user.enabled).length;
  }

  get assignmentGapCount(): number {
    return this.patients.filter((patient) => !patient.assignedDoctorUsername || !patient.assignedFrontDeskUsername).length;
  }

  get assignmentQueuePreview(): Patient[] {
    return this.patients
      .filter((patient) => !patient.assignedDoctorUsername || !patient.assignedFrontDeskUsername)
      .slice(0, 6);
  }

  get recentAuditEvents(): AuditEvent[] {
    return this.auditEvents.slice(0, 5);
  }

  get patientsPreview(): Patient[] {
    return this.patients.slice(0, 6);
  }

  trackByPatientId(_index: number, patient: Patient): number {
    return patient.id;
  }

  trackByAuditEventId(_index: number, event: AuditEvent): number {
    return event.id;
  }

  private loadPatients(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.patientService.getVisiblePatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error, 'dashboard.patients.error');
        this.isLoading = false;
      }
    });
  }

  private loadUpcomingAppointments(): void {
    this.isAppointmentsLoading = true;
    this.appointmentsError = '';

    this.appointmentService.getUpcomingAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.isAppointmentsLoading = false;
      },
      error: (error: unknown) => {
        this.appointmentsError = this.resolveErrorMessage(error, 'dashboard.appointments.error');
        this.isAppointmentsLoading = false;
      }
    });
  }

  private loadAdminOverview(): void {
    this.isAdminOverviewLoading = true;
    this.adminOverviewError = '';

    forkJoin({
      internalUsers: this.adminUserService.getInternalUsers('ALL'),
      auditEvents: this.auditService.getEvents({ limit: 5 })
    }).subscribe({
      next: ({ internalUsers, auditEvents }) => {
        this.internalUsers = internalUsers;
        this.auditEvents = auditEvents;
        this.isAdminOverviewLoading = false;
      },
      error: (error: unknown) => {
        this.adminOverviewError = this.resolveErrorMessage(error, 'dashboard.adminOverview.error');
        this.internalUsers = [];
        this.auditEvents = [];
        this.isAdminOverviewLoading = false;
      }
    });
  }

  private resolveErrorMessage(error: unknown, fallbackKey: string): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;
      if (payload && typeof payload === 'object') {
        const objectPayload = payload as Record<string, unknown>;
        if (typeof objectPayload['error'] === 'string' && objectPayload['error'].trim().length > 0) {
          return objectPayload['error'];
        }
        if (typeof objectPayload['message'] === 'string' && objectPayload['message'].trim().length > 0) {
          return objectPayload['message'];
        }
      }
      if (typeof payload === 'string' && payload.trim().length > 0) {
        return payload;
      }
    }
    return this.i18n.t(fallbackKey);
  }
}
