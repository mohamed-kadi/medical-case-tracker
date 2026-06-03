import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { Patient } from '../../core/models/patient.model';
import { PatientService } from '../../core/services/patient.service';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="dashboard-shell" [ngClass]="dashboardRoleClass">
      <header class="dashboard-hero">
        <div>
          <p class="welcome">{{ i18n.t('dashboard.welcome') }}, {{ username || 'User' }}</p>
          <h1>{{ i18n.t(dashboardTitleKey) }}</h1>
          <p>{{ i18n.t(dashboardDescriptionKey) }}</p>
        </div>
        <span class="role-chip">
          <span class="role-orb" aria-hidden="true">{{ roleInitial }}</span>
          {{ i18n.t(roleLabelKey) }}
        </span>
      </header>

      <section class="metric-grid">
        <article class="metric-card">
          <span>{{ i18n.t('dashboard.metrics.visiblePatients') }}</span>
          <strong>{{ patients.length }}</strong>
        </article>
        <article class="metric-card" *ngIf="isClinicalUser">
          <span>{{ i18n.t('dashboard.metrics.upcomingAppointments') }}</span>
          <strong>{{ appointments.length }}</strong>
        </article>
        <article class="metric-card" *ngIf="isAdmin">
          <span>{{ i18n.t('dashboard.metrics.unassignedDoctor') }}</span>
          <strong>{{ unassignedDoctorCount }}</strong>
        </article>
        <article class="metric-card" *ngIf="isAdmin">
          <span>{{ i18n.t('dashboard.metrics.unassignedFrontDesk') }}</span>
          <strong>{{ unassignedFrontDeskCount }}</strong>
        </article>
      </section>

      <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="feedback error" *ngIf="appointmentsError">{{ appointmentsError }}</p>
      <p class="loading" *ngIf="isLoading || isAppointmentsLoading">{{ i18n.t('dashboard.loading') }}</p>

      <section class="workflow-grid" *ngIf="isClinicalUser">
        <a class="workflow-card primary" routerLink="/patients/new">
          <span>{{ i18n.t('dashboard.path.intake.kicker') }}</span>
          <strong>{{ i18n.t('dashboard.path.intake.title') }}</strong>
          <small>{{ i18n.t('dashboard.path.intake.description') }}</small>
        </a>
        <a class="workflow-card" routerLink="/patients">
          <span>{{ i18n.t('dashboard.path.patients.kicker') }}</span>
          <strong>{{ i18n.t('dashboard.path.patients.title') }}</strong>
          <small>{{ i18n.t('dashboard.path.patients.description') }}</small>
        </a>
        <a class="workflow-card" routerLink="/appointments">
          <span>{{ i18n.t('dashboard.path.schedule.kicker') }}</span>
          <strong>{{ i18n.t('dashboard.path.schedule.title') }}</strong>
          <small>{{ i18n.t('dashboard.path.schedule.description') }}</small>
        </a>
      </section>

      <section class="workflow-grid" *ngIf="isAdmin">
        <a class="workflow-card primary" routerLink="/admin/users">
          <span>{{ i18n.t('dashboard.path.team.kicker') }}</span>
          <strong>{{ i18n.t('dashboard.path.team.title') }}</strong>
          <small>{{ i18n.t('dashboard.path.team.description') }}</small>
        </a>
        <a class="workflow-card" routerLink="/admin/assignments">
          <span>{{ i18n.t('dashboard.path.assignments.kicker') }}</span>
          <strong>{{ i18n.t('dashboard.path.assignments.title') }}</strong>
          <small>{{ i18n.t('dashboard.path.assignments.description') }}</small>
        </a>
        <a class="workflow-card" routerLink="/admin/audit">
          <span>{{ i18n.t('dashboard.path.audit.kicker') }}</span>
          <strong>{{ i18n.t('dashboard.path.audit.title') }}</strong>
          <small>{{ i18n.t('dashboard.path.audit.description') }}</small>
        </a>
      </section>

      <section class="dashboard-grid">
        <article class="panel schedule-panel" *ngIf="isClinicalUser">
          <header class="panel-header">
            <div>
              <h2>{{ i18n.t('dashboard.schedule.title') }}</h2>
              <p>{{ i18n.t('dashboard.schedule.description') }}</p>
            </div>
            <a routerLink="/appointments">{{ i18n.t('dashboard.quick.appointments') }}</a>
          </header>

          <div class="compact-list" *ngIf="appointmentsPreview.length > 0; else noAppointments">
            <article class="compact-item" *ngFor="let appointment of appointmentsPreview; trackBy: trackByAppointmentId">
              <strong>{{ appointment.scheduledAt | date: 'EEE, MMM d · HH:mm' }}</strong>
              <span>{{ appointment.reason }}</span>
              <small>{{ appointment.status }}</small>
            </article>
          </div>

          <ng-template #noAppointments>
            <p class="empty">{{ i18n.t('dashboard.appointments.empty') }}</p>
          </ng-template>
        </article>

        <article class="panel admin-focus-panel" *ngIf="isAdmin">
          <header class="panel-header">
            <div>
              <h2>{{ i18n.t('dashboard.adminFocus.title') }}</h2>
              <p>{{ i18n.t('dashboard.adminFocus.description') }}</p>
            </div>
            <a routerLink="/admin/assignments">{{ i18n.t('dashboard.quick.assignments') }}</a>
          </header>

          <div class="compact-list">
            <article class="compact-item">
              <strong>{{ i18n.t('dashboard.metrics.unassignedDoctor') }}</strong>
              <span>{{ unassignedDoctorCount }}</span>
            </article>
            <article class="compact-item">
              <strong>{{ i18n.t('dashboard.metrics.unassignedFrontDesk') }}</strong>
              <span>{{ unassignedFrontDeskCount }}</span>
            </article>
          </div>
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

    .dashboard-hero {
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

    h1 {
      margin: 0;
      font-size: clamp(1.55rem, 2.4vw, 2.55rem);
      line-height: 1.06;
      max-width: 58rem;
    }

    .dashboard-hero p,
    .panel p,
    .empty,
    .loading {
      color: var(--muted);
      margin: 0.35rem 0 0;
      line-height: 1.42;
    }

    .welcome {
      color: var(--ink);
      font-weight: 800;
      margin: 0 0 0.25rem;
    }

    .role-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.48rem;
      border: 1px solid color-mix(in srgb, var(--dash-accent) 46%, var(--surface-strong));
      background:
        linear-gradient(145deg, color-mix(in srgb, var(--dash-accent) 18%, var(--surface)), color-mix(in srgb, var(--dash-accent-2) 10%, var(--surface)));
      color: var(--ink);
      border-radius: 999px;
      padding: 0.28rem 0.7rem 0.28rem 0.32rem;
      font-size: 0.86rem;
      font-weight: 800;
      white-space: nowrap;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--dash-accent) 10%, transparent);
    }

    .role-orb {
      width: 1.85rem;
      height: 1.85rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: color-mix(in srgb, var(--dash-accent) 30%, var(--surface));
      border: 1px solid color-mix(in srgb, var(--dash-accent) 62%, var(--surface-strong));
      font-family: 'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif;
      font-size: 0.78rem;
    }

    .metric-grid,
    .workflow-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
      gap: 0.75rem;
    }

    .metric-card,
    .workflow-card,
    .panel {
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

    .metric-card span,
    .workflow-card span {
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

    .workflow-card {
      min-height: 8.5rem;
      color: var(--ink);
      text-decoration: none;
      padding: 1rem;
      display: grid;
      align-content: space-between;
      gap: 0.55rem;
      transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
    }

    .workflow-card:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--accent) 50%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 10%, var(--surface-elevated));
    }

    .workflow-card.primary {
      background:
        linear-gradient(145deg, color-mix(in srgb, var(--dash-accent) 22%, var(--surface-elevated)), color-mix(in srgb, var(--dash-accent-2) 8%, var(--surface)));
      border-color: color-mix(in srgb, var(--dash-accent) 50%, var(--surface-strong));
    }

    .workflow-card strong {
      font-size: 1.08rem;
      line-height: 1.18;
    }

    .workflow-card small {
      color: var(--muted);
      line-height: 1.35;
      font-size: 0.84rem;
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
      .dashboard-hero,
      .panel-header {
        display: grid;
      }

    }
  `
})
export class DashboardPageComponent implements OnInit {
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  isLoading = false;
  isAppointmentsLoading = false;
  errorMessage = '';
  appointmentsError = '';

  constructor(
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    if (this.isClinicalUser) {
      this.loadUpcomingAppointments();
    }
  }

  get username(): string {
    return this.authService.getCurrentUsername();
  }

  get currentRole(): string {
    return this.authService.getCurrentRole();
  }

  get isAdmin(): boolean {
    return this.currentRole === 'ADMIN';
  }

  get isClinicalUser(): boolean {
    return this.currentRole === 'DOCTOR' || this.currentRole === 'FRONT_DESK';
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

  get roleLabelKey(): string {
    if (this.isAdmin) {
      return 'roles.admin';
    }
    if (this.currentRole === 'DOCTOR') {
      return 'roles.doctor';
    }
    if (this.currentRole === 'FRONT_DESK') {
      return 'roles.frontDesk';
    }
    return 'roles.unknown';
  }

  get roleInitial(): string {
    if (this.isAdmin) {
      return 'A';
    }
    if (this.currentRole === 'DOCTOR') {
      return 'D';
    }
    if (this.currentRole === 'FRONT_DESK') {
      return 'F';
    }
    return '?';
  }

  get dashboardTitleKey(): string {
    if (this.isAdmin) {
      return 'dashboard.title.admin';
    }
    if (this.currentRole === 'DOCTOR') {
      return 'dashboard.title.doctor';
    }
    if (this.currentRole === 'FRONT_DESK') {
      return 'dashboard.title.frontDesk';
    }
    return 'dashboard.title';
  }

  get dashboardDescriptionKey(): string {
    if (this.isAdmin) {
      return 'dashboard.description.admin';
    }
    if (this.currentRole === 'DOCTOR') {
      return 'dashboard.description.doctor';
    }
    if (this.currentRole === 'FRONT_DESK') {
      return 'dashboard.description.frontDesk';
    }
    return 'dashboard.description';
  }

  get unassignedDoctorCount(): number {
    return this.patients.filter((patient) => !patient.assignedDoctorUsername).length;
  }

  get unassignedFrontDeskCount(): number {
    return this.patients.filter((patient) => !patient.assignedFrontDeskUsername).length;
  }

  get appointmentsPreview(): Appointment[] {
    return this.appointments.slice(0, 5);
  }

  trackByAppointmentId(_index: number, appointment: Appointment): number {
    return appointment.id;
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
