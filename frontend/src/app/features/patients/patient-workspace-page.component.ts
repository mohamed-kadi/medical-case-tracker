import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Appointment } from '../../core/models/appointment.model';
import { MedicalCase } from '../../core/models/case.model';
import { Patient } from '../../core/models/patient.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { CaseService } from '../../core/services/case.service';
import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { ConfirmationService } from '../../shared/confirmation.service';
import { StatusLabelPipe } from '../../shared/status-label.pipe';
import { PageFeedbackComponent } from '../../shared/page-feedback.component';

@Component({
  selector: 'app-patient-workspace-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LocalizedDatePipe, StatusLabelPipe, PageFeedbackComponent],
  template: `
    <section class="workspace-shell">
      <header class="workspace-header">
        <div>
          <h1>{{ patient ? (patient.firstName + ' ' + patient.lastName) : i18n.t('patientWorkspace.title') }}</h1>
          <p *ngIf="patient">{{ patient.patientNumber || '-' }} · {{ patient.email }}</p>
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

      <app-page-feedback
        [success]="successMessage"
        [error]="errorMessage"
        [loading]="isLoadingPatient || isLoadingCases || isLoadingAppointments"
        [loadingText]="i18n.t('patientWorkspace.loading')"
      ></app-page-feedback>

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
              <dd>{{ patient.status | statusLabel: 'patients' }}</dd>
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

          <div class="clinic-card" [attr.aria-label]="i18n.t('patientWorkspace.card.previewLabel')">
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
                <strong>{{ patient.createdAt | localizedDate: 'date' }}</strong>
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
          <header class="panel-header">
            <h2>{{ i18n.t('patientWorkspace.appointments.title') }}</h2>
            <a
              class="primary-action"
              *ngIf="patientId != null"
              routerLink="/appointments"
              [queryParams]="{ patientId: patientId }"
            >
              {{ i18n.t('patientWorkspace.appointments.schedule') }}
            </a>
          </header>

          <div class="appointment-list" *ngIf="appointments.length > 0; else emptyAppointments">
            <article class="appointment-item" *ngFor="let appointment of appointments; trackBy: trackByAppointmentId">
              <div>
                <strong>{{ appointment.scheduledAt | localizedDate: 'medium' }}</strong>
                <small>{{ appointment.reason }} · {{ appointment.status | statusLabel: 'appointments' }}</small>
                <p>{{ appointment.notes || '-' }}</p>
              </div>
              <button
                *ngIf="appointment.status === 'SCHEDULED'; else finalizedAppointment"
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
              <ng-template #finalizedAppointment>
                <span class="muted-status">{{ i18n.t('appointments.status.readOnly') }}</span>
              </ng-template>
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

        <div class="case-list" *ngIf="cases.length > 0; else emptyCases">
          <article class="case-item" *ngFor="let medicalCase of orderedCases; trackBy: trackByCaseId">
            <div>
              <strong>{{ medicalCase.title }}</strong>
              <small>
                {{ medicalCase.status | statusLabel: 'cases' }}
                ·
                {{ i18n.t('patientWorkspace.cases.updatedAt') }}:
                {{ (medicalCase.updatedAt || medicalCase.createdAt) | localizedDate: 'short' }}
              </small>
            </div>
            <a
              class="case-link"
              *ngIf="patientId != null"
              [routerLink]="['/patients', patientId, 'cases']"
              [queryParams]="{ caseId: medicalCase.id }"
            >
              {{ i18n.t('patientWorkspace.cases.openCase') }}
            </a>
          </article>
        </div>
        <ng-template #emptyCases>
          <p>{{ i18n.t('patientWorkspace.cases.empty') }}</p>
        </ng-template>
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

    .muted-status {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
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

  isLoadingPatient = false;
  isLoadingCases = false;
  isLoadingAppointments = false;

  private readonly deletingAppointmentIds = new Set<number>();

  errorMessage = '';
  successMessage = '';

  patientId: number | null = null;
  private currentRole = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly caseService: CaseService,
    private readonly appointmentService: AppointmentService,
    private readonly confirmation: ConfirmationService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.currentRole = this.authService.getCurrentRole();

    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedPatientId = idParam == null ? Number.NaN : Number(idParam);
    if (!Number.isFinite(parsedPatientId)) {
      void this.router.navigateByUrl('/patients');
      return;
    }

    this.patientId = parsedPatientId;
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
        this.appointments = this.appointments.map((appointment) =>
          appointment.id === updatedAppointment.id ? updatedAppointment : appointment
        );
        this.deletingAppointmentIds.delete(appointmentId);
        this.successMessage = this.i18n.t('appointments.cancel.success');
      },
      error: (error: unknown) => {
        this.deletingAppointmentIds.delete(appointmentId);
        this.errorMessage = this.resolveErrorMessage(error, 'appointments.cancel.error');
      }
    });
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
