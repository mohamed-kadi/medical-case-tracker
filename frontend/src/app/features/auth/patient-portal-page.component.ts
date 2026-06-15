import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientPortalDashboard } from '../../core/models/patient-portal.model';
import { PatientPortalService } from '../../core/services/patient-portal.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-patient-portal-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="patient-portal-shell">
      <header class="portal-hero">
        <div>
          <p class="kicker">{{ i18n.t('patientPortal.kicker') }}</p>
          <h1>{{ i18n.t('patientPortal.title') }}</h1>
          <p>{{ i18n.t('patientPortal.description') }}</p>
        </div>
        <span class="account-chip" *ngIf="dashboard">
          <strong>{{ dashboard.username }}</strong>
          <small>{{ dashboard.email }}</small>
        </span>
      </header>

      <p class="state" *ngIf="isLoading">{{ i18n.t('patientPortal.loading') }}</p>
      <p class="state error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <ng-container *ngIf="!isLoading && !errorMessage && dashboard as portal">
        <section class="unlinked-panel" *ngIf="!portal.patient">
          <span class="card-mark">?</span>
          <div>
            <h2>{{ i18n.t('patientPortal.unlinked.title') }}</h2>
            <p>{{ i18n.t('patientPortal.unlinked.description') }}</p>
            <small>{{ i18n.t('patientPortal.unlinked.email') }}: {{ portal.email }}</small>
          </div>
        </section>

        <section class="portal-grid" *ngIf="portal.patient as patient">
          <article class="patient-card">
            <span class="card-label">{{ i18n.t('patientPortal.card.label') }}</span>
            <strong>{{ patient.patientNumber || '-' }}</strong>
            <p>{{ patient.firstName }} {{ patient.lastName }}</p>
            <small>{{ i18n.t('patientPortal.card.helper') }}</small>
          </article>

          <article class="panel">
            <h2>{{ i18n.t('patientPortal.profile.title') }}</h2>
            <dl>
              <div>
                <dt>{{ i18n.t('patientPortal.profile.status') }}</dt>
                <dd>{{ patient.status }}</dd>
              </div>
              <div>
                <dt>{{ i18n.t('patientPortal.profile.birthDate') }}</dt>
                <dd>{{ patient.dateOfBirth || '-' }}</dd>
              </div>
              <div>
                <dt>{{ i18n.t('patientPortal.profile.phone') }}</dt>
                <dd>{{ patient.phoneNumber || '-' }}</dd>
              </div>
              <div>
                <dt>{{ i18n.t('patientPortal.profile.email') }}</dt>
                <dd>{{ patient.email }}</dd>
              </div>
            </dl>
          </article>

          <article class="panel">
            <h2>{{ i18n.t('patientPortal.team.title') }}</h2>
            <dl>
              <div>
                <dt>{{ i18n.t('patientPortal.team.doctor') }}</dt>
                <dd>{{ patient.assignedDoctorUsername || '-' }}</dd>
              </div>
              <div>
                <dt>{{ i18n.t('patientPortal.team.frontDesk') }}</dt>
                <dd>{{ patient.assignedFrontDeskUsername || '-' }}</dd>
              </div>
            </dl>
          </article>

          <article class="panel appointments-panel">
            <h2>{{ i18n.t('patientPortal.appointments.title') }}</h2>
            <p class="muted" *ngIf="portal.upcomingAppointments.length === 0">
              {{ i18n.t('patientPortal.appointments.empty') }}
            </p>
            <div class="appointment-list" *ngIf="portal.upcomingAppointments.length > 0">
              <article class="appointment-item" *ngFor="let appointment of portal.upcomingAppointments">
                <strong>{{ appointment.scheduledAt | date: 'EEE, MMM d · HH:mm' }}</strong>
                <span>{{ appointment.reason }}</span>
                <small>{{ appointment.status }}</small>
              </article>
            </div>
          </article>

          <article class="privacy-panel">
            <h2>{{ i18n.t('patientPortal.privacy.title') }}</h2>
            <p>{{ i18n.t('patientPortal.privacy.description') }}</p>
          </article>
        </section>
      </ng-container>
    </section>
  `,
  styles: `
    .patient-portal-shell {
      width: min(76rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .portal-hero,
    .panel,
    .patient-card,
    .privacy-panel,
    .unlinked-panel {
      border: 1px solid var(--surface-strong);
      border-radius: 1.1rem;
      background: var(--surface-elevated);
      box-shadow: var(--elevation-soft);
    }

    .portal-hero {
      padding: clamp(1.1rem, 2.4vw, 1.8rem);
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 1rem;
      background:
        radial-gradient(circle at 8% 0%, color-mix(in srgb, #8bd46e 18%, transparent), transparent 18rem),
        linear-gradient(135deg, color-mix(in srgb, #4aa3ff 10%, transparent), transparent 58%),
        var(--surface-elevated);
    }

    .kicker,
    .card-label {
      margin: 0 0 0.35rem;
      color: var(--accent);
      font-size: 0.74rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1,
    h2 {
      margin: 0;
      line-height: 1.1;
    }

    h1 {
      font-size: clamp(1.75rem, 3vw, 3rem);
    }

    h2 {
      font-size: 1rem;
    }

    p,
    .muted {
      color: var(--muted);
      margin: 0.45rem 0 0;
      line-height: 1.45;
    }

    .account-chip {
      display: grid;
      gap: 0.12rem;
      border: 1px solid color-mix(in srgb, var(--accent) 38%, var(--surface-strong));
      border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 12%, var(--surface));
      padding: 0.45rem 0.75rem;
      white-space: nowrap;
    }

    .account-chip strong,
    .account-chip small {
      display: block;
    }

    .account-chip small {
      color: var(--muted);
    }

    .state {
      border: 1px solid var(--surface-strong);
      border-radius: 0.85rem;
      background: var(--surface);
      padding: 0.85rem;
      margin: 0;
    }

    .state.error {
      color: var(--danger);
    }

    .portal-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 0.85rem;
    }

    .patient-card {
      grid-column: span 4;
      min-height: 14rem;
      display: grid;
      align-content: space-between;
      padding: 1rem;
      background:
        linear-gradient(145deg, color-mix(in srgb, #8bd46e 18%, var(--surface-elevated)), var(--surface));
    }

    .patient-card strong {
      font-family: 'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif;
      font-size: clamp(1.55rem, 2.4vw, 2.3rem);
      letter-spacing: -0.03em;
    }

    .patient-card p {
      color: var(--ink);
      font-size: 1.08rem;
      font-weight: 800;
    }

    .panel {
      grid-column: span 4;
      padding: 1rem;
      display: grid;
      gap: 0.8rem;
    }

    .appointments-panel,
    .privacy-panel {
      grid-column: span 6;
    }

    .privacy-panel,
    .unlinked-panel {
      padding: 1rem;
    }

    .unlinked-panel {
      display: flex;
      align-items: start;
      gap: 0.85rem;
    }

    .card-mark {
      width: 2.4rem;
      height: 2.4rem;
      flex: 0 0 auto;
      border-radius: 0.8rem;
      display: grid;
      place-items: center;
      border: 1px solid color-mix(in srgb, var(--accent) 42%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 15%, var(--surface));
      font-weight: 900;
    }

    dl {
      display: grid;
      gap: 0.55rem;
      margin: 0;
    }

    dl div {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      border-bottom: 1px solid var(--surface-strong);
      padding-bottom: 0.45rem;
    }

    dt {
      color: var(--muted);
    }

    dd {
      margin: 0;
      color: var(--ink);
      font-weight: 800;
      text-align: right;
    }

    .appointment-list {
      display: grid;
      gap: 0.55rem;
    }

    .appointment-item {
      display: grid;
      gap: 0.12rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.78rem;
      background: var(--surface);
      padding: 0.75rem;
    }

    .appointment-item span,
    .appointment-item small {
      color: var(--muted);
    }

    @media (max-width: 860px) {
      .portal-hero {
        display: grid;
      }

      .portal-grid {
        grid-template-columns: 1fr;
      }

      .patient-card,
      .panel,
      .appointments-panel,
      .privacy-panel {
        grid-column: auto;
      }
    }
  `
})
export class PatientPortalPageComponent implements OnInit {
  dashboard: PatientPortalDashboard | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly patientPortalService: PatientPortalService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.patientPortalService.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.i18n.t('patientPortal.error');
        this.isLoading = false;
      }
    });
  }
}
