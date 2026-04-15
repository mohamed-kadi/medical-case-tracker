import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuditEvent } from '../../core/models/audit-event.model';
import { AuditService } from '../../core/services/audit.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-admin-audit-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="audit-shell">
      <header>
        <h1>{{ i18n.t('admin.audit.title') }}</h1>
        <p>{{ i18n.t('admin.audit.description') }}</p>
      </header>

      <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" novalidate>
        <label>
          {{ i18n.t('admin.audit.filters.entityType') }}
          <input formControlName="entityType" type="text" />
        </label>

        <label>
          {{ i18n.t('admin.audit.filters.action') }}
          <input formControlName="action" type="text" />
        </label>

        <label>
          {{ i18n.t('admin.audit.filters.actor') }}
          <input formControlName="actor" type="text" />
        </label>

        <label>
          {{ i18n.t('admin.audit.filters.limit') }}
          <input formControlName="limit" type="number" min="1" max="200" />
        </label>

        <div class="actions">
          <button type="submit" [disabled]="isLoading">{{ i18n.t('admin.audit.apply') }}</button>
          <button type="button" class="secondary" (click)="clearFilters()" [disabled]="isLoading">
            {{ i18n.t('admin.audit.clear') }}
          </button>
        </div>
      </form>

      <p class="loading" *ngIf="isLoading">{{ i18n.t('admin.audit.loading') }}</p>
      <p class="feedback error" *ngIf="!isLoading && errorMessage.length > 0">{{ errorMessage }}</p>

      <div class="table-scroll" *ngIf="!isLoading && errorMessage.length === 0 && events.length > 0">
        <table>
          <thead>
            <tr>
              <th>{{ i18n.t('admin.audit.table.when') }}</th>
              <th>{{ i18n.t('admin.audit.table.actor') }}</th>
              <th>{{ i18n.t('admin.audit.table.entity') }}</th>
              <th>{{ i18n.t('admin.audit.table.action') }}</th>
              <th>{{ i18n.t('admin.audit.table.details') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let event of events; trackBy: trackById">
              <td>{{ event.createdAt | date: 'medium' }}</td>
              <td>{{ event.actorUsername }}</td>
              <td>{{ event.entityType }} #{{ event.entityId }}</td>
              <td>{{ event.action }}</td>
              <td>{{ event.details || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p *ngIf="!isLoading && errorMessage.length === 0 && events.length === 0">
        {{ i18n.t('admin.audit.empty') }}
      </p>

      <a class="back-link" routerLink="/dashboard">{{ i18n.t('admin.audit.back') }}</a>
    </section>
  `,
  styles: `
    .audit-shell {
      width: min(70rem, 100%);
      border: 1px solid var(--surface-strong);
      border-radius: 0.95rem;
      background: var(--surface-elevated);
      box-shadow: var(--elevation-soft);
      padding: 1.15rem;
      display: grid;
      gap: 0.9rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.45rem, 2vw, 1.9rem);
    }

    p {
      margin: 0.3rem 0 0;
      color: var(--muted);
    }

    form {
      display: grid;
      gap: 0.7rem;
      grid-template-columns: repeat(auto-fit, minmax(11.5rem, 1fr));
      align-items: end;
    }

    label {
      display: grid;
      gap: 0.35rem;
      color: var(--muted);
      font-size: 0.88rem;
    }

    input {
      border: 1px solid var(--surface-strong);
      border-radius: 0.55rem;
      padding: 0.55rem;
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
    }

    .actions {
      display: flex;
      gap: 0.55rem;
      flex-wrap: wrap;
      align-items: center;
    }

    button {
      border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
      color: var(--ink);
      border-radius: 0.55rem;
      padding: 0.58rem 0.8rem;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
    }

    button.secondary {
      border-color: var(--surface-strong);
      background: var(--surface);
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    .table-scroll {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }

    th,
    td {
      text-align: left;
      border-bottom: 1px solid var(--surface-strong);
      padding: 0.55rem 0.4rem;
      vertical-align: top;
    }

    th {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .feedback.error {
      color: var(--danger);
      font-weight: 600;
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
export class AdminAuditPageComponent implements OnInit {
  readonly filterForm;

  events: AuditEvent[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly auditService: AuditService,
    public readonly i18n: I18nService
  ) {
    this.filterForm = this.formBuilder.nonNullable.group({
      entityType: [''],
      action: [''],
      actor: [''],
      limit: [50]
    });
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  applyFilters(): void {
    this.loadEvents();
  }

  clearFilters(): void {
    this.filterForm.setValue({
      entityType: '',
      action: '',
      actor: '',
      limit: 50
    });
    this.loadEvents();
  }

  trackById(_: number, event: AuditEvent): number {
    return event.id;
  }

  private loadEvents(): void {
    const filters = this.filterForm.getRawValue();
    this.isLoading = true;
    this.errorMessage = '';

    this.auditService.getEvents(filters).subscribe({
      next: (events) => {
        this.events = events;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.i18n.t('admin.audit.error');
        this.events = [];
        this.isLoading = false;
      }
    });
  }
}
