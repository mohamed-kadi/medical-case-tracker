import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="dashboard-shell">
      <header>
        <p class="welcome">{{ i18n.t('dashboard.welcome') }}, {{ username || 'User' }}</p>
        <h1>{{ i18n.t(dashboardTitleKey) }}</h1>
        <p>{{ i18n.t(dashboardDescriptionKey) }}</p>
        <p class="workspace-note">{{ i18n.t(dashboardWorkspaceNoteKey) }}</p>
        <p class="role">
          {{ i18n.t('dashboard.role') }}: <strong>{{ currentRole || 'UNKNOWN' }}</strong>
        </p>
      </header>

      <div class="cards">
        <article class="card">{{ i18n.t('dashboard.card.auth') }}</article>
        <article class="card">{{ i18n.t('dashboard.card.lang') }}</article>
        <article class="card">{{ i18n.t(dashboardFocusCardKey) }}</article>
        <article class="card">
          {{ i18n.t('dashboard.card.visiblePatients') }}: <strong>{{ patients.length }}</strong>
        </article>
        <article class="card" *ngIf="canManageAppointments">
          {{ i18n.t('dashboard.card.upcomingAppointments') }}: <strong>{{ appointments.length }}</strong>
        </article>
      </div>

      <section class="quick-actions">
        <a *ngIf="isClinicalUser" routerLink="/patients" class="quick-link">{{ i18n.t('dashboard.quick.patients') }}</a>
        <a *ngIf="isClinicalUser" routerLink="/patients/new" class="quick-link">{{ i18n.t('dashboard.quick.newPatient') }}</a>
        <a *ngIf="isAdmin" routerLink="/admin/users" class="quick-link">{{ i18n.t('dashboard.quick.team') }}</a>
        <a *ngIf="isAdmin" routerLink="/admin/audit" class="quick-link">{{ i18n.t('dashboard.quick.audit') }}</a>
      </section>

      <section class="patient-panel">
        <h2>{{ i18n.t('dashboard.patients.title') }}</h2>
        <p>{{ i18n.t('dashboard.patients.description') }}</p>
        <p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
        <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>
        <p class="loading" *ngIf="isLoading">{{ i18n.t('dashboard.patients.loading') }}</p>

        <div class="table-scroll" *ngIf="!isLoading && patients.length > 0">
          <table>
            <thead>
              <tr>
                <th>{{ i18n.t('dashboard.patients.headers.name') }}</th>
                <th>{{ i18n.t('dashboard.patients.headers.email') }}</th>
                <th>{{ i18n.t('dashboard.patients.headers.status') }}</th>
                <th>{{ i18n.t('dashboard.patients.headers.doctor') }}</th>
                <th>{{ i18n.t('dashboard.patients.headers.staff') }}</th>
                <th *ngIf="isAdmin">{{ i18n.t('dashboard.patients.headers.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let patient of patients">
                <td>{{ patient.firstName }} {{ patient.lastName }}</td>
                <td>{{ patient.email }}</td>
                <td>{{ patient.status }}</td>
                <td>
                  <ng-container *ngIf="!isAdmin">
                    {{ patient.assignedDoctorUsername || '-' }}
                  </ng-container>
                  <input
                    *ngIf="isAdmin"
                    [value]="assignmentDrafts[patient.id]?.doctorUsername || ''"
                    (input)="updateDraft(patient.id, 'doctorUsername', $any($event.target).value)"
                    [placeholder]="i18n.t('dashboard.patients.placeholders.doctor')"
                  />
                </td>
                <td>
                  <ng-container *ngIf="!isAdmin">
                    {{ patient.assignedStaffUsername || '-' }}
                  </ng-container>
                  <input
                    *ngIf="isAdmin"
                    [value]="assignmentDrafts[patient.id]?.staffUsername || ''"
                    (input)="updateDraft(patient.id, 'staffUsername', $any($event.target).value)"
                    [placeholder]="i18n.t('dashboard.patients.placeholders.staff')"
                  />
                </td>
                <td *ngIf="isAdmin">
                  <button type="button" (click)="saveAssignment(patient.id)" [disabled]="isSaving(patient.id)">
                    {{
                      isSaving(patient.id)
                        ? i18n.t('dashboard.patients.assignment.saving')
                        : i18n.t('dashboard.patients.assignment.save')
                    }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p *ngIf="!isLoading && patients.length === 0">{{ i18n.t('dashboard.patients.empty') }}</p>
      </section>

      <section class="patient-panel" *ngIf="canManageAppointments">
        <h2>{{ i18n.t('dashboard.appointments.title') }}</h2>
        <p>{{ i18n.t('dashboard.appointments.description') }}</p>

        <form class="appointment-form" [formGroup]="appointmentForm" (ngSubmit)="createAppointment()" novalidate>
          <label>
            {{ i18n.t('dashboard.appointments.create.patient') }}
            <select formControlName="patientId">
              <option [ngValue]="null">{{ i18n.t('dashboard.appointments.create.selectPatient') }}</option>
              <option *ngFor="let patient of patients" [ngValue]="patient.id">
                {{ patient.firstName }} {{ patient.lastName }}
              </option>
            </select>
          </label>

          <label>
            {{ i18n.t('dashboard.appointments.create.when') }}
            <input type="datetime-local" formControlName="scheduledAt" />
          </label>

          <label>
            {{ i18n.t('dashboard.appointments.create.reason') }}
            <input type="text" formControlName="reason" [placeholder]="i18n.t('dashboard.appointments.create.reasonPlaceholder')" />
          </label>

          <label>
            {{ i18n.t('dashboard.appointments.create.notes') }}
            <textarea
              formControlName="notes"
              [placeholder]="i18n.t('dashboard.appointments.create.notesPlaceholder')"
              rows="2"
            ></textarea>
          </label>

          <div class="appointment-actions">
            <button type="submit" [disabled]="isCreatingAppointment || patients.length === 0">
              {{
                isCreatingAppointment
                  ? i18n.t('dashboard.appointments.create.saving')
                  : i18n.t('dashboard.appointments.create.save')
              }}
            </button>
            <small class="hint" *ngIf="patients.length === 0">{{ i18n.t('dashboard.appointments.create.noPatients') }}</small>
          </div>
        </form>

        <p class="feedback success" *ngIf="appointmentSuccessMessage">{{ appointmentSuccessMessage }}</p>
        <p class="feedback error" *ngIf="appointmentsError">{{ appointmentsError }}</p>
        <p class="loading" *ngIf="isAppointmentsLoading">{{ i18n.t('dashboard.appointments.loading') }}</p>

        <div class="table-scroll" *ngIf="!isAppointmentsLoading && appointments.length > 0">
          <table>
            <thead>
              <tr>
                <th>{{ i18n.t('dashboard.appointments.headers.when') }}</th>
                <th>{{ i18n.t('dashboard.appointments.headers.reason') }}</th>
                <th>{{ i18n.t('dashboard.appointments.headers.status') }}</th>
                <th>{{ i18n.t('dashboard.appointments.headers.notes') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let appointment of appointments">
                <td>{{ appointment.scheduledAt | date: 'medium' }}</td>
                <td>{{ appointment.reason }}</td>
                <td>{{ appointment.status }}</td>
                <td>{{ appointment.notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p *ngIf="!isAppointmentsLoading && appointments.length === 0">
          {{ i18n.t('dashboard.appointments.empty') }}
        </p>
      </section>
    </section>
  `,
  styles: `
    .dashboard-shell {
      display: grid;
      gap: 1rem;
      width: 100%;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.7rem, 2.3vw, 2.4rem);
      line-height: 1.12;
    }

    p {
      color: var(--muted);
      margin: 0.2rem 0 0;
    }

    .welcome {
      color: var(--ink);
      font-weight: 600;
      margin-bottom: 0.2rem;
    }

    .role {
      margin-top: 0.5rem;
      color: var(--ink);
    }

    .workspace-note {
      margin-top: 0.5rem;
      color: var(--ink);
      font-weight: 600;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 0.85rem;
    }

    .quick-actions {
      display: flex;
      gap: 0.55rem;
      flex-wrap: wrap;
    }

    .quick-link {
      text-decoration: none;
      color: var(--ink);
      border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
      border-radius: 0.62rem;
      padding: 0.5rem 0.74rem;
      font-weight: 600;
      font-size: 0.86rem;
    }

    .card {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.9rem;
      padding: 1rem;
      min-height: 7rem;
      box-shadow: var(--elevation-soft);
    }

    .patient-panel {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.9rem;
      padding: 1rem;
      box-shadow: var(--elevation-soft);
    }

    h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .feedback {
      margin-top: 0.6rem;
      font-weight: 600;
    }

    .feedback.success {
      color: var(--success);
    }

    .feedback.error {
      color: var(--danger);
    }

    .loading {
      margin-top: 0.8rem;
    }

    .table-scroll {
      overflow-x: auto;
      margin-top: 0.9rem;
    }

    .appointment-form {
      margin-top: 0.9rem;
      display: grid;
      gap: 0.65rem;
      grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
      align-items: end;
    }

    .appointment-form label {
      display: grid;
      gap: 0.35rem;
      color: var(--muted);
      font-size: 0.84rem;
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

    input,
    select,
    textarea {
      border: 1px solid var(--surface-strong);
      border-radius: 0.5rem;
      padding: 0.4rem 0.5rem;
      font-size: 0.85rem;
      min-width: 9rem;
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
    }

    textarea {
      resize: vertical;
      min-height: 2.3rem;
    }

    button {
      border: 1px solid var(--surface-strong);
      background: var(--surface);
      color: var(--ink);
      border-radius: 0.5rem;
      padding: 0.42rem 0.62rem;
      cursor: pointer;
      font-size: 0.85rem;
      height: fit-content;
    }

    .appointment-actions {
      display: grid;
      gap: 0.3rem;
      align-content: end;
    }

    .hint {
      color: var(--muted);
      font-size: 0.78rem;
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }
  `
})
export class DashboardPageComponent implements OnInit {
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  isLoading = false;
  isAppointmentsLoading = false;
  isCreatingAppointment = false;
  errorMessage = '';
  appointmentsError = '';
  successMessage = '';
  appointmentSuccessMessage = '';
  private readonly savingPatientIds = new Set<number>();
  assignmentDrafts: Partial<Record<number, { doctorUsername: string; staffUsername: string }>> = {};

  readonly appointmentForm;

  constructor(
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
    private readonly formBuilder: FormBuilder,
    public readonly i18n: I18nService
  ) {
    this.appointmentForm = this.formBuilder.group({
      patientId: this.formBuilder.control<number | null>(null, Validators.required),
      scheduledAt: this.formBuilder.nonNullable.control('', Validators.required),
      reason: this.formBuilder.nonNullable.control('', Validators.required),
      notes: this.formBuilder.nonNullable.control('')
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    if (this.canManageAppointments) {
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
    return this.currentRole === 'DOCTOR' || this.currentRole === 'STAFF';
  }

  get canManageAppointments(): boolean {
    return this.isClinicalUser;
  }

  get dashboardTitleKey(): string {
    if (this.isAdmin) {
      return 'dashboard.title.admin';
    }
    if (this.isClinicalUser) {
      return 'dashboard.title.clinical';
    }
    return 'dashboard.title';
  }

  get dashboardDescriptionKey(): string {
    if (this.isAdmin) {
      return 'dashboard.description.admin';
    }
    if (this.isClinicalUser) {
      return 'dashboard.description.clinical';
    }
    return 'dashboard.description';
  }

  get dashboardWorkspaceNoteKey(): string {
    if (this.isAdmin) {
      return 'dashboard.workspace.admin';
    }
    if (this.isClinicalUser) {
      return 'dashboard.workspace.clinical';
    }
    return 'dashboard.workspace.default';
  }

  get dashboardFocusCardKey(): string {
    return this.isAdmin ? 'dashboard.card.focusAdmin' : 'dashboard.card.focusClinical';
  }

  isSaving(patientId: number): boolean {
    return this.savingPatientIds.has(patientId);
  }

  updateDraft(patientId: number, field: 'doctorUsername' | 'staffUsername', value: string): void {
    const currentDraft = this.assignmentDrafts[patientId] ?? { doctorUsername: '', staffUsername: '' };
    this.assignmentDrafts[patientId] = {
      ...currentDraft,
      [field]: value
    };
  }

  createAppointment(): void {
    if (!this.canManageAppointments) {
      return;
    }

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const payload = this.appointmentForm.getRawValue();
    if (payload.patientId == null) {
      return;
    }

    this.isCreatingAppointment = true;
    this.appointmentsError = '';
    this.appointmentSuccessMessage = '';

    this.appointmentService
      .createAppointment(payload.patientId, {
        scheduledAt: this.normalizeDateTime(payload.scheduledAt),
        reason: payload.reason.trim(),
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
          this.appointmentSuccessMessage = this.i18n.t('dashboard.appointments.create.success');
        },
        error: () => {
          this.isCreatingAppointment = false;
          this.appointmentsError = this.i18n.t('dashboard.appointments.create.error');
        }
      });
  }

  saveAssignment(patientId: number): void {
    if (!this.isAdmin) {
      return;
    }

    const draft = this.assignmentDrafts[patientId] ?? { doctorUsername: '', staffUsername: '' };
    this.savingPatientIds.add(patientId);
    this.errorMessage = '';
    this.successMessage = '';

    this.patientService
      .assignPatient(patientId, {
        doctorUsername: this.normalizeDraftValue(draft.doctorUsername),
        staffUsername: this.normalizeDraftValue(draft.staffUsername)
      })
      .subscribe({
        next: (updatedPatient) => {
          this.replacePatient(updatedPatient);
          this.assignmentDrafts[patientId] = {
            doctorUsername: updatedPatient.assignedDoctorUsername ?? '',
            staffUsername: updatedPatient.assignedStaffUsername ?? ''
          };
          this.successMessage = this.i18n.t('dashboard.patients.assignment.success');
          this.savingPatientIds.delete(patientId);
        },
        error: () => {
          this.errorMessage = this.i18n.t('dashboard.patients.assignment.error');
          this.savingPatientIds.delete(patientId);
        }
      });
  }

  private loadPatients(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.patientService.getVisiblePatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.assignmentDrafts = patients.reduce(
          (drafts, patient) => {
            drafts[patient.id] = {
              doctorUsername: patient.assignedDoctorUsername ?? '',
              staffUsername: patient.assignedStaffUsername ?? ''
            };
            return drafts;
          },
          {} as Partial<Record<number, { doctorUsername: string; staffUsername: string }>>
        );

        const selectedPatientId = this.appointmentForm.controls.patientId.value;
        const selectedExists = selectedPatientId != null && patients.some((patient) => patient.id === selectedPatientId);
        if (!selectedExists && patients.length > 0) {
          this.appointmentForm.controls.patientId.setValue(patients[0].id);
        }
        if (patients.length === 0) {
          this.appointmentForm.controls.patientId.setValue(null);
        }

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.i18n.t('dashboard.patients.error');
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
      error: () => {
        this.appointmentsError = this.i18n.t('dashboard.appointments.error');
        this.isAppointmentsLoading = false;
      }
    });
  }

  private replacePatient(updatedPatient: Patient): void {
    this.patients = this.patients.map((patient) =>
      patient.id === updatedPatient.id ? updatedPatient : patient
    );
  }

  private normalizeDraftValue(value: string): string | null {
    const normalized = value.trim();
    return normalized.length === 0 ? null : normalized;
  }

  private normalizeOptionalValue(value: string): string | null {
    const normalized = value.trim();
    return normalized.length === 0 ? null : normalized;
  }

  private normalizeDateTime(value: string): string {
    const normalized = value.trim();
    return normalized.length === 16 ? `${normalized}:00` : normalized;
  }
}
