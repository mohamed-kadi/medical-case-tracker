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

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LocalizedDatePipe, StatusLabelPipe, PageFeedbackComponent],
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

      <section class="panel">
        <h2>{{ i18n.t('appointments.create.title') }}</h2>
        <form class="appointment-form" [formGroup]="form" (ngSubmit)="createAppointment()" novalidate>
          <div class="form-grid">
            <label class="field patient-field">
              {{ i18n.t('appointments.create.patient') }}
              <select formControlName="patientId">
                <option [ngValue]="null">{{ i18n.t('appointments.create.selectPatient') }}</option>
                <option *ngFor="let patient of patients" [ngValue]="patient.id">
                  {{ patient.firstName }} {{ patient.lastName }}
                </option>
              </select>
            </label>

            <label class="field date-field">
              {{ i18n.t('appointments.create.when') }}
              <input type="datetime-local" formControlName="scheduledAt" [min]="minimumAppointmentDateTime" />
            </label>

            <label class="field reason-field">
              {{ i18n.t('appointments.create.reason') }}
              <input type="text" formControlName="reason" [placeholder]="i18n.t('appointments.create.reasonPlaceholder')" />
            </label>

            <label class="field notes-field">
              {{ i18n.t('appointments.create.notes') }}
              <textarea
                formControlName="notes"
                [placeholder]="i18n.t('appointments.create.notesPlaceholder')"
                rows="2"
              ></textarea>
            </label>
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="isCreating || patients.length === 0">
              {{ isCreating ? i18n.t('appointments.create.saving') : i18n.t('appointments.create.save') }}
            </button>
            <small *ngIf="patients.length === 0">{{ i18n.t('appointments.create.noPatients') }}</small>
          </div>
        </form>
      </section>

      <app-page-feedback
        [success]="successMessage"
        [error]="errorMessage"
        [loading]="isLoadingPatients || isLoadingAppointments"
        [loadingText]="i18n.t('appointments.loading')"
      ></app-page-feedback>

      <section class="panel">
        <h2>{{ i18n.t('appointments.list.title') }}</h2>

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
                <td [attr.data-label]="i18n.t('appointments.headers.reason')">{{ appointment.reason }}</td>
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

    .reason-field,
    .notes-field {
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
      .notes-field {
        grid-column: auto;
      }
    }

    @media (max-width: 700px) {
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
  patients: Patient[] = [];
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

  readonly form;

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
    this.form = this.formBuilder.group({
      patientId: this.formBuilder.control<number | null>(null, Validators.required),
      scheduledAt: this.formBuilder.nonNullable.control('', Validators.required),
      reason: this.formBuilder.nonNullable.control('', Validators.required),
      notes: this.formBuilder.nonNullable.control('')
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.loadAppointments(true);
  }

  createAppointment(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    if (payload.patientId == null) {
      return;
    }
    const normalizedReason = payload.reason.trim();
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
      .createAppointment(payload.patientId, {
        scheduledAt: this.normalizeDateTime(payload.scheduledAt),
        reason: normalizedReason,
        notes: this.normalizeOptionalValue(payload.notes)
      })
      .subscribe({
        next: (appointment) => {
          this.appointments = [...this.appointments, appointment].sort(
            (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
          );
          this.totalAppointments += 1;
          this.form.patchValue({
            scheduledAt: '',
            reason: '',
            notes: ''
          });
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

  cancelAppointment(appointmentId: number): void {
    if (this.isDeleting(appointmentId)) {
      return;
    }

    const confirmed = this.confirmation.confirm('appointments.cancel.confirm');
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

  showMoreAppointments(): void {
    if (!this.isLastPage && !this.isLoadingAppointments) {
      this.loadAppointments(false);
    }
  }

  private loadPatients(): void {
    this.isLoadingPatients = true;
    this.errorMessage = '';

    this.patientService.getVisiblePatients().subscribe({
      next: (patients) => {
        this.patients = patients;

        const selectedPatientId = this.form.controls.patientId.value;
        const selectedExists = selectedPatientId != null && patients.some((patient) => patient.id === selectedPatientId);

        const requestedPatientExists =
          this.requestedPatientId != null && patients.some((patient) => patient.id === this.requestedPatientId);
        if (requestedPatientExists) {
          this.form.controls.patientId.setValue(this.requestedPatientId);
        } else if (!selectedExists && patients.length > 0) {
          this.form.controls.patientId.setValue(patients[0].id);
        }
        if (patients.length === 0) {
          this.form.controls.patientId.setValue(null);
        }

        this.isLoadingPatients = false;
      },
      error: (error: unknown) => {
        this.isLoadingPatients = false;
        this.errorMessage = this.resolveErrorMessage(error, 'appointments.error');
      }
    });
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
