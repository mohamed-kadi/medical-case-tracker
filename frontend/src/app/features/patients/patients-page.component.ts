import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/services/i18n.service';
import { Patient } from '../../core/models/patient.model';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';

type PatientStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="patients-shell">
      <header class="patients-header">
        <div>
          <h1>{{ i18n.t('patients.title') }}</h1>
          <p>{{ i18n.t('patients.description') }}</p>
        </div>
        <a class="primary-action" routerLink="/patients/new">{{ i18n.t('patients.actions.createNew') }}</a>
      </header>

      <section class="overview">
        <article class="overview-card">
          <span>{{ i18n.t('patients.overview.total') }}</span>
          <strong>{{ patients.length }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('patients.overview.filtered') }}</span>
          <strong>{{ filteredPatients.length }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('patients.overview.mode') }}</span>
          <strong>{{ i18n.t('patients.overview.mode.directory') }}</strong>
        </article>
      </section>

      <section class="patients-panel directory-panel">
        <header class="panel-header">
          <h2>{{ i18n.t('patients.directory.title') }}</h2>
        </header>

        <div class="toolbar">
          <input
            type="search"
            [placeholder]="i18n.t('patients.search.placeholder')"
            [value]="searchTerm"
            (input)="searchTerm = $any($event.target).value"
          />
          <button type="button" class="secondary" (click)="clearFilters()">
            {{ i18n.t('patients.search.clear') }}
          </button>
        </div>

        <div class="status-filters" role="group" [attr.aria-label]="i18n.t('patients.filters.label')">
          <button
            type="button"
            [class.active]="statusFilter === 'ALL'"
            (click)="setStatusFilter('ALL')"
          >
            {{ i18n.t('patients.filters.all') }}
          </button>
          <button
            type="button"
            [class.active]="statusFilter === 'ACTIVE'"
            (click)="setStatusFilter('ACTIVE')"
          >
            {{ i18n.t('patients.filters.active') }}
          </button>
          <button
            type="button"
            [class.active]="statusFilter === 'INACTIVE'"
            (click)="setStatusFilter('INACTIVE')"
          >
            {{ i18n.t('patients.filters.inactive') }}
          </button>
          <button
            type="button"
            [class.active]="statusFilter === 'ARCHIVED'"
            (click)="setStatusFilter('ARCHIVED')"
          >
            {{ i18n.t('patients.filters.archived') }}
          </button>
        </div>

        <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>
        <p class="loading" *ngIf="isLoading">{{ i18n.t('patients.loading') }}</p>

        <div class="patients-list" *ngIf="!isLoading && filteredPatients.length > 0">
          <article class="patient-item" *ngFor="let patient of filteredPatients; trackBy: trackByPatientId">
            <div class="patient-item-header">
              <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
              <span class="status-chip" [class]="'status-chip ' + (patient.status || 'ACTIVE').toLowerCase()">
                {{ patient.status }}
              </span>
            </div>
            <p>{{ patient.email }}</p>
            <small>
              {{ i18n.t('patients.table.patientNumber') }}: {{ patient.patientNumber || '-' }}
              ·
              {{ i18n.t('patients.table.dob') }}: {{ patient.dateOfBirth || '-' }}
              · {{ i18n.t('patients.table.phone') }}: {{ patient.phoneNumber || '-' }}
              · {{ i18n.t('patients.table.registeredBy') }}: {{ patient.registeredByUsername || '-' }}
            </small>

            <div class="patient-actions">
              <a [routerLink]="['/patients', patient.id]">{{ i18n.t('patients.actions.workspace') }}</a>
              <a *ngIf="isDoctorRole" [routerLink]="['/patients', patient.id, 'cases']">
                {{ i18n.t('patients.actions.cases') }}
              </a>
              <a [routerLink]="['/patients', patient.id, 'edit']">{{ i18n.t('patients.actions.edit') }}</a>
            </div>
          </article>
        </div>

        <p *ngIf="!isLoading && filteredPatients.length === 0">{{ i18n.t('patients.empty') }}</p>
      </section>
    </section>
  `,
  styles: `
    .patients-shell {
      width: min(82rem, 100%);
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr;
      align-items: start;
    }

    .patients-header,
    .overview {
      grid-column: 1 / -1;
    }

    .patients-header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.7rem, 2.25vw, 2.4rem);
      line-height: 1.1;
    }

    .patients-header p {
      margin: 0.4rem 0 0;
      color: var(--muted);
    }

    .primary-action {
      border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 20%, var(--surface));
      color: var(--ink);
      border-radius: 0.6rem;
      text-decoration: none;
      padding: 0.55rem 0.8rem;
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.7rem;
    }

    .overview-card {
      border: 1px solid var(--surface-strong);
      background: linear-gradient(155deg, color-mix(in srgb, var(--surface-elevated) 88%, #8ab6a32a), var(--surface));
      border-radius: 0.85rem;
      padding: 0.8rem 0.9rem;
      box-shadow: var(--elevation-soft);
      display: grid;
      gap: 0.18rem;
    }

    .overview-card span {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .overview-card strong {
      font-size: 1.35rem;
      line-height: 1.1;
    }

    .patients-panel {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.95rem;
      padding: 1rem;
      box-shadow: var(--elevation-soft);
      min-width: 0;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.65rem;
    }

    h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .toolbar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.5rem;
      margin-bottom: 0.65rem;
    }

    .status-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.65rem;
    }

    .status-filters button {
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
      border-radius: 999px;
      background: transparent;
    }

    .status-filters button.active {
      background: color-mix(in srgb, var(--accent) 18%, var(--surface));
      border-color: color-mix(in srgb, var(--accent) 55%, var(--surface-strong));
      color: var(--ink);
    }

    .patients-list {
      display: grid;
      gap: 0.55rem;
      margin-top: 0.4rem;
      max-height: 44rem;
      overflow: auto;
      padding-right: 0.2rem;
    }

    .patient-item {
      padding: 0.65rem 0.7rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.7rem;
      background: var(--surface);
      color: var(--ink);
      display: grid;
      gap: 0.22rem;
    }

    .patient-item:hover {
      border-color: color-mix(in srgb, var(--accent) 45%, var(--surface-strong));
      background: color-mix(in srgb, var(--surface) 82%, #8ab6a319);
    }

    .patient-item-header {
      display: flex;
      justify-content: space-between;
      gap: 0.7rem;
      align-items: center;
    }

    .patient-item p {
      margin: 0;
      color: var(--muted);
      font-size: 0.85rem;
    }

    .patient-item small {
      color: var(--muted);
      font-size: 0.77rem;
      margin: 0;
    }

    .patient-actions {
      margin-top: 0.3rem;
      display: inline-flex;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .patient-actions a {
      color: var(--ink);
      font-weight: 600;
      font-size: 0.83rem;
      text-decoration: none;
    }

    .status-chip {
      border: 1px solid var(--surface-strong);
      border-radius: 999px;
      padding: 0.16rem 0.45rem;
      font-size: 0.72rem;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .status-chip.active {
      border-color: color-mix(in srgb, var(--success) 40%, var(--surface-strong));
      color: var(--success);
      background: color-mix(in srgb, var(--success) 12%, transparent);
    }

    .status-chip.inactive {
      border-color: color-mix(in srgb, #f59e0b 40%, var(--surface-strong));
      color: #c17a09;
      background: color-mix(in srgb, #f59e0b 12%, transparent);
    }

    .status-chip.archived {
      border-color: color-mix(in srgb, var(--muted) 45%, var(--surface-strong));
      color: var(--muted);
      background: color-mix(in srgb, var(--muted) 10%, transparent);
    }

    .feedback {
      font-weight: 600;
      margin: 0.4rem 0 0;
    }

    .feedback.error {
      color: var(--danger);
    }

    .loading {
      margin-top: 0.55rem;
      color: var(--muted);
    }

    input,
    button {
      border: 1px solid var(--surface-strong);
      border-radius: 0.5rem;
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
    }

    input {
      padding: 0.5rem 0.55rem;
      font-size: 0.88rem;
      width: 100%;
      min-width: 0;
    }

    button {
      padding: 0.44rem 0.66rem;
      font-size: 0.84rem;
      cursor: pointer;
      width: fit-content;
    }

    .secondary {
      background: transparent;
    }

    @media (max-width: 1080px) {
      .patients-header {
        align-items: start;
        flex-direction: column;
      }

      .patients-list {
        max-height: 28rem;
      }
    }
  `
})
export class PatientsPageComponent implements OnInit {
  patients: Patient[] = [];
  searchTerm = '';
  statusFilter: PatientStatusFilter = 'ALL';
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  get filteredPatients(): Patient[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    return this.patients.filter((patient) => {
      const statusMatches = this.statusFilter === 'ALL' || patient.status === this.statusFilter;
      if (!statusMatches) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return `${patient.firstName} ${patient.lastName} ${patient.email}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }

  get isDoctorRole(): boolean {
    return this.authService.getCurrentRole() === 'DOCTOR';
  }

  trackByPatientId(_: number, patient: Patient): number {
    return patient.id;
  }

  setStatusFilter(filter: PatientStatusFilter): void {
    this.statusFilter = filter;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
  }

  private loadPatients(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.patientService.getVisiblePatients().subscribe({
      next: (patients) => {
        this.patients = [...patients].sort((left, right) =>
          `${left.lastName} ${left.firstName}`.localeCompare(`${right.lastName} ${right.firstName}`)
        );
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.i18n.t('patients.error');
        this.isLoading = false;
      }
    });
  }
}
