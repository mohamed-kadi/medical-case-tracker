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

        <article class="panel patient-card-panel" *ngIf="patient">
          <div class="card-shell">
            <span class="card-kicker">{{ i18n.t('patientWorkspace.card.kicker') }}</span>
            <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
            <code>{{ patient.patientNumber || '-' }}</code>
            <small>{{ i18n.t('patientWorkspace.card.helper') }}</small>
          </div>
          <button type="button" class="secondary" (click)="printPatientCard()">
            {{ i18n.t('patientWorkspace.card.print') }}
          </button>
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
    }

    .card-shell {
      border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--surface-strong));
      border-radius: 0.9rem;
      padding: 0.9rem;
      background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 28%, transparent), transparent 42%),
        linear-gradient(145deg, color-mix(in srgb, var(--surface) 86%, var(--accent)), var(--surface-elevated));
      display: grid;
      gap: 0.35rem;
    }

    .card-kicker {
      color: var(--muted);
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .card-shell strong {
      font-size: 1.05rem;
    }

    .card-shell code {
      width: fit-content;
      border-radius: 999px;
      padding: 0.25rem 0.5rem;
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
      color: var(--ink);
      font-family: inherit;
      font-weight: 700;
    }

    .card-shell small {
      color: var(--muted);
      font-size: 0.78rem;
      margin: 0;
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
    window.print();
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
}
