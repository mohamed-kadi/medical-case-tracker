import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Appointment } from '../../core/models/appointment.model';
import { Patient } from '../../core/models/patient.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { ConfirmationService } from '../../shared/confirmation.service';
import { StatusLabelPipe } from '../../shared/status-label.pipe';
import { PageFeedbackComponent } from '../../shared/page-feedback.component';
import { AppointmentReasonPipe } from '../../shared/appointment-reason.pipe';

interface AppointmentReasonOption {
  value: string;
  labelKey: string;
}

type IntakeControlName = 'reportsConditions' | 'reportsPastSurgery' | 'reportsAllergies' | 'reportsMedication' | 'requiresAssistance';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LocalizedDatePipe, StatusLabelPipe, PageFeedbackComponent, AppointmentReasonPipe],
  template: `
    <section class="appointments-shell">
      <div class="page-tools">
        <a class="primary-action" routerLink="/patients/new">{{ i18n.t('appointments.actions.newPatient') }}</a>
      </div>

      <section class="overview">
        <article class="overview-card">
          <span>{{ i18n.t('appointments.overview.upcoming') }}</span>
          <strong>{{ totalAppointments }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('appointments.overview.patients') }}</span>
          <strong>{{ patients.length }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('appointments.overview.mode') }}</span>
          <strong>{{ i18n.t('appointments.overview.mode.scheduling') }}</strong>
        </article>
      </section>

      <section class="panel patient-search-panel">
        <div class="section-heading">
          <div>
            <span class="step-label">{{ i18n.t('appointments.search.step') }}</span>
            <h2>{{ i18n.t('appointments.search.title') }}</h2>
            <p>{{ i18n.t('appointments.search.help') }}</p>
          </div>
        </div>

        <form class="patient-search" [formGroup]="patientSearchForm" (ngSubmit)="searchPatients()" novalidate>
          <label class="field">
            {{ i18n.t('appointments.search.label') }}
            <div class="search-control">
              <input
                type="search"
                formControlName="query"
                [placeholder]="i18n.t('appointments.search.placeholder')"
                autocomplete="off"
              />
              <button type="submit" [disabled]="isLoadingPatients">
                {{ isLoadingPatients ? i18n.t('appointments.search.searching') : i18n.t('appointments.search.action') }}
              </button>
            </div>
          </label>
        </form>

        <div class="patient-results" *ngIf="patientSearchPerformed && patients.length > 0">
          <button
            type="button"
            class="patient-result"
            *ngFor="let patient of patients; trackBy: trackByPatientId"
            [class.selected]="selectedPatient?.id === patient.id"
            (click)="selectPatient(patient)"
          >
            <span>
              <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
              <small>
                {{ patient.patientNumber || '-' }} · {{ patient.email }} ·
                {{ patient.status | statusLabel: 'patients' }}
              </small>
            </span>
            <span class="select-label">{{ i18n.t('appointments.search.select') }}</span>
          </button>
        </div>
        <p class="search-empty" *ngIf="patientSearchPerformed && !isLoadingPatients && patients.length === 0">
          {{ i18n.t('appointments.search.empty') }}
          <a routerLink="/patients/new">{{ i18n.t('appointments.actions.newPatient') }}</a>
        </p>
      </section>

      <section class="panel scheduling-panel" *ngIf="selectedPatient as patient">
        <div class="section-heading scheduling-heading">
          <div>
            <span class="step-label">{{ i18n.t('appointments.create.step') }}</span>
            <h2>{{ i18n.t('appointments.create.title') }}</h2>
          </div>
          <div class="selected-patient">
            <span>
              <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
              <small>{{ patient.patientNumber || '-' }}</small>
            </span>
            <button type="button" class="text-action" (click)="clearSelectedPatient()">
              {{ i18n.t('appointments.search.change') }}
            </button>
          </div>
        </div>

        <form class="appointment-form" [formGroup]="form" (ngSubmit)="createAppointment()" novalidate>
          <p class="inactive-warning" *ngIf="patient.status !== 'ACTIVE'" role="alert">
            {{ i18n.t('appointments.search.inactiveWarning') }}
            <a [routerLink]="['/patients', patient.id, 'edit']">{{ i18n.t('appointments.search.reviewPatient') }}</a>
          </p>
          <div class="form-grid">
            <label class="field date-field">
              {{ i18n.t('appointments.create.when') }}
              <input type="datetime-local" formControlName="scheduledAt" [min]="minimumAppointmentDateTime" />
            </label>

            <label class="field reason-field">
              {{ i18n.t('appointments.create.reason') }}
              <select formControlName="reasonChoice">
                <option value="">{{ i18n.t('appointments.create.selectReason') }}</option>
                <option *ngFor="let reason of appointmentReasons" [value]="reason.value">
                  {{ i18n.t(reason.labelKey) }}
                </option>
              </select>
            </label>

            <label class="field other-reason-field" *ngIf="form.controls.reasonChoice.value === 'OTHER'">
              {{ i18n.t('appointments.create.otherReason') }}
              <input type="text" formControlName="otherReason" [placeholder]="i18n.t('appointments.create.otherReasonPlaceholder')" />
            </label>
          </div>

          <button
            type="button"
            class="intake-toggle"
            (click)="intakeExpanded = !intakeExpanded"
            [attr.aria-expanded]="intakeExpanded"
            aria-controls="appointment-intake"
          >
            <span>
              <strong>{{ i18n.t('appointments.intake.title') }}</strong>
              <small>{{ i18n.t('appointments.intake.help') }}</small>
            </span>
            <span aria-hidden="true">{{ intakeExpanded ? '−' : '+' }}</span>
          </button>

          <fieldset id="appointment-intake" class="intake-section" *ngIf="intakeExpanded">
            <legend>{{ i18n.t('appointments.intake.patientReported') }}</legend>
            <p>{{ i18n.t('appointments.intake.privacy') }}</p>
            <div class="checklist">
              <label *ngFor="let item of intakeItems">
                <input type="checkbox" [formControlName]="item.control" />
                <span>{{ i18n.t(item.labelKey) }}</span>
              </label>
            </div>
            <label class="field notes-field">
              {{ i18n.t('appointments.create.notes') }}
              <textarea formControlName="notes" [placeholder]="i18n.t('appointments.create.notesPlaceholder')" rows="2"></textarea>
            </label>
          </fieldset>

          <div class="form-actions">
            <button type="submit" [disabled]="isCreating || patient.status !== 'ACTIVE'">
              {{ isCreating ? i18n.t('appointments.create.saving') : i18n.t('appointments.create.save') }}
            </button>
          </div>
        </form>
      </section>

      <app-page-feedback
        [success]="successMessage"
        [error]="errorMessage"
        [loading]="isLoadingPatients || isLoadingAppointments"
        [loadingText]="i18n.t('appointments.loading')"
      ></app-page-feedback>

      <section class="panel schedule-panel">
        <button
          type="button"
          class="panel-toggle"
          (click)="scheduleExpanded = !scheduleExpanded"
          [attr.aria-expanded]="scheduleExpanded"
          aria-controls="upcoming-appointments"
        >
          <span>
            <strong>{{ i18n.t('appointments.list.title') }}</strong>
            <small>{{ i18n.t('appointments.list.summary').replace('{count}', totalAppointments.toString()) }}</small>
          </span>
          <span aria-hidden="true">{{ scheduleExpanded ? '−' : '+' }}</span>
        </button>

        <div id="upcoming-appointments" class="schedule-content" *ngIf="scheduleExpanded">
        <div class="table-scroll" *ngIf="!isLoadingAppointments && appointments.length > 0">
          <table>
            <thead>
              <tr>
                <th>{{ i18n.t('appointments.headers.patient') }}</th>
                <th>{{ i18n.t('appointments.headers.when') }}</th>
                <th>{{ i18n.t('appointments.headers.reason') }}</th>
                <th>{{ i18n.t('appointments.headers.status') }}</th>
                <th>{{ i18n.t('appointments.headers.notes') }}</th>
                <th>{{ i18n.t('appointments.headers.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let appointment of appointments; trackBy: trackByAppointmentId">
                <td [attr.data-label]="i18n.t('appointments.headers.patient')">
                  <a
                    class="patient-link"
                    *ngIf="appointment.patientId; else unavailablePatient"
                    [routerLink]="['/patients', appointment.patientId]"
                  >
                    <strong>{{ appointment.patientName || i18n.t('appointments.patient.unavailable') }}</strong>
                    <small>{{ appointment.patientNumber || '-' }}</small>
                  </a>
                  <ng-template #unavailablePatient>
                    <span>{{ appointment.patientName || i18n.t('appointments.patient.unavailable') }}</span>
                  </ng-template>
                </td>
                <td [attr.data-label]="i18n.t('appointments.headers.when')">{{ appointment.scheduledAt | localizedDate: 'medium' }}</td>
                <td [attr.data-label]="i18n.t('appointments.headers.reason')">{{ appointment.reason | appointmentReason }}</td>
                <td [attr.data-label]="i18n.t('appointments.headers.status')">{{ appointment.status | statusLabel: 'appointments' }}</td>
                <td [attr.data-label]="i18n.t('appointments.headers.notes')">{{ appointment.notes || '-' }}</td>
                <td [attr.data-label]="i18n.t('appointments.headers.actions')">
                  <button
                    *ngIf="appointment.status === 'SCHEDULED'"
                    type="button"
                    class="danger"
                    (click)="cancelAppointment(appointment.id)"
                    [disabled]="isDeleting(appointment.id)"
                  >
                    {{
                      isDeleting(appointment.id)
                        ? i18n.t('appointments.cancel.cancelling')
                        : i18n.t('appointments.cancel.action')
                    }}
                  </button>
                  <span *ngIf="appointment.status !== 'SCHEDULED'" class="muted-status">
                    {{ i18n.t('appointments.status.readOnly') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          type="button"
          class="load-more"
          *ngIf="!isLastPage"
          (click)="showMoreAppointments()"
          [disabled]="isLoadingAppointments"
        >
          {{ i18n.t('appointments.list.showMore') }}
        </button>

        <p *ngIf="!isLoadingAppointments && appointments.length === 0">{{ i18n.t('appointments.empty') }}</p>
        </div>
      </section>
    </section>
  `,
  styles: `
    .appointments-shell {
      width: min(84rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .page-tools {
      display: flex;
      justify-content: flex-end;
    }

    .primary-action {
      text-decoration: none;
      border-radius: 0.58rem;
      padding: 0.52rem 0.74rem;
      font-weight: 600;
      font-size: 0.84rem;
      white-space: nowrap;
    }

    .primary-action {
      color: var(--ink);
      border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 18%, var(--surface));
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

    .panel {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.95rem;
      padding: 1rem;
      box-shadow: var(--elevation-soft);
      display: grid;
      gap: 0.75rem;
      min-width: 0;
    }

    .patient-link {
      display: grid;
      gap: 0.05rem;
      color: var(--ink);
      text-decoration: none;
      white-space: nowrap;
    }

    .patient-link:hover strong {
      text-decoration: underline;
    }

    .patient-link small {
      color: var(--muted);
      font-size: 0.75rem;
    }

    h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .section-heading,
    .scheduling-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .section-heading p {
      margin: 0.28rem 0 0;
      color: var(--muted);
      font-size: 0.84rem;
    }

    .step-label {
      display: block;
      margin-bottom: 0.22rem;
      color: var(--accent);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .patient-search {
      max-width: 50rem;
    }

    .search-control {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.5rem;
    }

    .search-control input {
      min-width: 0;
    }

    .patient-results {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      gap: 0.55rem;
    }

    .patient-result {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem;
      text-align: left;
      background: var(--surface);
    }

    .patient-result > span:first-child,
    .selected-patient > span {
      display: grid;
      gap: 0.12rem;
    }

    .patient-result small,
    .selected-patient small,
    .panel-toggle small,
    .intake-toggle small {
      color: var(--muted);
      font-size: 0.76rem;
      font-weight: 500;
    }

    .patient-result:hover,
    .patient-result.selected {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 10%, var(--surface));
    }

    .select-label,
    .text-action {
      color: var(--accent);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .search-empty {
      margin: 0;
      color: var(--muted);
    }

    .inactive-warning {
      margin: 0;
      padding: 0.65rem 0.75rem;
      border: 1px solid color-mix(in srgb, var(--danger) 40%, var(--surface-strong));
      border-radius: 0.6rem;
      background: color-mix(in srgb, var(--danger) 8%, var(--surface));
      color: var(--ink);
      font-size: 0.82rem;
    }

    .inactive-warning a {
      color: var(--accent);
      font-weight: 700;
    }

    .search-empty a {
      color: var(--accent);
      font-weight: 700;
    }

    .selected-patient {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.65rem;
      border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--surface-strong));
      border-radius: 0.65rem;
      background: color-mix(in srgb, var(--accent) 8%, var(--surface));
    }

    .text-action {
      border: 0;
      padding: 0.2rem;
      background: transparent;
    }

    .appointment-form {
      display: grid;
      gap: 0.65rem;
    }

    .form-grid {
      display: grid;
      gap: 0.65rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }

    label,
    .field {
      display: grid;
      gap: 0.35rem;
      color: var(--muted);
      font-size: 0.84rem;
    }

    .other-reason-field {
      grid-column: 1 / -1;
    }

    input,
    select,
    textarea,
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
      cursor: pointer;
      font-weight: 600;
    }

    .intake-toggle,
    .panel-toggle {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.72rem 0.8rem;
      text-align: left;
      background: color-mix(in srgb, var(--accent) 7%, var(--surface));
    }

    .intake-toggle > span:first-child,
    .panel-toggle > span:first-child {
      display: grid;
      gap: 0.12rem;
    }

    .intake-toggle > span:last-child,
    .panel-toggle > span:last-child {
      color: var(--accent);
      font-size: 1.25rem;
    }

    .intake-section {
      display: grid;
      gap: 0.7rem;
      margin: 0;
      padding: 0.85rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.7rem;
      background: var(--surface);
    }

    .intake-section legend {
      padding: 0 0.3rem;
      color: var(--ink);
      font-size: 0.86rem;
      font-weight: 700;
    }

    .intake-section > p {
      margin: 0;
      color: var(--muted);
      font-size: 0.78rem;
    }

    .checklist {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 0.5rem;
    }

    .checklist label {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.55rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.55rem;
      background: var(--surface-elevated);
      color: var(--ink);
    }

    .checklist input {
      width: 1rem;
      height: 1rem;
      margin-top: 0.08rem;
      padding: 0;
      accent-color: var(--accent);
    }

    .schedule-panel {
      padding: 0.75rem;
    }

    .schedule-content {
      display: grid;
      gap: 0.75rem;
    }

    button.danger {
      border-color: color-mix(in srgb, var(--danger) 50%, var(--surface-strong));
      color: color-mix(in srgb, var(--danger) 72%, #fff);
      background: color-mix(in srgb, var(--danger) 13%, var(--surface));
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    .form-actions {
      display: grid;
      gap: 0.28rem;
      align-content: end;
    }

    .form-actions small {
      color: var(--muted);
      font-size: 0.78rem;
    }

    .load-more {
      width: fit-content;
      margin: 0.2rem auto 0;
      background: color-mix(in srgb, var(--accent) 14%, var(--surface));
      border-color: color-mix(in srgb, var(--accent) 40%, var(--surface-strong));
    }

    .feedback {
      margin: 0;
      font-weight: 600;
    }

    .feedback.success {
      color: var(--success);
    }

    .feedback.error {
      color: var(--danger);
    }

    .loading {
      margin: 0;
      color: var(--muted);
    }

    .muted-status {
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .table-scroll {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    th,
    td {
      text-align: left;
      border-bottom: 1px solid var(--surface-strong);
      padding: 0.55rem 0.4rem;
      vertical-align: middle;
    }

    th {
      color: var(--muted);
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    @media (max-width: 900px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .reason-field,
      .other-reason-field {
        grid-column: auto;
      }

      .scheduling-heading {
        align-items: stretch;
        flex-direction: column;
      }
    }

    @media (max-width: 700px) {
      .search-control {
        grid-template-columns: 1fr;
      }

      .selected-patient {
        justify-content: space-between;
      }

      .table-scroll {
        overflow: visible;
      }

      thead {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      tbody,
      tr,
      td {
        display: block;
      }

      tbody {
        display: grid;
        gap: 0.75rem;
      }

      tr {
        border: 1px solid var(--surface-strong);
        border-radius: 0.7rem;
        padding: 0.35rem 0.65rem;
        background: var(--surface);
      }

      td {
        display: grid;
        grid-template-columns: minmax(6.5rem, 38%) minmax(0, 1fr);
        gap: 0.7rem;
        align-items: start;
        padding: 0.48rem 0;
      }

      td::before {
        content: attr(data-label);
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }
    }
  `
})
export class AppointmentsPageComponent implements OnInit {
  private readonly pageSize = 25;
  readonly minimumAppointmentDateTime = this.toDateTimeLocalValue(new Date());
  readonly appointmentReasons: AppointmentReasonOption[] = [
    { value: 'GENERAL_CONSULTATION', labelKey: 'appointments.reason.generalConsultation' },
    { value: 'FOLLOW_UP', labelKey: 'appointments.reason.followUp' },
    { value: 'NEW_CONCERN', labelKey: 'appointments.reason.newConcern' },
    { value: 'PROCEDURE', labelKey: 'appointments.reason.procedure' },
    { value: 'RESULTS_REVIEW', labelKey: 'appointments.reason.resultsReview' },
    { value: 'OTHER', labelKey: 'appointments.reason.other' }
  ];
  readonly intakeItems: Array<{ control: IntakeControlName; labelKey: string }> = [
    { control: 'reportsConditions', labelKey: 'appointments.intake.conditions' },
    { control: 'reportsPastSurgery', labelKey: 'appointments.intake.pastSurgery' },
    { control: 'reportsAllergies', labelKey: 'appointments.intake.allergies' },
    { control: 'reportsMedication', labelKey: 'appointments.intake.medication' },
    { control: 'requiresAssistance', labelKey: 'appointments.intake.assistance' }
  ];
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  appointments: Appointment[] = [];

  isLoadingPatients = false;
  isLoadingAppointments = false;
  isCreating = false;
  private readonly deletingAppointmentIds = new Set<number>();

  successMessage = '';
  errorMessage = '';
  private readonly requestedPatientId: number | null;
  totalAppointments = 0;
  currentPage = 0;
  isLastPage = true;
  patientSearchPerformed = false;
  intakeExpanded = false;
  scheduleExpanded = false;

  readonly form;
  readonly patientSearchForm;

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly patientService: PatientService,
    private readonly formBuilder: FormBuilder,
    private readonly confirmation: ConfirmationService,
    route: ActivatedRoute,
    public readonly i18n: I18nService
  ) {
    const patientId = Number(route.snapshot.queryParamMap.get('patientId'));
    this.requestedPatientId = Number.isFinite(patientId) && patientId > 0 ? patientId : null;
    this.patientSearchForm = this.formBuilder.group({
      query: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(2)])
    });
    this.form = this.formBuilder.group({
      scheduledAt: this.formBuilder.nonNullable.control('', Validators.required),
      reasonChoice: this.formBuilder.nonNullable.control('', Validators.required),
      otherReason: this.formBuilder.nonNullable.control(''),
      notes: this.formBuilder.nonNullable.control(''),
      reportsConditions: this.formBuilder.nonNullable.control(false),
      reportsPastSurgery: this.formBuilder.nonNullable.control(false),
      reportsAllergies: this.formBuilder.nonNullable.control(false),
      reportsMedication: this.formBuilder.nonNullable.control(false),
      requiresAssistance: this.formBuilder.nonNullable.control(false)
    });
  }

  ngOnInit(): void {
    if (this.requestedPatientId != null) {
      this.loadRequestedPatient(this.requestedPatientId);
    }
    this.loadAppointments(true);
  }

  createAppointment(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.selectedPatient) {
      this.errorMessage = this.i18n.t('appointments.search.required');
      return;
    }
    if (this.selectedPatient.status !== 'ACTIVE') {
      this.errorMessage = this.i18n.t('appointments.search.inactiveWarning');
      return;
    }
    const payload = this.form.getRawValue();
    const normalizedReason = this.resolveSelectedReason(payload.reasonChoice, payload.otherReason);
    if (normalizedReason.length === 0) {
      this.errorMessage = this.i18n.t('common.required');
      return;
    }
    if (new Date(payload.scheduledAt).getTime() <= Date.now()) {
      this.errorMessage = this.i18n.t('appointments.create.pastError');
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentService
      .createAppointment(this.selectedPatient.id, {
        scheduledAt: this.normalizeDateTime(payload.scheduledAt),
        reason: normalizedReason,
        notes: this.buildAppointmentNotes(payload)
      })
      .subscribe({
        next: (appointment) => {
          this.appointments = [...this.appointments, appointment].sort(
            (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
          );
          this.totalAppointments += 1;
          this.form.patchValue({
            scheduledAt: '',
            reasonChoice: '',
            otherReason: '',
            notes: '',
            reportsConditions: false,
            reportsPastSurgery: false,
            reportsAllergies: false,
            reportsMedication: false,
            requiresAssistance: false
          });
          this.intakeExpanded = false;
          this.isCreating = false;
          this.successMessage = this.i18n.t('appointments.create.success');
        },
        error: (error: unknown) => {
          this.isCreating = false;
          this.errorMessage = this.resolveErrorMessage(error, 'appointments.create.error');
        }
      });
  }

  isDeleting(appointmentId: number): boolean {
    return this.deletingAppointmentIds.has(appointmentId);
  }

  async cancelAppointment(appointmentId: number): Promise<void> {
    if (this.isDeleting(appointmentId)) {
      return;
    }

    const confirmed = await this.confirmation.confirm('appointments.cancel.confirm', {
      titleKey: 'appointments.cancel.title',
      confirmKey: 'appointments.cancel.action',
      tone: 'danger'
    });
    if (!confirmed) {
      return;
    }

    this.deletingAppointmentIds.add(appointmentId);
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentService.updateAppointmentStatus(appointmentId, 'CANCELLED').subscribe({
      next: (updatedAppointment) => {
        this.appointments = this.appointments.filter((appointment) => appointment.id !== updatedAppointment.id);
        this.totalAppointments = Math.max(0, this.totalAppointments - 1);
        this.deletingAppointmentIds.delete(appointmentId);
        this.successMessage = this.i18n.t('appointments.cancel.success');
      },
      error: (error: unknown) => {
        this.deletingAppointmentIds.delete(appointmentId);
        this.errorMessage = this.resolveErrorMessage(error, 'appointments.cancel.error');
      }
    });
  }

  trackByAppointmentId(_index: number, appointment: Appointment): number {
    return appointment.id;
  }

  trackByPatientId(_index: number, patient: Patient): number {
    return patient.id;
  }

  searchPatients(): void {
    const query = this.patientSearchForm.controls.query.value.trim();
    if (this.patientSearchForm.invalid || query.length < 2) {
      this.patientSearchForm.markAllAsTouched();
      this.errorMessage = this.i18n.t('appointments.search.minimum');
      return;
    }
    this.isLoadingPatients = true;
    this.errorMessage = '';
    this.patientSearchPerformed = true;
    this.patientService.getVisiblePatientPage(0, 10, query).subscribe({
      next: (response) => {
        this.patients = response.content;
        this.isLoadingPatients = false;
      },
      error: (error: unknown) => {
        this.patients = [];
        this.isLoadingPatients = false;
        this.errorMessage = this.resolveErrorMessage(error, 'appointments.search.error');
      }
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.form.reset({
      scheduledAt: '',
      reasonChoice: '',
      otherReason: '',
      notes: '',
      reportsConditions: false,
      reportsPastSurgery: false,
      reportsAllergies: false,
      reportsMedication: false,
      requiresAssistance: false
    });
    this.errorMessage = '';
  }

  clearSelectedPatient(): void {
    this.selectedPatient = null;
    this.patients = [];
    this.patientSearchPerformed = false;
    this.patientSearchForm.controls.query.setValue('');
  }

  showMoreAppointments(): void {
    if (!this.isLastPage && !this.isLoadingAppointments) {
      this.loadAppointments(false);
    }
  }

  private loadRequestedPatient(patientId: number): void {
    this.isLoadingPatients = true;
    this.errorMessage = '';

    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        this.patients = [patient];
        this.selectedPatient = patient;
        this.patientSearchForm.controls.query.setValue(patient.patientNumber || `${patient.firstName} ${patient.lastName}`);
        this.patientSearchPerformed = true;
        this.isLoadingPatients = false;
      },
      error: (error: unknown) => {
        this.isLoadingPatients = false;
        this.errorMessage = this.resolveErrorMessage(error, 'appointments.error');
      }
    });
  }

  private resolveSelectedReason(reasonChoice: string, otherReason: string): string {
    if (reasonChoice === 'OTHER') {
      return otherReason.trim();
    }
    return reasonChoice.trim();
  }

  private buildAppointmentNotes(payload: ReturnType<typeof this.form.getRawValue>): string | null {
    const reportedItems = this.intakeItems
      .filter((item) => payload[item.control])
      .map((item) => this.i18n.t(item.labelKey));
    const freeText = payload.notes.trim();
    if (reportedItems.length === 0) {
      return this.normalizeOptionalValue(freeText);
    }
    const checklist = `${this.i18n.t('appointments.intake.notesPrefix')}: ${reportedItems.join('; ')}`;
    return freeText ? `${checklist}\n${freeText}` : checklist;
  }

  private loadAppointments(reset: boolean): void {
    this.isLoadingAppointments = true;
    this.errorMessage = '';
    const requestedPage = reset ? 0 : this.currentPage + 1;

    this.appointmentService.getUpcomingAppointmentPage(requestedPage, this.pageSize).subscribe({
      next: (response) => {
        this.appointments = reset ? response.content : [...this.appointments, ...response.content];
        this.totalAppointments = response.totalElements;
        this.currentPage = response.page;
        this.isLastPage = response.last;
        this.isLoadingAppointments = false;
      },
      error: (error: unknown) => {
        this.isLoadingAppointments = false;
        this.errorMessage = this.resolveErrorMessage(error, 'appointments.error');
      }
    });
  }

  private normalizeOptionalValue(value: string): string | null {
    const normalized = value.trim();
    return normalized.length === 0 ? null : normalized;
  }

  private normalizeDateTime(value: string): string {
    const normalized = value.trim();
    return normalized.length === 16 ? `${normalized}:00` : normalized;
  }

  private toDateTimeLocalValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private resolveErrorMessage(error: unknown, fallbackKey: string): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;
      if (payload && typeof payload === 'object') {
        const objectPayload = payload as Record<string, unknown>;
        if (objectPayload['code'] === 'APPOINTMENT_TIME_CONFLICT') {
          return this.i18n.t('appointments.create.conflictError');
        }
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
