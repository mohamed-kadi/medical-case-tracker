import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { I18nService } from '../../core/services/i18n.service';
import { Patient } from '../../core/models/patient.model';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { StatusLabelPipe } from '../../shared/status-label.pipe';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { AppointmentReasonPipe } from '../../shared/appointment-reason.pipe';

type PatientStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusLabelPipe, LocalizedDatePipe, AppointmentReasonPipe],
  template: `
    <section class="patients-shell">
      <div class="page-tools">
        <a class="primary-action" routerLink="/patients/new">{{ i18n.t('patients.actions.createNew') }}</a>
      </div>

      <section class="overview">
        <article class="overview-card waiting-metric" *ngIf="isDoctorRole">
          <span>{{ i18n.t('patients.waiting.metric') }}</span>
          <strong>{{ checkedInAppointments.length }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('patients.overview.total') }}</span>
          <strong>{{ totalPatients }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('patients.overview.filtered') }}</span>
          <strong>{{ totalMatchingPatients }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('patients.overview.mode') }}</span>
          <strong>{{ i18n.t('patients.overview.mode.directory') }}</strong>
        </article>
      </section>

      <section class="patients-panel waiting-panel" *ngIf="isDoctorRole">
        <header class="panel-header">
          <div>
            <span class="queue-kicker">{{ i18n.t('patients.waiting.kicker') }}</span>
            <h2>{{ i18n.t('patients.waiting.title') }}</h2>
            <p>{{ i18n.t('patients.waiting.description') }}</p>
          </div>
          <button type="button" class="secondary" (click)="loadWaitingQueue()" [disabled]="isLoadingWaitingQueue">
            {{ i18n.t('patients.waiting.refresh') }}
          </button>
        </header>

        <div class="waiting-list" *ngIf="checkedInAppointments.length > 0; else noWaitingPatients">
          <article
            class="waiting-item"
            *ngFor="let appointment of checkedInAppointments; trackBy: trackByAppointmentId"
          >
            <span class="waiting-pulse" aria-hidden="true"></span>
            <span>
              <a [routerLink]="appointment.patientId ? ['/patients', appointment.patientId] : ['/patients']">
                <strong>{{ appointment.patientName || i18n.t('appointments.patient.unavailable') }}</strong>
              </a>
              <small>{{ appointment.patientNumber || '-' }} · {{ appointment.reason | appointmentReason }}</small>
            </span>
            <span class="waiting-actions">
              <time>{{ appointment.scheduledAt | localizedDate: 'time' }}</time>
              <button
                type="button"
                (click)="completeAppointment(appointment.id)"
                [disabled]="isProcessingAppointment(appointment.id)"
              >
                {{ isProcessingAppointment(appointment.id) ? i18n.t('patients.waiting.completing') : i18n.t('patients.waiting.complete') }}
              </button>
            </span>
          </article>
        </div>
        <ng-template #noWaitingPatients>
          <p class="empty-state">
            {{ isLoadingWaitingQueue ? i18n.t('patients.waiting.loading') : i18n.t('patients.waiting.empty') }}
          </p>
        </ng-template>
      </section>

      <section class="patients-panel directory-panel">
        <header class="panel-header">
          <div>
            <h2>{{ i18n.t('patients.directory.title') }}</h2>
            <p *ngIf="isDoctorRole">{{ i18n.t('patients.directory.doctorHelp') }}</p>
          </div>
          <button
            *ngIf="isDoctorRole"
            type="button"
            class="directory-toggle"
            (click)="directoryExpanded = !directoryExpanded"
            [attr.aria-expanded]="directoryExpanded"
            aria-controls="patient-directory-content"
          >
            {{ directoryExpanded ? i18n.t('patients.directory.collapse') : i18n.t('patients.directory.expand') }}
          </button>
        </header>

        <div id="patient-directory-content" *ngIf="directoryExpanded">

        <div class="toolbar">
          <input
            type="search"
            [attr.aria-label]="i18n.t('patients.search.label')"
            [placeholder]="i18n.t('patients.search.placeholder')"
            [value]="searchTerm"
            (input)="updateSearchTerm($any($event.target).value)"
          />
          <button type="button" class="secondary" (click)="clearFilters()">
            {{ i18n.t('patients.search.clear') }}
          </button>
        </div>

        <div class="status-filters" role="group" [attr.aria-label]="i18n.t('patients.filters.label')">
          <button
            type="button"
            [class.active]="statusFilter === 'ALL'"
            [attr.aria-pressed]="statusFilter === 'ALL'"
            (click)="setStatusFilter('ALL')"
          >
            {{ i18n.t('patients.filters.all') }}
          </button>
          <button
            type="button"
            [class.active]="statusFilter === 'ACTIVE'"
            [attr.aria-pressed]="statusFilter === 'ACTIVE'"
            (click)="setStatusFilter('ACTIVE')"
          >
            {{ i18n.t('patients.filters.active') }}
          </button>
          <button
            type="button"
            [class.active]="statusFilter === 'INACTIVE'"
            [attr.aria-pressed]="statusFilter === 'INACTIVE'"
            (click)="setStatusFilter('INACTIVE')"
          >
            {{ i18n.t('patients.filters.inactive') }}
          </button>
          <button
            type="button"
            [class.active]="statusFilter === 'ARCHIVED'"
            [attr.aria-pressed]="statusFilter === 'ARCHIVED'"
            (click)="setStatusFilter('ARCHIVED')"
          >
            {{ i18n.t('patients.filters.archived') }}
          </button>
        </div>

        <p class="feedback error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
        <p class="loading" *ngIf="isLoading">{{ i18n.t('patients.loading') }}</p>

        <div class="patients-list" *ngIf="patients.length > 0">
          <article class="patient-item" *ngFor="let patient of visiblePatients; trackBy: trackByPatientId">
            <div class="patient-item-header">
              <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
              <span class="status-chip" [class]="'status-chip ' + (patient.status || 'ACTIVE').toLowerCase()">
                {{ patient.status | statusLabel: 'patients' }}
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

        <button
          *ngIf="!isLastPage"
          type="button"
          class="load-more"
          (click)="showMore()"
        >
          {{ i18n.t('patients.search.showMore') }}
        </button>

        <p *ngIf="!isLoading && patients.length === 0">{{ i18n.t('patients.empty') }}</p>
        </div>
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

    .page-tools,
    .overview {
      grid-column: 1 / -1;
    }

    .page-tools {
      display: flex;
      justify-content: flex-end;
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

    .waiting-metric {
      border-color: color-mix(in srgb, var(--success) 45%, var(--surface-strong));
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

    .panel-header p,
    .empty-state {
      margin: 0.25rem 0 0;
      color: var(--muted);
      font-size: 0.8rem;
    }

    .queue-kicker {
      color: var(--success);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .waiting-panel {
      border-color: color-mix(in srgb, var(--success) 40%, var(--surface-strong));
      background:
        radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--success) 12%, transparent), transparent 18rem),
        var(--surface-elevated);
    }

    .waiting-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
      gap: 0.55rem;
    }

    .waiting-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem;
      border: 1px solid color-mix(in srgb, var(--success) 35%, var(--surface-strong));
      border-radius: 0.7rem;
      background: var(--surface);
      color: var(--ink);
    }

    .waiting-item > span:nth-child(2) {
      display: grid;
      gap: 0.12rem;
    }

    .waiting-item a {
      color: var(--ink);
      text-decoration: none;
    }

    .waiting-item a:hover {
      text-decoration: underline;
    }

    .waiting-actions {
      display: grid;
      justify-items: end;
      gap: 0.35rem;
    }

    .waiting-actions button {
      border-color: color-mix(in srgb, var(--success) 45%, var(--surface-strong));
      background: color-mix(in srgb, var(--success) 14%, var(--surface));
      white-space: nowrap;
    }

    .waiting-item small,
    .waiting-item time {
      color: var(--muted);
      font-size: 0.76rem;
    }

    .waiting-pulse {
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--success) 18%, transparent);
    }

    .directory-toggle {
      background: color-mix(in srgb, var(--accent) 10%, var(--surface));
      white-space: nowrap;
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

    .load-more {
      margin: 0.8rem auto 0;
      display: block;
      background: color-mix(in srgb, var(--accent) 14%, var(--surface));
      border-color: color-mix(in srgb, var(--accent) 40%, var(--surface-strong));
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
export class PatientsPageComponent implements OnInit, OnDestroy {
  private readonly pageSize = 25;
  private searchTimer: number | null = null;
  private patientRequest: Subscription | null = null;
  private waitingQueueRequest: Subscription | null = null;
  private readonly processingAppointmentIds = new Set<number>();
  patients: Patient[] = [];
  checkedInAppointments: Appointment[] = [];
  searchTerm = '';
  statusFilter: PatientStatusFilter = 'ALL';
  isLoading = false;
  errorMessage = '';
  totalPatients = 0;
  totalMatchingPatients = 0;
  currentPage = 0;
  isLastPage = true;
  isLoadingWaitingQueue = false;
  directoryExpanded = true;

  constructor(
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.directoryExpanded = !this.isDoctorRole;
    this.loadPatients(true);
    if (this.isDoctorRole) {
      this.loadWaitingQueue();
    }
  }

  get filteredPatients(): Patient[] {
    return this.patients;
  }

  get visiblePatients(): Patient[] {
    return this.patients;
  }

  ngOnDestroy(): void {
    if (this.searchTimer != null) {
      window.clearTimeout(this.searchTimer);
    }
    this.patientRequest?.unsubscribe();
    this.waitingQueueRequest?.unsubscribe();
  }

  get isDoctorRole(): boolean {
    return this.authService.getCurrentRole() === 'DOCTOR';
  }

  trackByPatientId(_: number, patient: Patient): number {
    return patient.id;
  }

  trackByAppointmentId(_: number, appointment: Appointment): number {
    return appointment.id;
  }

  loadWaitingQueue(): void {
    if (!this.isDoctorRole || this.isLoadingWaitingQueue) {
      return;
    }
    this.isLoadingWaitingQueue = true;
    this.waitingQueueRequest?.unsubscribe();
    this.waitingQueueRequest = this.appointmentService.getCheckedInAppointments().subscribe({
      next: (appointments) => {
        this.checkedInAppointments = appointments;
        this.isLoadingWaitingQueue = false;
      },
      error: () => {
        this.isLoadingWaitingQueue = false;
      }
    });
  }

  isProcessingAppointment(appointmentId: number): boolean {
    return this.processingAppointmentIds.has(appointmentId);
  }

  completeAppointment(appointmentId: number): void {
    if (this.isProcessingAppointment(appointmentId)) {
      return;
    }
    this.processingAppointmentIds.add(appointmentId);
    this.appointmentService.updateAppointmentStatus(appointmentId, 'COMPLETED').subscribe({
      next: () => {
        this.checkedInAppointments = this.checkedInAppointments.filter(
          (appointment) => appointment.id !== appointmentId
        );
        this.processingAppointmentIds.delete(appointmentId);
      },
      error: () => {
        this.processingAppointmentIds.delete(appointmentId);
      }
    });
  }

  setStatusFilter(filter: PatientStatusFilter): void {
    this.statusFilter = filter;
    this.loadPatients(true);
  }

  updateSearchTerm(value: string): void {
    this.searchTerm = value;
    if (this.searchTimer != null) {
      window.clearTimeout(this.searchTimer);
    }
    this.searchTimer = window.setTimeout(() => this.loadPatients(true), 250);
  }

  showMore(): void {
    if (!this.isLastPage && !this.isLoading) {
      this.loadPatients(false);
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.loadPatients(true);
  }

  private loadPatients(reset: boolean): void {
    this.isLoading = true;
    this.errorMessage = '';
    const requestedPage = reset ? 0 : this.currentPage + 1;
    const status = this.statusFilter === 'ALL' ? undefined : this.statusFilter;

    this.patientRequest?.unsubscribe();
    this.patientRequest = this.patientService.getVisiblePatientPage(
      requestedPage,
      this.pageSize,
      this.searchTerm,
      status
    ).subscribe({
      next: (response) => {
        this.patients = reset ? response.content : [...this.patients, ...response.content];
        this.currentPage = response.page;
        this.isLastPage = response.last;
        this.totalMatchingPatients = response.totalElements;
        if (!this.searchTerm.trim() && this.statusFilter === 'ALL') {
          this.totalPatients = response.totalElements;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.i18n.t('patients.error');
        this.isLoading = false;
      }
    });
  }
}
