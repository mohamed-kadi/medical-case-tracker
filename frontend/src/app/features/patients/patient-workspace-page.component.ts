import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';

import { Appointment } from '../../core/models/appointment.model';
import { CASE_STATUSES, CaseStatus, MedicalCase } from '../../core/models/case.model';
import { Patient } from '../../core/models/patient.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { CaseService } from '../../core/services/case.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';

@Component({
  selector: 'app-patient-workspace-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="workspace-shell">
      <header class="workspace-header">
        <div>
          <h1>{{ i18n.t('patientWorkspace.title') }}</h1>
          <p>
            {{
              patient
                ? (patient.firstName + ' ' + patient.lastName + ' · ' + patient.email)
                : i18n.t('patientWorkspace.description')
            }}
          </p>
        </div>
        <div class="header-actions">
          <a class="secondary-action" routerLink="/patients">{{ i18n.t('patientWorkspace.actions.back') }}</a>
          <a class="secondary-action" *ngIf="patientId != null" [routerLink]="['/patients', patientId, 'edit']">
            {{ i18n.t('patientWorkspace.actions.edit') }}
          </a>
          <a
            class="primary-action"
            *ngIf="patientId != null && isDoctorRole"
            [routerLink]="['/patients', patientId, 'cases']"
          >
            {{ i18n.t('patientWorkspace.actions.cases') }}
          </a>
        </div>
      </header>

      <section class="overview">
        <article class="overview-card" *ngIf="isDoctorRole">
          <span>{{ i18n.t('patientWorkspace.overview.totalCases') }}</span>
          <strong>{{ cases.length }}</strong>
        </article>
        <article class="overview-card" *ngIf="isDoctorRole">
          <span>{{ i18n.t('patientWorkspace.overview.activeCases') }}</span>
          <strong>{{ activeCasesCount }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('patientWorkspace.overview.upcomingAppointments') }}</span>
          <strong>{{ appointments.length }}</strong>
        </article>
      </section>

      <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="loading" *ngIf="isLoadingPatient || isLoadingCases || isLoadingAppointments">
        {{ i18n.t('patientWorkspace.loading') }}
      </p>

      <section class="panel-grid">
        <article class="panel summary-panel">
          <h2>{{ i18n.t('patientWorkspace.summary.title') }}</h2>
          <dl *ngIf="patient; else noPatientData">
            <div>
              <dt>{{ i18n.t('patientWorkspace.summary.patientNumber') }}</dt>
              <dd>{{ patient.patientNumber || '-' }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('patientWorkspace.summary.email') }}</dt>
              <dd>{{ patient.email }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('patientWorkspace.summary.phone') }}</dt>
              <dd>{{ patient.phoneNumber || '-' }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('patientWorkspace.summary.dob') }}</dt>
              <dd>{{ patient.dateOfBirth || '-' }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('patientWorkspace.summary.status') }}</dt>
              <dd>{{ patient.status }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('patientWorkspace.summary.doctor') }}</dt>
              <dd>{{ patient.assignedDoctorUsername || '-' }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('patientWorkspace.summary.frontDesk') }}</dt>
              <dd>{{ patient.assignedFrontDeskUsername || '-' }}</dd>
            </div>
            <div>
              <dt>{{ i18n.t('patientWorkspace.summary.registeredBy') }}</dt>
              <dd>{{ patient.registeredByUsername || '-' }}</dd>
            </div>
            <div class="full-width" *ngIf="isDoctorRole">
              <dt>{{ i18n.t('patientWorkspace.summary.history') }}</dt>
              <dd>{{ patient.medicalHistory || i18n.t('patientWorkspace.summary.historyEmpty') }}</dd>
            </div>
            <div class="full-width" *ngIf="isFrontDeskRole">
              <dt>{{ i18n.t('patientWorkspace.summary.privacy') }}</dt>
              <dd>{{ i18n.t('patientWorkspace.summary.clinicalRestricted') }}</dd>
            </div>
          </dl>
          <ng-template #noPatientData>
            <p>{{ i18n.t('patientWorkspace.summary.empty') }}</p>
          </ng-template>
        </article>

        <article class="panel patient-card-panel print-card-area" *ngIf="patient">
          <header class="card-panel-header">
            <div>
              <h2>{{ i18n.t('patientWorkspace.card.title') }}</h2>
              <p>{{ i18n.t('patientWorkspace.card.description') }}</p>
            </div>
            <button type="button" class="secondary" (click)="printPatientCard()">
              {{ i18n.t('patientWorkspace.card.print') }}
            </button>
          </header>

          <div class="clinic-card" aria-label="Patient card preview">
            <div class="card-topline">
              <span>{{ i18n.t('app.brand') }}</span>
              <b>{{ i18n.t('patientWorkspace.card.kicker') }}</b>
            </div>

            <div class="card-identity">
              <span>{{ i18n.t('patientWorkspace.card.patientNumberLabel') }}</span>
              <strong>{{ patient.patientNumber || i18n.t('patientWorkspace.card.missingNumber') }}</strong>
              <small>{{ patient.firstName }} {{ patient.lastName }}</small>
            </div>

            <div class="card-data-grid">
              <div>
                <span>{{ i18n.t('patientWorkspace.card.phone') }}</span>
                <strong>{{ patient.phoneNumber || '-' }}</strong>
              </div>
              <div>
                <span>{{ i18n.t('patientWorkspace.card.birthDate') }}</span>
                <strong>{{ patient.dateOfBirth || '-' }}</strong>
              </div>
              <div>
                <span>{{ i18n.t('patientWorkspace.card.doctor') }}</span>
                <strong>{{ patient.assignedDoctorUsername || '-' }}</strong>
              </div>
              <div>
                <span>{{ i18n.t('patientWorkspace.card.created') }}</span>
                <strong>{{ patient.createdAt ? (patient.createdAt | date: 'mediumDate') : '-' }}</strong>
              </div>
            </div>

            <div class="card-footer">
              <span>{{ i18n.t('patientWorkspace.card.frontDesk') }}: {{ patient.assignedFrontDeskUsername || '-' }}</span>
              <span>{{ i18n.t('patientWorkspace.card.registeredBy') }}: {{ patient.registeredByUsername || '-' }}</span>
            </div>
          </div>

          <p class="card-guidance">{{ i18n.t('patientWorkspace.card.helper') }}</p>
        </article>

        <article class="panel appointments-panel">
          <h2>{{ i18n.t('patientWorkspace.appointments.title') }}</h2>

          <form [formGroup]="appointmentForm" (ngSubmit)="createAppointment()" novalidate>
            <label>
              {{ i18n.t('appointments.create.when') }}
              <input type="datetime-local" formControlName="scheduledAt" />
            </label>
            <label>
              {{ i18n.t('appointments.create.reason') }}
              <input
                type="text"
                formControlName="reason"
                [placeholder]="i18n.t('appointments.create.reasonPlaceholder')"
              />
            </label>
            <label>
              {{ i18n.t('appointments.create.notes') }}
              <textarea
                rows="2"
                formControlName="notes"
                [placeholder]="i18n.t('appointments.create.notesPlaceholder')"
              ></textarea>
            </label>
            <small *ngIf="appointmentForm.invalid && appointmentForm.touched">{{ i18n.t('common.required') }}</small>
            <button type="submit" [disabled]="isCreatingAppointment">
              {{
                isCreatingAppointment
                  ? i18n.t('appointments.create.saving')
                  : i18n.t('patientWorkspace.appointments.create')
              }}
            </button>
          </form>

          <div class="appointment-list" *ngIf="appointments.length > 0; else emptyAppointments">
            <article class="appointment-item" *ngFor="let appointment of appointments; trackBy: trackByAppointmentId">
              <div>
                <strong>{{ appointment.scheduledAt | date: 'medium' }}</strong>
                <small>{{ appointment.reason }} · {{ appointment.status }}</small>
                <p>{{ appointment.notes || '-' }}</p>
              </div>
              <button
                type="button"
                class="danger"
                (click)="deleteAppointment(appointment.id)"
                [disabled]="isDeleting(appointment.id)"
              >
                {{
                  isDeleting(appointment.id)
                    ? i18n.t('appointments.delete.deleting')
                    : i18n.t('appointments.delete.action')
                }}
              </button>
            </article>
          </div>
          <ng-template #emptyAppointments>
            <p>{{ i18n.t('patientWorkspace.appointments.empty') }}</p>
          </ng-template>
        </article>
      </section>

      <section class="panel" *ngIf="isDoctorRole">
        <header class="panel-header">
          <h2>{{ i18n.t('patientWorkspace.cases.title') }}</h2>
          <a class="secondary-action" *ngIf="patientId != null" [routerLink]="['/patients', patientId, 'cases']">
            {{ i18n.t('patientWorkspace.cases.open') }}
          </a>
        </header>

        <div class="case-layout">
          <div>
            <div class="case-list" *ngIf="cases.length > 0; else emptyCases">
              <article
                class="case-item"
                *ngFor="let medicalCase of orderedCases; trackBy: trackByCaseId"
                [class.active]="selectedCaseId === medicalCase.id"
              >
                <div>
                  <strong>{{ medicalCase.title }}</strong>
                  <small>
                    {{ statusLabel(medicalCase.status) }}
                    ·
                    {{ i18n.t('patientWorkspace.cases.updatedAt') }}:
                    {{ (medicalCase.updatedAt || medicalCase.createdAt) | date: 'short' }}
                  </small>
                </div>
                <div class="case-item-actions">
                  <button
                    type="button"
                    class="secondary"
                    *ngIf="isDoctorRole"
                    (click)="selectCase(medicalCase.id)"
                  >
                    {{ i18n.t('patientWorkspace.cases.select') }}
                  </button>
                  <a
                    class="case-link"
                    *ngIf="patientId != null"
                    [routerLink]="['/patients', patientId, 'cases']"
                    [queryParams]="{ caseId: medicalCase.id }"
                  >
                    {{ i18n.t('patientWorkspace.cases.openCase') }}
                  </a>
                </div>
              </article>
            </div>
            <ng-template #emptyCases>
              <p>{{ i18n.t('patientWorkspace.cases.empty') }}</p>
            </ng-template>
          </div>

          <div class="doctor-case-actions" *ngIf="isDoctorRole">
            <h3>{{ i18n.t('patientWorkspace.cases.quickCreateTitle') }}</h3>
            <form [formGroup]="createCaseForm" (ngSubmit)="createCase()" novalidate>
              <label>
                {{ i18n.t('cases.create.titleField') }}
                <input type="text" formControlName="title" />
              </label>
              <label>
                {{ i18n.t('cases.create.descriptionField') }}
                <textarea rows="2" formControlName="description"></textarea>
              </label>
              <label>
                {{ i18n.t('cases.create.planField') }}
                <textarea rows="2" formControlName="treatmentPlan"></textarea>
              </label>
              <small *ngIf="createCaseForm.invalid && createCaseForm.touched">{{ i18n.t('common.required') }}</small>
              <button type="submit" [disabled]="isCreatingCase">
                {{
                  isCreatingCase
                    ? i18n.t('cases.create.saving')
                    : i18n.t('patientWorkspace.cases.createAction')
                }}
              </button>
            </form>

            <h3>{{ i18n.t('patientWorkspace.cases.quickEditTitle') }}</h3>
            <form *ngIf="selectedCase" [formGroup]="caseEditorForm" (ngSubmit)="saveSelectedCase()" novalidate>
              <label>
                {{ i18n.t('cases.create.titleField') }}
                <input type="text" formControlName="title" />
              </label>
              <label>
                {{ i18n.t('cases.create.descriptionField') }}
                <textarea rows="2" formControlName="description"></textarea>
              </label>
              <label>
                {{ i18n.t('cases.create.planField') }}
                <textarea rows="2" formControlName="treatmentPlan"></textarea>
              </label>
              <label>
                {{ i18n.t('cases.editor.statusLabel') }}
                <select formControlName="status">
                  <option *ngFor="let status of caseStatuses" [ngValue]="status">
                    {{ statusLabel(status) }}
                  </option>
                </select>
              </label>
              <small *ngIf="caseEditorForm.invalid && caseEditorForm.touched">{{ i18n.t('common.required') }}</small>
              <button type="submit" [disabled]="isSavingCase">
                {{
                  isSavingCase
                    ? i18n.t('cases.editor.saving')
                    : i18n.t('patientWorkspace.cases.updateAction')
                }}
              </button>
            </form>

            <p *ngIf="!selectedCase">{{ i18n.t('patientWorkspace.cases.noSelection') }}</p>
          </div>
        </div>
      </section>
    </section>
  `,
  styles: `
    .workspace-shell {
      width: min(86rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .workspace-header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
      flex-wrap: wrap;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.7rem, 2.2vw, 2.3rem);
      line-height: 1.1;
    }

    h2,
    h3 {
      margin: 0;
    }

    .workspace-header p {
      margin: 0.35rem 0 0;
      color: var(--muted);
    }

    .header-actions {
      display: inline-flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .primary-action,
    .secondary-action,
    .case-link {
      text-decoration: none;
      border-radius: 0.55rem;
      padding: 0.45rem 0.68rem;
      font-weight: 600;
      font-size: 0.82rem;
      white-space: nowrap;
      border: 1px solid var(--surface-strong);
      color: var(--ink);
      background: var(--surface);
    }

    .primary-action {
      border-color: color-mix(in srgb, var(--accent) 55%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
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
      display: grid;
      gap: 0.2rem;
    }

    .overview-card span {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .overview-card strong {
      font-size: 1.3rem;
      line-height: 1.1;
    }

    .panel-grid {
      display: grid;
      grid-template-columns: minmax(18rem, 1fr) minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
    }

    .panel {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.95rem;
      padding: 1rem;
      box-shadow: var(--elevation-soft);
      display: grid;
      gap: 0.65rem;
      min-width: 0;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: 0.6rem;
      align-items: center;
      flex-wrap: wrap;
    }

    dl {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.55rem;
    }

    dt {
      margin: 0;
      color: var(--muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    dd {
      margin: 0.1rem 0 0;
      color: var(--ink);
      font-size: 0.88rem;
      word-break: break-word;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .role-note {
      margin: 0;
      color: var(--muted);
      font-size: 0.84rem;
    }

    .patient-card-panel {
      align-content: start;
      background:
        linear-gradient(160deg, color-mix(in srgb, var(--surface-elevated) 88%, #e7d49f), var(--surface-elevated)),
        var(--surface-elevated);
    }

    .card-panel-header {
      display: flex;
      justify-content: space-between;
      gap: 0.8rem;
      align-items: start;
    }

    .card-panel-header p,
    .card-guidance {
      margin: 0.25rem 0 0;
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.5;
    }

    .clinic-card {
      width: min(100%, 23rem);
      aspect-ratio: 1.586;
      border-radius: 1.15rem;
      padding: 1rem;
      color: #17201b;
      background:
        radial-gradient(circle at 88% 15%, rgba(255, 255, 255, 0.72), transparent 18%),
        radial-gradient(circle at 0 100%, rgba(72, 111, 89, 0.26), transparent 33%),
        linear-gradient(135deg, #f5efe1 0%, #d9c99f 48%, #94b09b 100%);
      box-shadow: 0 1.4rem 2.8rem rgba(23, 32, 27, 0.18);
      border: 1px solid rgba(23, 32, 27, 0.18);
      display: grid;
      grid-template-rows: auto 1fr auto auto;
      gap: 0.7rem;
      overflow: hidden;
      position: relative;
      isolation: isolate;
    }

    .clinic-card::after {
      content: '';
      position: absolute;
      inset: auto -2.5rem -3rem auto;
      width: 9rem;
      height: 9rem;
      border-radius: 999px;
      border: 1.2rem solid rgba(255, 255, 255, 0.22);
      z-index: -1;
    }

    .card-topline,
    .card-footer {
      display: flex;
      justify-content: space-between;
      gap: 0.7rem;
      align-items: center;
    }

    .card-topline span,
    .card-topline b,
    .card-data-grid span,
    .card-footer span,
    .card-identity span {
      font-size: 0.66rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .card-topline span {
      font-weight: 800;
    }

    .card-topline b {
      font-weight: 700;
      opacity: 0.75;
    }

    .card-identity {
      display: grid;
      align-content: center;
      gap: 0.2rem;
    }

    .card-identity strong {
      font-size: clamp(1.65rem, 4vw, 2.45rem);
      line-height: 0.95;
      letter-spacing: -0.055em;
    }

    .card-identity small {
      font-size: 1rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.045em;
    }

    .card-data-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.45rem 0.7rem;
    }

    .card-data-grid div {
      display: grid;
      gap: 0.1rem;
      min-width: 0;
    }

    .card-data-grid strong {
      font-size: 0.76rem;
      line-height: 1.15;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-footer {
      border-top: 1px solid rgba(23, 32, 27, 0.2);
      padding-top: 0.45rem;
      align-items: start;
    }

    .card-footer span {
      opacity: 0.78;
      line-height: 1.25;
      text-transform: none;
      letter-spacing: 0;
    }

    .case-layout {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(0, 1fr);
    }

    .doctor-case-actions {
      border-top: 1px solid var(--surface-strong);
      padding-top: 0.8rem;
      display: grid;
      gap: 0.6rem;
    }

    form {
      display: grid;
      gap: 0.5rem;
    }

    label {
      display: grid;
      gap: 0.3rem;
      color: var(--muted);
      font-size: 0.83rem;
    }

    input,
    textarea,
    select,
    button {
      border: 1px solid var(--surface-strong);
      border-radius: 0.5rem;
      padding: 0.48rem 0.56rem;
      font-size: 0.85rem;
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
    }

    textarea {
      resize: vertical;
      min-height: 2.3rem;
    }

    button {
      width: fit-content;
      cursor: pointer;
      font-weight: 600;
    }

    button.secondary {
      background: transparent;
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    button.danger {
      border-color: color-mix(in srgb, var(--danger) 50%, var(--surface-strong));
      color: color-mix(in srgb, var(--danger) 72%, #fff);
      background: color-mix(in srgb, var(--danger) 13%, var(--surface));
    }

    .appointment-list,
    .case-list {
      display: grid;
      gap: 0.5rem;
    }

    .appointment-item,
    .case-item {
      border: 1px solid var(--surface-strong);
      border-radius: 0.65rem;
      padding: 0.55rem 0.65rem;
      background: var(--surface);
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 0.55rem;
      flex-wrap: wrap;
    }

    .case-item.active {
      border-color: color-mix(in srgb, var(--accent) 45%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 10%, var(--surface));
    }

    .case-item-actions {
      display: inline-flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .appointment-item small,
    .case-item small {
      display: block;
      color: var(--muted);
      margin-top: 0.2rem;
      font-size: 0.77rem;
    }

    .appointment-item p {
      margin: 0.2rem 0 0;
      color: var(--muted);
      font-size: 0.82rem;
    }

    .feedback {
      margin: 0;
      font-weight: 600;
    }

    .feedback.error {
      color: var(--danger);
    }

    .feedback.success {
      color: var(--success);
    }

    .loading {
      margin: 0;
      color: var(--muted);
    }

    @media (max-width: 980px) {
      .panel-grid {
        grid-template-columns: 1fr;
      }

      dl {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      @page {
        size: A4;
        margin: 12mm;
      }

      .workspace-header,
      .overview,
      .summary-panel,
      .appointments-panel,
      .workspace-shell > .panel:not(.print-card-area),
      .card-panel-header,
      .card-guidance,
      .feedback,
      .loading {
        display: none !important;
      }

      .workspace-shell,
      .panel-grid,
      .patient-card-panel {
        display: block !important;
        width: auto !important;
      }

      .patient-card-panel {
        border: 0;
        padding: 0;
        box-shadow: none;
        background: transparent;
      }

      .clinic-card {
        width: 86mm;
        height: 54mm;
        aspect-ratio: auto;
        box-shadow: none;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `
})
export class PatientWorkspacePageComponent implements OnInit {
  patient: Patient | null = null;
  cases: MedicalCase[] = [];
  appointments: Appointment[] = [];

  selectedCaseId: number | null = null;

  isLoadingPatient = false;
  isLoadingCases = false;
  isLoadingAppointments = false;

  isCreatingAppointment = false;
  isCreatingCase = false;
  isSavingCase = false;

  private readonly deletingAppointmentIds = new Set<number>();

  errorMessage = '';
  successMessage = '';

  readonly appointmentForm;
  readonly createCaseForm;
  readonly caseEditorForm;
  readonly caseStatuses = CASE_STATUSES;

  patientId: number | null = null;
  private currentRole = '';
  private preferredCaseId: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly caseService: CaseService,
    private readonly appointmentService: AppointmentService,
    public readonly i18n: I18nService
  ) {
    this.appointmentForm = this.formBuilder.nonNullable.group({
      scheduledAt: ['', Validators.required],
      reason: ['', Validators.required],
      notes: ['']
    });

    this.createCaseForm = this.formBuilder.nonNullable.group({
      title: ['', Validators.required],
      description: [''],
      treatmentPlan: ['']
    });

    this.caseEditorForm = this.formBuilder.nonNullable.group({
      title: ['', Validators.required],
      description: [''],
      treatmentPlan: [''],
      status: ['OPEN' as CaseStatus, Validators.required]
    });
  }

  ngOnInit(): void {
    this.currentRole = this.authService.getCurrentRole();

    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedPatientId = idParam == null ? Number.NaN : Number(idParam);
    if (!Number.isFinite(parsedPatientId)) {
      void this.router.navigateByUrl('/patients');
      return;
    }

    this.patientId = parsedPatientId;
    this.preferredCaseId = this.parsePreferredCaseId(this.route.snapshot.queryParamMap?.get('caseId') ?? null);
    this.loadPatient(parsedPatientId);
    if (this.isDoctorRole) {
      this.loadCases(parsedPatientId);
    }
    this.loadAppointments(parsedPatientId);
  }

  get isDoctorRole(): boolean {
    return this.currentRole === 'DOCTOR';
  }

  get isFrontDeskRole(): boolean {
    return this.currentRole === 'FRONT_DESK';
  }

  get selectedCase(): MedicalCase | null {
    if (this.selectedCaseId == null) {
      return null;
    }
    return this.cases.find((medicalCase) => medicalCase.id === this.selectedCaseId) ?? null;
  }

  get activeCasesCount(): number {
    return this.cases.filter((medicalCase) => medicalCase.status === 'OPEN' || medicalCase.status === 'IN_PROGRESS').length;
  }

  get orderedCases(): MedicalCase[] {
    return [...this.cases].sort((left, right) => this.asTimestamp(right) - this.asTimestamp(left));
  }

  trackByCaseId(_index: number, medicalCase: MedicalCase): number {
    return medicalCase.id;
  }

  trackByAppointmentId(_index: number, appointment: Appointment): number {
    return appointment.id;
  }

  selectCase(caseId: number): void {
    this.selectedCaseId = caseId;
    const medicalCase = this.selectedCase;
    if (!medicalCase) {
      return;
    }

    this.caseEditorForm.patchValue({
      title: medicalCase.title,
      description: medicalCase.description ?? '',
      treatmentPlan: medicalCase.treatmentPlan ?? '',
      status: medicalCase.status
    });
  }

  createCase(): void {
    if (!this.isDoctorRole || this.patientId == null) {
      return;
    }

    if (this.createCaseForm.invalid) {
      this.createCaseForm.markAllAsTouched();
      this.errorMessage = this.i18n.t('common.required');
      return;
    }

    const payload = this.createCaseForm.getRawValue();
    const normalizedTitle = payload.title.trim();
    if (normalizedTitle.length === 0) {
      this.errorMessage = this.i18n.t('common.required');
      return;
    }

    this.isCreatingCase = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.caseService
      .createCase(this.patientId, {
        title: normalizedTitle,
        description: this.normalizeOptionalValue(payload.description),
        treatmentPlan: this.normalizeOptionalValue(payload.treatmentPlan)
      })
      .subscribe({
        next: (createdCase) => {
          this.cases = [createdCase, ...this.cases];
          this.createCaseForm.reset({
            title: '',
            description: '',
            treatmentPlan: ''
          });
          this.selectCase(createdCase.id);
          this.isCreatingCase = false;
          this.successMessage = this.i18n.t('patientWorkspace.cases.createSuccess');
        },
        error: (error: unknown) => {
          this.isCreatingCase = false;
          this.errorMessage = this.resolveErrorMessage(error, 'patientWorkspace.cases.createError');
        }
      });
  }

  saveSelectedCase(): void {
    if (!this.isDoctorRole) {
      return;
    }
    const medicalCase = this.selectedCase;
    if (!medicalCase) {
      return;
    }

    if (this.caseEditorForm.invalid) {
      this.caseEditorForm.markAllAsTouched();
      this.errorMessage = this.i18n.t('common.required');
      return;
    }

    const payload = this.caseEditorForm.getRawValue();
    const normalizedTitle = payload.title.trim();
    if (normalizedTitle.length === 0) {
      this.errorMessage = this.i18n.t('common.required');
      return;
    }

    this.isSavingCase = true;
    this.errorMessage = '';
    this.successMessage = '';

    const shouldUpdateStatus = medicalCase.status !== payload.status;

    this.caseService
      .updateCase(medicalCase.id, {
        title: normalizedTitle,
        description: this.normalizeOptionalValue(payload.description),
        treatmentPlan: this.normalizeOptionalValue(payload.treatmentPlan),
        status: payload.status
      })
      .pipe(
        switchMap((updatedCase) => {
          if (!shouldUpdateStatus) {
            return of(updatedCase);
          }
          return this.caseService.updateCaseStatus(medicalCase.id, payload.status);
        })
      )
      .subscribe({
        next: (updatedCase) => {
          this.cases = this.cases.map((existingCase) =>
            existingCase.id === updatedCase.id ? updatedCase : existingCase
          );
          this.selectCase(updatedCase.id);
          this.isSavingCase = false;
          this.successMessage = this.i18n.t('patientWorkspace.cases.updateSuccess');
        },
        error: (error: unknown) => {
          this.isSavingCase = false;
          this.errorMessage = this.resolveErrorMessage(error, 'patientWorkspace.cases.updateError');
        }
      });
  }

  isDeleting(appointmentId: number): boolean {
    return this.deletingAppointmentIds.has(appointmentId);
  }

  createAppointment(): void {
    if (this.patientId == null) {
      return;
    }

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      this.errorMessage = this.i18n.t('common.required');
      return;
    }

    const payload = this.appointmentForm.getRawValue();
    const normalizedReason = payload.reason.trim();
    if (normalizedReason.length === 0) {
      this.errorMessage = this.i18n.t('common.required');
      return;
    }

    this.isCreatingAppointment = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentService
      .createAppointment(this.patientId, {
        scheduledAt: this.normalizeDateTime(payload.scheduledAt),
        reason: normalizedReason,
        notes: this.normalizeOptionalValue(payload.notes)
      })
      .subscribe({
        next: (appointment) => {
          this.appointments = [...this.appointments, appointment].sort(
            (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
          );
          this.appointmentForm.patchValue({
            scheduledAt: '',
            reason: '',
            notes: ''
          });
          this.isCreatingAppointment = false;
          this.successMessage = this.i18n.t('appointments.create.success');
        },
        error: (error: unknown) => {
          this.isCreatingAppointment = false;
          this.errorMessage = this.resolveErrorMessage(error, 'appointments.create.error');
        }
      });
  }

  deleteAppointment(appointmentId: number): void {
    if (this.isDeleting(appointmentId)) {
      return;
    }

    const confirmed = window.confirm(this.i18n.t('appointments.delete.confirm'));
    if (!confirmed) {
      return;
    }

    this.deletingAppointmentIds.add(appointmentId);
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentService.deleteAppointment(appointmentId).subscribe({
      next: () => {
        this.appointments = this.appointments.filter((appointment) => appointment.id !== appointmentId);
        this.deletingAppointmentIds.delete(appointmentId);
        this.successMessage = this.i18n.t('appointments.delete.success');
      },
      error: (error: unknown) => {
        this.deletingAppointmentIds.delete(appointmentId);
        this.errorMessage = this.resolveErrorMessage(error, 'appointments.delete.error');
      }
    });
  }

  statusLabel(status: CaseStatus): string {
    const key = `cases.status.${status}`;
    const translated = this.i18n.t(key);
    return translated === key ? status : translated;
  }

  printPatientCard(): void {
    if (!this.patient) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=720,height=480');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(this.buildPatientCardPrintHtml(this.patient));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private loadPatient(patientId: number): void {
    this.isLoadingPatient = true;
    this.errorMessage = '';

    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.isLoadingPatient = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error, 'patientWorkspace.errors.patient');
        this.isLoadingPatient = false;
      }
    });
  }

  private loadCases(patientId: number): void {
    if (!this.isDoctorRole) {
      this.cases = [];
      this.isLoadingCases = false;
      return;
    }

    this.isLoadingCases = true;

    this.caseService.getCasesByPatientId(patientId).subscribe({
      next: (cases) => {
        this.cases = cases;
        this.isLoadingCases = false;

        if (this.isDoctorRole) {
          const preferredCaseId =
            this.preferredCaseId != null && this.cases.some((medicalCase) => medicalCase.id === this.preferredCaseId)
              ? this.preferredCaseId
              : this.selectedCaseId ?? this.cases[0]?.id ?? null;
          this.preferredCaseId = null;
          if (preferredCaseId != null && this.cases.some((medicalCase) => medicalCase.id === preferredCaseId)) {
            this.selectCase(preferredCaseId);
          } else {
            this.selectedCaseId = null;
          }
        }
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error, 'patientWorkspace.errors.cases');
        this.isLoadingCases = false;
      }
    });
  }

  private loadAppointments(patientId: number): void {
    this.isLoadingAppointments = true;

    this.appointmentService.getAppointmentsByPatientId(patientId).subscribe({
      next: (appointments) => {
        this.appointments = [...appointments].sort(
          (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
        );
        this.isLoadingAppointments = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error, 'patientWorkspace.errors.appointments');
        this.isLoadingAppointments = false;
      }
    });
  }

  private asTimestamp(medicalCase: MedicalCase): number {
    const candidate = medicalCase.updatedAt ?? medicalCase.createdAt;
    if (!candidate) {
      return 0;
    }
    const parsed = new Date(candidate).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private normalizeOptionalValue(value: string): string | null {
    const normalized = value.trim();
    return normalized.length === 0 ? null : normalized;
  }

  private normalizeDateTime(value: string): string {
    const normalized = value.trim();
    return normalized.length === 16 ? `${normalized}:00` : normalized;
  }

  private parsePreferredCaseId(value: string | null): number | null {
    if (value == null || value.trim().length === 0) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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

  private buildPatientCardPrintHtml(patient: Patient): string {
    const patientNumber = patient.patientNumber || this.i18n.t('patientWorkspace.card.missingNumber');
    const createdAt = patient.createdAt ? this.formatCardDate(patient.createdAt) : '-';
    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${this.escapeHtml(this.i18n.t('patientWorkspace.card.title'))}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: start center;
              background: #ffffff;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              color: #17201b;
            }
            .clinic-card {
              width: 86mm;
              height: 54mm;
              border-radius: 5mm;
              padding: 5mm;
              background:
                radial-gradient(circle at 88% 15%, rgba(255, 255, 255, 0.72), transparent 18%),
                radial-gradient(circle at 0 100%, rgba(72, 111, 89, 0.26), transparent 33%),
                linear-gradient(135deg, #f5efe1 0%, #d9c99f 48%, #94b09b 100%);
              border: 0.35mm solid rgba(23, 32, 27, 0.18);
              display: grid;
              grid-template-rows: auto 1fr auto auto;
              gap: 3mm;
              overflow: hidden;
              position: relative;
              isolation: isolate;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .clinic-card::after {
              content: '';
              position: absolute;
              right: -15mm;
              bottom: -18mm;
              width: 42mm;
              height: 42mm;
              border-radius: 999px;
              border: 6mm solid rgba(255, 255, 255, 0.22);
              z-index: -1;
            }
            .topline,
            .footer {
              display: flex;
              justify-content: space-between;
              gap: 4mm;
            }
            .topline span,
            .topline b,
            .identity span,
            .data span,
            .footer span {
              font-size: 6.2pt;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            .topline span {
              font-weight: 800;
            }
            .topline b {
              opacity: 0.76;
            }
            .identity {
              display: grid;
              align-content: center;
              gap: 1mm;
            }
            .identity strong {
              font-size: 21pt;
              line-height: 0.95;
              letter-spacing: -0.055em;
            }
            .identity small {
              font-size: 9pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.045em;
            }
            .data {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 2mm 4mm;
            }
            .data div {
              display: grid;
              gap: 0.8mm;
              min-width: 0;
            }
            .data strong {
              font-size: 7.2pt;
              line-height: 1.15;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .footer {
              border-top: 0.25mm solid rgba(23, 32, 27, 0.2);
              padding-top: 2mm;
              align-items: start;
            }
            .footer span {
              opacity: 0.78;
              line-height: 1.25;
              text-transform: none;
              letter-spacing: 0;
            }
          </style>
        </head>
        <body>
          <article class="clinic-card">
            <div class="topline">
              <span>${this.escapeHtml(this.i18n.t('app.brand'))}</span>
              <b>${this.escapeHtml(this.i18n.t('patientWorkspace.card.kicker'))}</b>
            </div>
            <div class="identity">
              <span>${this.escapeHtml(this.i18n.t('patientWorkspace.card.patientNumberLabel'))}</span>
              <strong>${this.escapeHtml(patientNumber)}</strong>
              <small>${this.escapeHtml(patient.firstName)} ${this.escapeHtml(patient.lastName)}</small>
            </div>
            <div class="data">
              <div>
                <span>${this.escapeHtml(this.i18n.t('patientWorkspace.card.phone'))}</span>
                <strong>${this.escapeHtml(patient.phoneNumber || '-')}</strong>
              </div>
              <div>
                <span>${this.escapeHtml(this.i18n.t('patientWorkspace.card.birthDate'))}</span>
                <strong>${this.escapeHtml(patient.dateOfBirth || '-')}</strong>
              </div>
              <div>
                <span>${this.escapeHtml(this.i18n.t('patientWorkspace.card.doctor'))}</span>
                <strong>${this.escapeHtml(patient.assignedDoctorUsername || '-')}</strong>
              </div>
              <div>
                <span>${this.escapeHtml(this.i18n.t('patientWorkspace.card.created'))}</span>
                <strong>${this.escapeHtml(createdAt)}</strong>
              </div>
            </div>
            <div class="footer">
              <span>${this.escapeHtml(this.i18n.t('patientWorkspace.card.frontDesk'))}: ${this.escapeHtml(patient.assignedFrontDeskUsername || '-')}</span>
              <span>${this.escapeHtml(this.i18n.t('patientWorkspace.card.registeredBy'))}: ${this.escapeHtml(patient.registeredByUsername || '-')}</span>
            </div>
          </article>
        </body>
      </html>`;
  }

  private formatCardDate(value: string): string {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(parsedDate);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
