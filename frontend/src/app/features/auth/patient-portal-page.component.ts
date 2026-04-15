import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-patient-portal-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="patient-portal-panel">
      <h1>{{ i18n.t('patientPortal.title') }}</h1>
      <p>{{ i18n.t('patientPortal.description') }}</p>
      <a routerLink="/login">{{ i18n.t('patientPortal.backToLogin') }}</a>
    </section>
  `,
  styles: `
    .patient-portal-panel {
      width: min(34rem, 100%);
      padding: 1.7rem;
      border-radius: 1rem;
      background: var(--surface-elevated);
      border: 1px solid var(--surface-strong);
      box-shadow: var(--elevation-soft);
    }

    h1 {
      margin: 0;
      font-size: 1.75rem;
      line-height: 1.15;
    }

    p {
      color: var(--muted);
      margin-top: 0.7rem;
    }

    a {
      display: inline-block;
      margin-top: 0.9rem;
      color: var(--ink);
      font-weight: 600;
    }
  `
})
export class PatientPortalPageComponent {
  constructor(public readonly i18n: I18nService) {}
}
