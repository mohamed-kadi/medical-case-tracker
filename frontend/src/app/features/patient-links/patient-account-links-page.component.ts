import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';

import {
  PatientAccountCandidate,
  PatientAccountLink,
  PatientAccountLinkPatient
} from '../../core/models/patient-account-link.model';
import { I18nService } from '../../core/services/i18n.service';
import { PatientAccountLinkService } from '../../core/services/patient-account-link.service';

@Component({
  selector: 'app-patient-account-links-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="links-shell">
      <header class="links-header">
        <div>
          <p class="kicker">{{ i18n.t('patientLinks.kicker') }}</p>
          <h1>{{ i18n.t('patientLinks.title') }}</h1>
          <p>{{ i18n.t('patientLinks.description') }}</p>
        </div>
      </header>

      <section class="flow-grid">
        <article class="panel patient-panel">
          <span class="step">1</span>
          <h2>{{ i18n.t('patientLinks.patient.title') }}</h2>
          <p>{{ i18n.t('patientLinks.patient.description') }}</p>

          <label>
            {{ i18n.t('patientLinks.patient.number') }}
            <input
              type="text"
              [value]="patientNumber"
              (input)="patientNumber = $any($event.target).value"
              [placeholder]="i18n.t('patientLinks.patient.placeholder')"
            />
          </label>

          <button type="button" (click)="lookupPatient()" [disabled]="isLoadingPatient">
            {{
              isLoadingPatient
                ? i18n.t('patientLinks.patient.loading')
                : i18n.t('patientLinks.patient.load')
            }}
          </button>

          <div class="identity-card" *ngIf="patient as loadedPatient">
            <span [class.linked]="loadedPatient.verifiedUsername">
              {{
                loadedPatient.verifiedUsername
                  ? i18n.t('patientLinks.status.linked')
                  : i18n.t('patientLinks.status.unlinked')
              }}
            </span>
            <strong>{{ loadedPatient.patientNumber }}</strong>
            <p>{{ loadedPatient.firstName }} {{ loadedPatient.lastName }}</p>
            <small>
              {{ loadedPatient.email || '-' }}
              <span aria-hidden="true"> · </span>
              {{ loadedPatient.phoneNumber || '-' }}
            </small>
            <small *ngIf="loadedPatient.verifiedUsername">
              {{ i18n.t('patientLinks.status.linkedTo') }}:
              {{ loadedPatient.verifiedUsername }} ({{ loadedPatient.verifiedEmail }})
            </small>
          </div>
        </article>

        <article class="panel account-panel">
          <span class="step">2</span>
          <h2>{{ i18n.t('patientLinks.account.title') }}</h2>
          <p>{{ i18n.t('patientLinks.account.description') }}</p>

          <label>
            {{ i18n.t('patientLinks.account.search') }}
            <input
              type="search"
              [value]="accountQuery"
              (input)="accountQuery = $any($event.target).value"
              [placeholder]="i18n.t('patientLinks.account.placeholder')"
            />
          </label>

          <button type="button" (click)="searchAccounts()" [disabled]="isSearchingAccounts">
            {{
              isSearchingAccounts
                ? i18n.t('patientLinks.account.searching')
                : i18n.t('patientLinks.account.searchAction')
            }}
          </button>

          <div class="account-results" *ngIf="accountResults.length > 0">
            <button
              type="button"
              class="account-result"
              *ngFor="let account of accountResults; trackBy: trackByAccountId"
              [class.selected]="account.username === selectedUsername"
              (click)="selectAccount(account)"
            >
              <strong>{{ account.username }}</strong>
              <small>{{ account.email }}</small>
            </button>
          </div>

          <p class="empty" *ngIf="accountSearched && accountResults.length === 0">
            {{ i18n.t('patientLinks.account.empty') }}
          </p>

          <label>
            {{ i18n.t('patientLinks.account.selected') }}
            <input
              type="text"
              [value]="selectedUsername"
              (input)="selectedUsername = $any($event.target).value"
              [placeholder]="i18n.t('patientLinks.account.selectedPlaceholder')"
            />
          </label>
        </article>

        <article class="panel verify-panel">
          <span class="step">3</span>
          <h2>{{ i18n.t('patientLinks.verify.title') }}</h2>
          <p>{{ i18n.t('patientLinks.verify.description') }}</p>

          <div class="review-box">
            <span>{{ i18n.t('patientLinks.review.patient') }}</span>
            <strong>{{ patient?.patientNumber || '-' }}</strong>
            <span>{{ i18n.t('patientLinks.review.account') }}</span>
            <strong>{{ selectedUsername || '-' }}</strong>
          </div>

          <button type="button" class="verify-action" (click)="verifyLink()" [disabled]="!canVerify()">
            {{
              isVerifying
                ? i18n.t('patientLinks.verify.verifying')
                : i18n.t('patientLinks.verify.action')
            }}
          </button>

          <p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
          <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>

          <div class="verified-card" *ngIf="verifiedLink as link">
            <span>{{ i18n.t('patientLinks.verified.title') }}</span>
            <strong>{{ link.patientNumber }} -> {{ link.username }}</strong>
            <small>{{ i18n.t('patientLinks.verified.by') }}: {{ link.verifiedByUsername || '-' }}</small>
          </div>
        </article>
      </section>
    </section>
  `,
  styles: `
    .links-shell {
      width: min(90rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .links-header {
      border: 1px solid var(--surface-strong);
      border-radius: 1.1rem;
      background:
        radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 19rem),
        linear-gradient(135deg, color-mix(in srgb, #8bd46e 12%, transparent), transparent 58%),
        var(--surface-elevated);
      box-shadow: var(--elevation-soft);
      padding: clamp(1.1rem, 2.2vw, 1.7rem);
    }

    .kicker {
      margin: 0 0 0.35rem;
      color: var(--accent);
      font-size: 0.74rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(1.75rem, 3vw, 2.8rem);
      line-height: 1.08;
    }

    h2 {
      font-size: 1.05rem;
    }

    p,
    .empty {
      color: var(--muted);
      line-height: 1.45;
    }

    .flow-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.85rem;
      align-items: start;
    }

    .panel {
      border: 1px solid var(--surface-strong);
      border-radius: 1rem;
      background: var(--surface-elevated);
      box-shadow: var(--elevation-soft);
      padding: 1rem;
      display: grid;
      gap: 0.8rem;
      min-width: 0;
    }

    .step {
      width: 2rem;
      height: 2rem;
      border-radius: 0.65rem;
      display: grid;
      place-items: center;
      border: 1px solid color-mix(in srgb, var(--accent) 48%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 14%, var(--surface));
      color: var(--ink);
      font-weight: 900;
    }

    label {
      display: grid;
      gap: 0.35rem;
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 800;
    }

    input,
    button {
      border: 1px solid var(--surface-strong);
      border-radius: 0.6rem;
      background: var(--surface);
      color: var(--ink);
      font: inherit;
      padding: 0.58rem 0.68rem;
      min-width: 0;
    }

    button {
      cursor: pointer;
      font-weight: 850;
    }

    button:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--accent) 50%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 12%, var(--surface));
    }

    button:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .identity-card,
    .verified-card,
    .review-box {
      display: grid;
      gap: 0.25rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.85rem;
      background: var(--surface);
      padding: 0.8rem;
    }

    .identity-card span,
    .verified-card span {
      width: fit-content;
      border: 1px solid color-mix(in srgb, #f59e0b 42%, var(--surface-strong));
      color: #c17a09;
      border-radius: 999px;
      padding: 0.16rem 0.48rem;
      font-size: 0.68rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .identity-card span.linked,
    .verified-card span {
      border-color: color-mix(in srgb, var(--success) 45%, var(--surface-strong));
      color: var(--success);
    }

    .identity-card strong,
    .verified-card strong {
      font-size: 1.05rem;
    }

    .identity-card small,
    .verified-card small {
      color: var(--muted);
      line-height: 1.35;
    }

    .account-results {
      display: grid;
      gap: 0.45rem;
    }

    .account-result {
      display: grid;
      gap: 0.15rem;
      text-align: left;
    }

    .account-result small {
      color: var(--muted);
    }

    .account-result.selected {
      border-color: color-mix(in srgb, var(--accent) 60%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 14%, var(--surface));
    }

    .review-box {
      grid-template-columns: auto 1fr;
      align-items: center;
    }

    .review-box span {
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 800;
    }

    .verify-action {
      border-color: color-mix(in srgb, var(--success) 50%, var(--surface-strong));
      background: color-mix(in srgb, var(--success) 14%, var(--surface));
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
      .flow-grid {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class PatientAccountLinksPageComponent {
  patientNumber = '';
  accountQuery = '';
  selectedUsername = '';
  patient: PatientAccountLinkPatient | null = null;
  accountResults: PatientAccountCandidate[] = [];
  verifiedLink: PatientAccountLink | null = null;
  accountSearched = false;
  isLoadingPatient = false;
  isSearchingAccounts = false;
  isVerifying = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly patientAccountLinkService: PatientAccountLinkService,
    public readonly i18n: I18nService
  ) {}

  lookupPatient(): void {
    const patientNumber = this.patientNumber.trim();
    if (patientNumber.length === 0) {
      this.errorMessage = this.i18n.t('patientLinks.errors.patientNumberRequired');
      return;
    }

    this.isLoadingPatient = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.patientAccountLinkService.getPatientByNumber(patientNumber).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.patientNumber = patient.patientNumber;
        this.verifiedLink = null;
        this.isLoadingPatient = false;
      },
      error: (error: unknown) => {
        this.patient = null;
        this.verifiedLink = null;
        this.isLoadingPatient = false;
        this.errorMessage = this.resolveErrorMessage(error, 'patientLinks.errors.patientLoad');
      }
    });
  }

  searchAccounts(): void {
    const query = this.accountQuery.trim();
    if (query.length < 2) {
      this.errorMessage = this.i18n.t('patientLinks.errors.accountSearchMin');
      this.accountResults = [];
      this.accountSearched = false;
      return;
    }

    this.isSearchingAccounts = true;
    this.accountSearched = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.patientAccountLinkService.searchPatientAccounts(query).subscribe({
      next: (accounts) => {
        this.accountResults = accounts;
        this.isSearchingAccounts = false;
      },
      error: (error: unknown) => {
        this.accountResults = [];
        this.isSearchingAccounts = false;
        this.errorMessage = this.resolveErrorMessage(error, 'patientLinks.errors.accountSearch');
      }
    });
  }

  selectAccount(account: PatientAccountCandidate): void {
    this.selectedUsername = account.username;
  }

  canVerify(): boolean {
    return Boolean(this.patient && this.selectedUsername.trim().length > 0 && !this.isVerifying);
  }

  verifyLink(): void {
    if (!this.patient) {
      this.errorMessage = this.i18n.t('patientLinks.errors.patientRequired');
      return;
    }

    const username = this.selectedUsername.trim();
    if (username.length === 0) {
      this.errorMessage = this.i18n.t('patientLinks.errors.accountRequired');
      return;
    }

    this.isVerifying = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.patientAccountLinkService
      .verifyLink({
        patientNumber: this.patient.patientNumber,
        username,
        verificationMethod: 'FRONT_DESK_CARD'
      })
      .subscribe({
        next: (link) => {
          this.verifiedLink = link;
          this.patient = {
            ...this.patient!,
            verifiedUsername: link.username,
            verifiedEmail: link.email,
            verifiedAt: link.verifiedAt
          };
          this.isVerifying = false;
          this.successMessage = this.i18n.t('patientLinks.verify.success');
        },
        error: (error: unknown) => {
          this.isVerifying = false;
          this.errorMessage = this.resolveErrorMessage(error, 'patientLinks.verify.error');
        }
      });
  }

  trackByAccountId(_index: number, account: PatientAccountCandidate): number {
    return account.id;
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
