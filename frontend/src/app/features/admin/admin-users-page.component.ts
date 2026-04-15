import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminUserResponse, InternalUserRole } from '../../core/models/admin-user.model';
import { AdminUserService } from '../../core/services/admin-user.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="admin-users-shell">
      <header class="heading">
        <h1>{{ i18n.t('admin.users.title') }}</h1>
        <p>{{ i18n.t('admin.users.description') }}</p>
        <p class="policy">{{ i18n.t('admin.users.policy') }}</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>
          {{ i18n.t('admin.users.username') }}
          <input formControlName="username" type="text" autocomplete="username" />
        </label>

        <label>
          {{ i18n.t('admin.users.email') }}
          <input formControlName="email" type="email" autocomplete="email" />
        </label>

        <label>
          {{ i18n.t('admin.users.password') }}
          <input formControlName="password" type="password" autocomplete="new-password" />
        </label>

        <label>
          {{ i18n.t('admin.users.role') }}
          <select formControlName="role">
            <option value="DOCTOR">{{ i18n.t('admin.users.role.doctor') }}</option>
            <option value="STAFF">{{ i18n.t('admin.users.role.staff') }}</option>
          </select>
        </label>

        <button type="submit" [disabled]="isSubmitting">
          {{ isSubmitting ? i18n.t('admin.users.submitting') : i18n.t('admin.users.submit') }}
        </button>
      </form>

      <p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <section class="directory">
        <h2>{{ i18n.t('admin.users.directory.title') }}</h2>
        <p>{{ i18n.t('admin.users.directory.description') }}</p>

        <div class="directory-controls">
          <label>
            {{ i18n.t('admin.users.directory.roleFilterLabel') }}
            <select [value]="directoryRoleFilter" (change)="onDirectoryRoleChange($any($event.target).value)">
              <option value="ALL">{{ i18n.t('admin.users.directory.roleFilter.all') }}</option>
              <option value="DOCTOR">{{ i18n.t('admin.users.role.doctor') }}</option>
              <option value="STAFF">{{ i18n.t('admin.users.role.staff') }}</option>
            </select>
          </label>

          <label>
            {{ i18n.t('admin.users.directory.searchLabel') }}
            <input
              type="search"
              [value]="searchTerm"
              (input)="onSearchInput($any($event.target).value)"
              [placeholder]="i18n.t('admin.users.directory.searchPlaceholder')"
            />
          </label>
        </div>

        <p class="loading" *ngIf="isUsersLoading">{{ i18n.t('admin.users.directory.loading') }}</p>
        <p class="feedback error" *ngIf="!isUsersLoading && usersLoadError">{{ usersLoadError }}</p>

        <div class="table-scroll" *ngIf="!isUsersLoading && usersLoadError.length === 0 && visibleUsers.length > 0">
          <table>
            <thead>
              <tr>
                <th>{{ i18n.t('admin.users.directory.table.username') }}</th>
                <th>{{ i18n.t('admin.users.directory.table.email') }}</th>
                <th>{{ i18n.t('admin.users.directory.table.role') }}</th>
                <th>{{ i18n.t('admin.users.directory.table.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of visibleUsers">
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td>
                  {{
                    user.enabled
                      ? i18n.t('admin.users.directory.status.enabled')
                      : i18n.t('admin.users.directory.status.disabled')
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p *ngIf="!isUsersLoading && usersLoadError.length === 0 && visibleUsers.length === 0">
          {{ i18n.t('admin.users.directory.empty') }}
        </p>
      </section>

      <a class="back-link" routerLink="/dashboard">{{ i18n.t('admin.users.back') }}</a>
    </section>
  `,
  styles: `
    .admin-users-shell {
      width: min(52rem, 100%);
      border: 1px solid var(--surface-strong);
      border-radius: 0.95rem;
      background: var(--surface-elevated);
      box-shadow: var(--elevation-soft);
      padding: 1.2rem;
      display: grid;
      gap: 0.9rem;
    }

    .heading h1 {
      margin: 0;
      font-size: clamp(1.45rem, 2vw, 1.9rem);
    }

    .heading p {
      margin: 0.3rem 0 0;
      color: var(--muted);
    }

    .policy {
      color: var(--ink);
      font-size: 0.9rem;
    }

    form {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      align-items: end;
    }

    label {
      display: grid;
      gap: 0.35rem;
      color: var(--muted);
      font-size: 0.9rem;
    }

    input,
    select {
      border: 1px solid var(--surface-strong);
      border-radius: 0.55rem;
      padding: 0.6rem;
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
      font-size: 0.93rem;
    }

    button {
      border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
      color: var(--ink);
      border-radius: 0.55rem;
      padding: 0.6rem 0.8rem;
      font-size: 0.9rem;
      font-weight: 600;
      width: fit-content;
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    .directory {
      border-top: 1px solid var(--surface-strong);
      padding-top: 0.8rem;
      display: grid;
      gap: 0.75rem;
    }

    .directory h2 {
      margin: 0;
      font-size: 1.12rem;
    }

    .directory p {
      margin: 0;
      color: var(--muted);
    }

    .directory-controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.6rem;
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
      color: var(--muted);
    }

    .back-link {
      color: var(--ink);
      width: fit-content;
      font-weight: 600;
    }
  `
})
export class AdminUsersPageComponent implements OnInit {
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  readonly form;

  users: AdminUserResponse[] = [];
  isUsersLoading = false;
  usersLoadError = '';
  directoryRoleFilter: 'ALL' | InternalUserRole = 'ALL';
  searchTerm = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly adminUserService: AdminUserService,
    public readonly i18n: I18nService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: this.formBuilder.nonNullable.control<InternalUserRole>('DOCTOR', Validators.required)
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  get visibleUsers(): AdminUserResponse[] {
    const search = this.searchTerm.trim().toLowerCase();
    if (search.length === 0) {
      return this.users;
    }

    return this.users.filter((user) => {
      return user.username.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
  }

  onDirectoryRoleChange(value: string): void {
    this.directoryRoleFilter = this.parseDirectoryRoleFilter(value);
    this.loadUsers();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.adminUserService
      .createInternalUser({
        username: payload.username.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        role: payload.role
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.form.reset({
            username: '',
            email: '',
            password: '',
            role: 'DOCTOR'
          });
          this.successMessage = `${this.i18n.t('admin.users.success')} (${response.username})`;
          this.loadUsers();
        },
        error: () => {
          this.isSubmitting = false;
          this.errorMessage = this.i18n.t('admin.users.error');
        }
      });
  }

  private loadUsers(): void {
    this.isUsersLoading = true;
    this.usersLoadError = '';

    this.adminUserService.getInternalUsers(this.directoryRoleFilter).subscribe({
      next: (users) => {
        this.users = users;
        this.isUsersLoading = false;
      },
      error: () => {
        this.users = [];
        this.isUsersLoading = false;
        this.usersLoadError = this.i18n.t('admin.users.directory.loadError');
      }
    });
  }

  private parseDirectoryRoleFilter(value: string): 'ALL' | InternalUserRole {
    if (value === 'DOCTOR' || value === 'STAFF') {
      return value;
    }

    return 'ALL';
  }
}
