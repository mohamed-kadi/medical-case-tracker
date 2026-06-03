import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminUserResponse } from '../../core/models/admin-user.model';
import { Patient } from '../../core/models/patient.model';
import { AdminUserService } from '../../core/services/admin-user.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';

type AssignmentFilter = 'MISSING' | 'ALL' | 'COMPLETE';

interface AssignmentDraft {
  doctorUsername: string;
  frontDeskUsername: string;
}

@Component({
  selector: 'app-admin-assignments-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="assignments-shell">
      <header class="assignments-header">
        <div>
          <h1>{{ i18n.t('admin.assignments.title') }}</h1>
          <p>{{ i18n.t('admin.assignments.description') }}</p>
        </div>
        <div class="header-actions">
          <a class="secondary-action" routerLink="/admin/users">{{ i18n.t('admin.assignments.actions.team') }}</a>
          <a class="secondary-action" routerLink="/dashboard">{{ i18n.t('admin.assignments.actions.dashboard') }}</a>
        </div>
      </header>

      <section class="overview">
        <article class="overview-card">
          <span>{{ i18n.t('admin.assignments.metrics.totalPatients') }}</span>
          <strong>{{ patients.length }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('admin.assignments.metrics.missingDoctor') }}</span>
          <strong>{{ missingDoctorCount }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('admin.assignments.metrics.missingFrontDesk') }}</span>
          <strong>{{ missingFrontDeskCount }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('admin.assignments.metrics.visibleResults') }}</span>
          <strong>{{ filteredPatients.length }}</strong>
        </article>
      </section>

      <section class="panel">
        <div class="toolbar">
          <label>
            {{ i18n.t('admin.assignments.search.label') }}
            <input
              type="search"
              [value]="searchTerm"
              (input)="onSearchInput($any($event.target).value)"
              [placeholder]="i18n.t('admin.assignments.search.placeholder')"
            />
          </label>

          <label>
            {{ i18n.t('admin.assignments.filter.label') }}
            <select [value]="assignmentFilter" (change)="setAssignmentFilter($any($event.target).value)">
              <option value="MISSING">{{ i18n.t('admin.assignments.filter.missing') }}</option>
              <option value="ALL">{{ i18n.t('admin.assignments.filter.all') }}</option>
              <option value="COMPLETE">{{ i18n.t('admin.assignments.filter.complete') }}</option>
            </select>
          </label>
        </div>

        <p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
        <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>
        <p class="loading" *ngIf="isLoading">{{ i18n.t('admin.assignments.loading') }}</p>

        <div class="assignment-list" *ngIf="!isLoading && filteredPatients.length > 0">
          <article class="assignment-card" *ngFor="let patient of filteredPatients; trackBy: trackByPatientId">
            <div class="patient-block">
              <span class="status-chip" [class.complete]="isAssignmentComplete(patient)">
                {{
                  isAssignmentComplete(patient)
                    ? i18n.t('admin.assignments.status.complete')
                    : i18n.t('admin.assignments.status.missing')
                }}
              </span>
              <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
              <small>
                {{ patient.patientNumber || '-' }}
                <span aria-hidden="true"> · </span>
                {{ patient.email || '-' }}
                <span aria-hidden="true"> · </span>
                {{ i18n.t('admin.assignments.registeredBy') }}: {{ patient.registeredByUsername || '-' }}
              </small>
            </div>

            <label>
              {{ i18n.t('admin.assignments.doctor') }}
              <select
                [value]="drafts[patient.id]?.doctorUsername || ''"
                (change)="updateDraft(patient.id, 'doctorUsername', $any($event.target).value)"
              >
                <option value="">{{ i18n.t('admin.assignments.unassigned') }}</option>
                <option *ngFor="let doctor of doctors; trackBy: trackByUserId" [value]="doctor.username">
                  {{ doctor.username }}
                </option>
              </select>
            </label>

            <label>
              {{ i18n.t('admin.assignments.frontDesk') }}
              <select
                [value]="drafts[patient.id]?.frontDeskUsername || ''"
                (change)="updateDraft(patient.id, 'frontDeskUsername', $any($event.target).value)"
              >
                <option value="">{{ i18n.t('admin.assignments.unassigned') }}</option>
                <option *ngFor="let frontDeskUser of frontDeskUsers; trackBy: trackByUserId" [value]="frontDeskUser.username">
                  {{ frontDeskUser.username }}
                </option>
              </select>
            </label>

            <button type="button" (click)="saveAssignment(patient.id)" [disabled]="isSaving(patient.id)">
              {{
                isSaving(patient.id)
                  ? i18n.t('admin.assignments.save.saving')
                  : i18n.t('admin.assignments.save.action')
              }}
            </button>
          </article>
        </div>

        <p class="empty" *ngIf="!isLoading && filteredPatients.length === 0">
          {{ i18n.t('admin.assignments.empty') }}
        </p>
      </section>
    </section>
  `,
  styles: `
    .assignments-shell {
      width: min(88rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .assignments-header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
      flex-wrap: wrap;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.7rem, 2.25vw, 2.45rem);
      line-height: 1.08;
    }

    .assignments-header p,
    .empty,
    .loading {
      margin: 0.35rem 0 0;
      color: var(--muted);
      line-height: 1.42;
    }

    .header-actions {
      display: inline-flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .secondary-action {
      color: var(--ink);
      text-decoration: none;
      border: 1px solid var(--surface-strong);
      border-radius: 0.58rem;
      background: var(--surface);
      padding: 0.52rem 0.74rem;
      font-weight: 800;
      font-size: 0.84rem;
      white-space: nowrap;
    }

    .secondary-action:hover {
      border-color: color-mix(in srgb, var(--accent) 45%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 13%, var(--surface));
    }

    .overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.7rem;
    }

    .overview-card,
    .panel {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.95rem;
      box-shadow: var(--elevation-soft);
    }

    .overview-card {
      padding: 0.85rem 0.9rem;
      display: grid;
      gap: 0.18rem;
    }

    .overview-card span {
      color: var(--muted);
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 800;
    }

    .overview-card strong {
      font-size: 1.5rem;
      line-height: 1.05;
    }

    .panel {
      padding: 1rem;
      display: grid;
      gap: 0.85rem;
      min-width: 0;
    }

    .toolbar {
      display: grid;
      grid-template-columns: minmax(14rem, 1fr) minmax(12rem, 16rem);
      gap: 0.75rem;
      align-items: end;
    }

    label {
      display: grid;
      gap: 0.35rem;
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 800;
    }

    input,
    select,
    button {
      border: 1px solid var(--surface-strong);
      border-radius: 0.58rem;
      background: var(--surface);
      color: var(--ink);
      font: inherit;
      padding: 0.5rem 0.6rem;
      min-width: 0;
    }

    button {
      cursor: pointer;
      font-weight: 800;
      height: fit-content;
    }

    button:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--accent) 48%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 13%, var(--surface));
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    .assignment-list {
      display: grid;
      gap: 0.6rem;
    }

    .assignment-card {
      display: grid;
      grid-template-columns: minmax(13rem, 1.35fr) minmax(10rem, 1fr) minmax(10rem, 1fr) auto;
      gap: 0.75rem;
      align-items: end;
      border: 1px solid var(--surface-strong);
      border-radius: 0.85rem;
      background: var(--surface);
      padding: 0.75rem;
    }

    .patient-block {
      display: grid;
      gap: 0.22rem;
      align-content: start;
    }

    .patient-block strong {
      font-size: 0.98rem;
      line-height: 1.22;
    }

    .patient-block small {
      color: var(--muted);
      font-size: 0.8rem;
      line-height: 1.32;
    }

    .status-chip {
      width: fit-content;
      border: 1px solid color-mix(in srgb, #f59e0b 42%, var(--surface-strong));
      background: color-mix(in srgb, #f59e0b 12%, transparent);
      color: #c17a09;
      border-radius: 999px;
      padding: 0.15rem 0.45rem;
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .status-chip.complete {
      border-color: color-mix(in srgb, var(--success) 42%, var(--surface-strong));
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
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

    @media (max-width: 980px) {
      .toolbar,
      .assignment-card {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class AdminAssignmentsPageComponent implements OnInit {
  patients: Patient[] = [];
  internalUsers: AdminUserResponse[] = [];
  drafts: Partial<Record<number, AssignmentDraft>> = {};
  searchTerm = '';
  assignmentFilter: AssignmentFilter = 'MISSING';
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  private readonly savingPatientIds = new Set<number>();

  constructor(
    private readonly patientService: PatientService,
    private readonly adminUserService: AdminUserService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.loadWorkspace();
  }

  get doctors(): AdminUserResponse[] {
    return this.internalUsers.filter((user) => user.enabled && user.role === 'DOCTOR');
  }

  get frontDeskUsers(): AdminUserResponse[] {
    return this.internalUsers.filter((user) => user.enabled && user.role === 'FRONT_DESK');
  }

  get missingDoctorCount(): number {
    return this.patients.filter((patient) => !patient.assignedDoctorUsername).length;
  }

  get missingFrontDeskCount(): number {
    return this.patients.filter((patient) => !patient.assignedFrontDeskUsername).length;
  }

  get filteredPatients(): Patient[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.patients.filter((patient) => {
      if (this.assignmentFilter === 'MISSING' && this.isAssignmentComplete(patient)) {
        return false;
      }
      if (this.assignmentFilter === 'COMPLETE' && !this.isAssignmentComplete(patient)) {
        return false;
      }
      if (search.length === 0) {
        return true;
      }

      const patientNumber = patient.patientNumber ?? '';
      return [
        patient.firstName,
        patient.lastName,
        patient.email,
        patientNumber,
        patient.registeredByUsername ?? '',
        patient.assignedDoctorUsername ?? '',
        patient.assignedFrontDeskUsername ?? ''
      ].some((value) => value.toLowerCase().includes(search));
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
  }

  setAssignmentFilter(value: string): void {
    if (value === 'ALL' || value === 'MISSING' || value === 'COMPLETE') {
      this.assignmentFilter = value;
    }
  }

  isAssignmentComplete(patient: Patient): boolean {
    return Boolean(patient.assignedDoctorUsername && patient.assignedFrontDeskUsername);
  }

  updateDraft(patientId: number, field: keyof AssignmentDraft, value: string): void {
    const currentDraft = this.drafts[patientId] ?? { doctorUsername: '', frontDeskUsername: '' };
    this.drafts[patientId] = {
      ...currentDraft,
      [field]: value
    };
  }

  isSaving(patientId: number): boolean {
    return this.savingPatientIds.has(patientId);
  }

  saveAssignment(patientId: number): void {
    if (this.isSaving(patientId)) {
      return;
    }

    const draft = this.drafts[patientId] ?? { doctorUsername: '', frontDeskUsername: '' };
    this.savingPatientIds.add(patientId);
    this.successMessage = '';
    this.errorMessage = '';

    this.patientService
      .assignPatient(patientId, {
        doctorUsername: this.normalizeDraftValue(draft.doctorUsername),
        frontDeskUsername: this.normalizeDraftValue(draft.frontDeskUsername)
      })
      .subscribe({
        next: (updatedPatient) => {
          this.replacePatient(updatedPatient);
          this.drafts[patientId] = this.toDraft(updatedPatient);
          this.savingPatientIds.delete(patientId);
          this.successMessage = this.i18n.t('admin.assignments.save.success');
        },
        error: (error: unknown) => {
          this.savingPatientIds.delete(patientId);
          this.errorMessage = this.resolveErrorMessage(error, 'admin.assignments.save.error');
        }
      });
  }

  trackByPatientId(_index: number, patient: Patient): number {
    return patient.id;
  }

  trackByUserId(_index: number, user: AdminUserResponse): number {
    return user.id;
  }

  private loadWorkspace(): void {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    forkJoin({
      patients: this.patientService.getVisiblePatients(),
      internalUsers: this.adminUserService.getInternalUsers('ALL')
    }).subscribe({
      next: ({ patients, internalUsers }) => {
        this.patients = patients;
        this.internalUsers = internalUsers;
        this.drafts = patients.reduce(
          (drafts, patient) => {
            drafts[patient.id] = this.toDraft(patient);
            return drafts;
          },
          {} as Partial<Record<number, AssignmentDraft>>
        );
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.patients = [];
        this.internalUsers = [];
        this.drafts = {};
        this.isLoading = false;
        this.errorMessage = this.resolveErrorMessage(error, 'admin.assignments.error');
      }
    });
  }

  private replacePatient(updatedPatient: Patient): void {
    this.patients = this.patients.map((patient) =>
      patient.id === updatedPatient.id ? updatedPatient : patient
    );
  }

  private toDraft(patient: Patient): AssignmentDraft {
    return {
      doctorUsername: patient.assignedDoctorUsername ?? '',
      frontDeskUsername: patient.assignedFrontDeskUsername ?? ''
    };
  }

  private normalizeDraftValue(value: string): string | null {
    const normalized = value.trim();
    return normalized.length === 0 ? null : normalized;
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
