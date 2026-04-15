import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-panel">
      <h1>{{ i18n.t('auth.register.title') }}</h1>
      <p>{{ i18n.t('auth.register.description') }}</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label>
          {{ i18n.t('auth.register.username') }}
          <input formControlName="username" type="text" autocomplete="username" />
        </label>
        <small *ngIf="isControlInvalid('username')">{{ i18n.t('common.required') }}</small>

        <label>
          {{ i18n.t('auth.register.email') }}
          <input formControlName="email" type="email" autocomplete="email" />
        </label>
        <small *ngIf="form.controls.email.hasError('required') && form.controls.email.touched">{{ i18n.t('common.required') }}</small>
        <small *ngIf="form.controls.email.hasError('email') && form.controls.email.touched">{{ i18n.t('common.invalidEmail') }}</small>

        <label>
          {{ i18n.t('auth.register.password') }}
          <input formControlName="password" type="password" autocomplete="new-password" />
        </label>
        <small *ngIf="isControlInvalid('password')">{{ i18n.t('common.required') }}</small>

        <button type="submit" [disabled]="isSubmitting">{{ i18n.t('auth.register.submit') }}</button>
      </form>

      <p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <p class="route-link">
        {{ i18n.t('nav.login') }}:
        <a routerLink="/login">{{ i18n.t('auth.login.submit') }}</a>
      </p>
    </section>
  `,
  styles: `
    .auth-panel {
      width: min(30rem, 100%);
      padding: 1.75rem;
      border-radius: 1rem;
      background: var(--surface-elevated);
      border: 1px solid var(--surface-strong);
      box-shadow: var(--elevation-soft);
    }

    h1 {
      margin: 0;
      font-size: 1.7rem;
      line-height: 1.15;
    }

    p {
      color: var(--muted);
    }

    form {
      display: grid;
      gap: 0.85rem;
      margin-top: 1rem;
    }

    label {
      display: grid;
      gap: 0.35rem;
      font-size: 0.92rem;
      color: var(--muted);
    }

    input {
      border: 1px solid var(--surface-strong);
      border-radius: 0.6rem;
      padding: 0.7rem;
      font-size: 0.95rem;
      background: var(--surface);
      color: var(--ink);
    }

    button {
      border: 0;
      border-radius: 0.6rem;
      padding: 0.75rem;
      font-weight: 600;
      background: var(--accent);
      color: #0c1218;
      cursor: pointer;
      margin-top: 0.35rem;
    }

    button:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    small {
      color: var(--danger);
    }

    .feedback.success {
      color: var(--success);
      margin-top: 0.7rem;
    }

    .feedback.error {
      color: var(--danger);
      margin-top: 0.7rem;
    }

    .route-link {
      margin-top: 1rem;
    }

    a {
      color: var(--ink);
      font-weight: 600;
    }
  `
})
export class RegisterPageComponent {
  readonly form;

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    public readonly i18n: I18nService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  isControlInvalid(controlName: 'username' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = this.i18n.t('auth.register.success');
        this.form.reset();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = this.i18n.t('auth.register.error');
      }
    });
  }
}
