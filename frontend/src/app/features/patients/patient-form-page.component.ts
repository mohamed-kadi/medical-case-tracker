import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { I18nService } from '../../core/services/i18n.service';
import { PatientService } from '../../core/services/patient.service';
import { ConfirmationService } from '../../shared/confirmation.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientUpsertRequest } from '../../core/models/patient.model';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-patient-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="form-shell">
      <section class="form-panel">
        <p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
        <p class="feedback error" *ngIf="formErrorMessage">{{ formErrorMessage }}</p>
        <p class="loading" *ngIf="isLoading">{{ i18n.t('patients.loading') }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate *ngIf="!isLoading">
          <fieldset>
            <legend>{{ i18n.t('patients.form.section.identity') }}</legend>
            <div class="field-grid">
              <label>
                {{ i18n.t('patients.form.firstName') }}
                <input type="text" formControlName="firstName" />
              </label>
              <label>
                {{ i18n.t('patients.form.lastName') }}
                <input type="text" formControlName="lastName" />
              </label>
              <label>
                {{ i18n.t('patients.form.dateOfBirth') }}
                <input type="date" formControlName="dateOfBirth" />
              </label>
              <label>
                {{ i18n.t('patients.form.status') }}
                <select formControlName="status">
                  <option value="ACTIVE">{{ i18n.t('patients.form.status.active') }}</option>
                  <option value="INACTIVE">{{ i18n.t('patients.form.status.inactive') }}</option>
                  <option value="ARCHIVED">{{ i18n.t('patients.form.status.archived') }}</option>
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>{{ i18n.t('patients.form.section.contact') }}</legend>
            <div class="field-grid">
              <label>
                {{ i18n.t('patients.form.email') }}
                <input type="email" formControlName="email" />
              </label>
              <label>
                {{ i18n.t('patients.form.phone') }}
                <input type="text" formControlName="phoneNumber" />
              </label>
            </div>
          </fieldset>

          <fieldset *ngIf="canEditClinicalDetails; else clinicalRestricted">
            <legend>{{ i18n.t('patients.form.section.clinical') }}</legend>
            <label>
              {{ i18n.t('patients.form.medicalHistory') }}
              <textarea formControlName="medicalHistory" rows="5"></textarea>
            </label>
          </fieldset>
          <ng-template #clinicalRestricted>
            <p class="privacy-note">{{ i18n.t('patients.form.clinicalRestricted') }}</p>
          </ng-template>

          <small *ngIf="isInvalid('firstName') || isInvalid('lastName') || isInvalid('dateOfBirth')">
            {{ i18n.t('common.required') }}
          </small>
          <small *ngIf="isInvalid('email')">{{ i18n.t('common.invalidEmail') }}</small>

          <div class="form-actions">
            <button type="submit" [disabled]="isSubmitting">
              {{
                isSubmitting
                  ? i18n.t('patients.form.saving')
                  : mode === 'create'
                    ? i18n.t('patients.form.saveCreate')
                    : i18n.t('patients.form.saveUpdate')
              }}
            </button>
            <button type="button" class="secondary" (click)="cancel()">
              {{ i18n.t('patients.actions.cancel') }}
            </button>
          </div>
        </form>
      </section>
    </section>
  `,
  styles: `
    .form-shell {
      width: min(62rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .form-panel {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.95rem;
      padding: 1rem;
      box-shadow: var(--elevation-soft);
    }

    .feedback {
      font-weight: 600;
      margin: 0.3rem 0 0;
    }

    .feedback.success {
      color: var(--success);
    }

    .feedback.error {
      color: var(--danger);
    }

    .loading {
      margin-top: 0.5rem;
      color: var(--muted);
    }

    form {
      display: grid;
      gap: 0.7rem;
      margin-top: 0.6rem;
    }

    fieldset {
      margin: 0;
      padding: 0.65rem;
      border: 1px dashed var(--surface-strong);
      border-radius: 0.6rem;
      display: grid;
      gap: 0.55rem;
    }

    legend {
      padding: 0 0.35rem;
      font-size: 0.76rem;
      letter-spacing: 0.03em;
      color: var(--muted);
      text-transform: uppercase;
    }

    .field-grid {
      display: grid;
      gap: 0.55rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    }

    label {
      display: grid;
      gap: 0.3rem;
      color: var(--muted);
      font-size: 0.83rem;
    }

    input,
    select,
    textarea,
    button {
      border: 1px solid var(--surface-strong);
      border-radius: 0.5rem;
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
    }

    input,
    select,
    textarea {
      padding: 0.5rem 0.55rem;
      font-size: 0.88rem;
      width: 100%;
      min-width: 0;
    }

    textarea {
      resize: vertical;
      min-height: 5rem;
    }

    small {
      color: var(--danger);
      font-size: 0.78rem;
      margin-top: -0.15rem;
    }

    .privacy-note {
      margin: 0;
      border: 1px dashed var(--surface-strong);
      border-radius: 0.6rem;
      padding: 0.65rem;
      color: var(--muted);
      font-size: 0.84rem;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.3rem;
    }

    button {
      padding: 0.46rem 0.68rem;
      font-size: 0.84rem;
      cursor: pointer;
      width: fit-content;
    }

    .secondary {
      background: transparent;
    }

    button:disabled {
      cursor: wait;
      opacity: 0.72;
    }

    @media (max-width: 860px) {
      .form-header {
        align-items: start;
        flex-direction: column;
      }
    }
  `
})
export class PatientFormPageComponent implements OnInit {
  mode: FormMode = 'create';
  private editingPatientId: number | null = null;

  isLoading = false;
  isSubmitting = false;
  formErrorMessage = '';
  successMessage = '';
  private originalStatus = 'ACTIVE';

  readonly form;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly confirmation: ConfirmationService,
    public readonly i18n: I18nService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      medicalHistory: [''],
      status: ['ACTIVE', Validators.required]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.mode = 'create';
      return;
    }

    const patientId = Number(idParam);
    if (!Number.isFinite(patientId)) {
      void this.router.navigateByUrl('/patients');
      return;
    }

    this.mode = 'edit';
    this.editingPatientId = patientId;
    this.loadPatient(patientId);
  }

  isInvalid(controlName: 'firstName' | 'lastName' | 'dateOfBirth' | 'email'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  get canEditClinicalDetails(): boolean {
    return this.authService.getCurrentRole() === 'DOCTOR';
  }

  cancel(): void {
    void this.router.navigateByUrl('/patients');
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.toPayload();
    this.isSubmitting = true;
    this.formErrorMessage = '';
    this.successMessage = '';

    if (this.mode === 'create') {
      this.patientService.createPatient(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          void this.router.navigateByUrl('/patients');
        },
        error: () => {
          this.isSubmitting = false;
          this.formErrorMessage = this.i18n.t('patients.form.error.create');
        }
      });
      return;
    }

    if (this.editingPatientId == null) {
      this.isSubmitting = false;
      this.formErrorMessage = this.i18n.t('patients.form.error.update');
      return;
    }

    if (payload.status !== this.originalStatus && payload.status !== 'ACTIVE') {
      const confirmed = await this.confirmation.confirm('patients.form.statusChangeConfirm', {
        titleKey: 'patients.form.statusChangeTitle',
        tone: 'danger'
      });
      if (!confirmed) {
        this.isSubmitting = false;
        return;
      }
    }

    this.patientService.updatePatient(this.editingPatientId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.router.navigateByUrl('/patients');
      },
      error: () => {
        this.isSubmitting = false;
        this.formErrorMessage = this.i18n.t('patients.form.error.update');
      }
    });
  }

  private loadPatient(patientId: number): void {
    this.isLoading = true;
    this.formErrorMessage = '';

    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        this.originalStatus = patient.status ?? 'ACTIVE';
        this.form.patchValue({
          firstName: patient.firstName ?? '',
          lastName: patient.lastName ?? '',
          dateOfBirth: patient.dateOfBirth ?? '',
          email: patient.email ?? '',
          phoneNumber: patient.phoneNumber ?? '',
          medicalHistory: patient.medicalHistory ?? '',
          status: patient.status ?? 'ACTIVE'
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        void this.router.navigateByUrl('/patients');
      }
    });
  }

  private toPayload(): PatientUpsertRequest {
    const value = this.form.getRawValue();
    const payload: PatientUpsertRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      dateOfBirth: value.dateOfBirth,
      email: value.email.trim(),
      phoneNumber: this.normalizeOptional(value.phoneNumber),
      status: value.status
    };
    if (this.canEditClinicalDetails) {
      payload.medicalHistory = this.normalizeOptional(value.medicalHistory);
    }
    return payload;
  }

  private normalizeOptional(value: string): string | null {
    const normalized = value.trim();
    return normalized.length === 0 ? null : normalized;
  }
}
