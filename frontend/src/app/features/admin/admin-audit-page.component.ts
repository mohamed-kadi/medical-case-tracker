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
      <header class="audit-hero">
        <div>
          <span class="eyebrow">{{ i18n.t('admin.audit.eyebrow') }}</span>
          <h1>{{ i18n.t('admin.audit.title') }}</h1>
          <p>{{ i18n.t('admin.audit.description') }}</p>
        </div>
        <a class="back-link" routerLink="/dashboard">{{ i18n.t('admin.audit.back') }}</a>
      </header>

      <section class="audit-summary" aria-label="Audit summary">
        <article>
          <span>{{ i18n.t('admin.audit.summary.events') }}</span>
          <strong>{{ events.length }}</strong>
        </article>
        <article>
          <span>{{ i18n.t('admin.audit.summary.actors') }}</span>
          <strong>{{ actorCount }}</strong>
        </article>
        <article>
          <span>{{ i18n.t('admin.audit.summary.latest') }}</span>
          <strong>{{ latestEvent ? actionLabel(latestEvent.action) : i18n.t('admin.audit.summary.noLatest') }}</strong>
        </article>
        <article>
          <span>{{ i18n.t('admin.audit.summary.scope') }}</span>
          <strong>{{ activeFilterSummary }}</strong>
        </article>
      </section>

      <form class="filter-card" [formGroup]="filterForm" (ngSubmit)="applyFilters()" novalidate>
        <div class="filter-heading">
          <h2>{{ i18n.t('admin.audit.filters.title') }}</h2>
          <p>{{ i18n.t('admin.audit.filters.description') }}</p>
        </div>

        <div class="filter-grid">
          <label>
            {{ i18n.t('admin.audit.filters.entityType') }}
            <input formControlName="entityType" type="text" placeholder="PATIENT" />
          </label>

          <label>
            {{ i18n.t('admin.audit.filters.action') }}
            <input formControlName="action" type="text" placeholder="PATIENT_CREATED" />
          </label>

          <label>
            {{ i18n.t('admin.audit.filters.actor') }}
            <input formControlName="actor" type="text" placeholder="admin" />
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
        </div>
      </form>

      <p class="loading" *ngIf="isLoading">{{ i18n.t('admin.audit.loading') }}</p>
      <p class="feedback error" *ngIf="!isLoading && errorMessage.length > 0">{{ errorMessage }}</p>

      <section class="timeline-panel" *ngIf="!isLoading && errorMessage.length === 0 && events.length > 0">
        <header>
          <h2>{{ i18n.t('admin.audit.timeline.title') }}</h2>
          <p>{{ i18n.t('admin.audit.timeline.description') }}</p>
        </header>

        <div class="timeline">
          <article class="audit-event-card" *ngFor="let event of events; trackBy: trackById">
            <span class="event-marker" [ngClass]="actionToneClass(event.action)" aria-hidden="true"></span>

            <div class="event-body">
              <header class="event-header">
                <span class="action-badge" [ngClass]="actionToneClass(event.action)">
                  {{ actionLabel(event.action) }}
                </span>
                <time>{{ event.createdAt | date: 'medium' }}</time>
              </header>

              <h3>{{ entityLabel(event.entityType) }} #{{ event.entityId }}</h3>

              <dl class="event-meta">
                <div>
                  <dt>{{ i18n.t('admin.audit.event.actor') }}</dt>
                  <dd>{{ event.actorUsername }}</dd>
                </div>
                <div>
                  <dt>{{ i18n.t('admin.audit.event.entity') }}</dt>
                  <dd>{{ entityLabel(event.entityType) }}</dd>
                </div>
              </dl>

              <p class="event-details" *ngIf="event.details; else noDetails">
                <strong>{{ i18n.t('admin.audit.event.details') }}</strong>
                <span>{{ detailLabel(event.details) }}</span>
              </p>

              <ng-template #noDetails>
                <p class="event-details muted">{{ i18n.t('admin.audit.event.noDetails') }}</p>
              </ng-template>
            </div>
          </article>
        </div>
      </section>

      <section class="empty-state" *ngIf="!isLoading && errorMessage.length === 0 && events.length === 0">
        <strong>{{ i18n.t('admin.audit.empty.title') }}</strong>
        <p>{{ i18n.t('admin.audit.empty') }}</p>
      </section>
    </section>
  `,
  styles: `
    .audit-shell {
      width: min(76rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .audit-hero,
    .filter-card,
    .timeline-panel,
    .empty-state {
      border: 1px solid var(--surface-strong);
      border-radius: 1rem;
      background: var(--surface-elevated);
      box-shadow: var(--elevation-soft);
    }

    .audit-hero {
      padding: clamp(1rem, 2vw, 1.35rem);
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
      background:
        radial-gradient(circle at 7% 10%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 18rem),
        linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent 58%),
        var(--surface-elevated);
    }

    .eyebrow {
      display: inline-flex;
      width: fit-content;
      border: 1px solid color-mix(in srgb, var(--accent) 42%, var(--surface-strong));
      border-radius: 999px;
      padding: 0.18rem 0.52rem;
      color: var(--ink);
      background: color-mix(in srgb, var(--accent) 12%, var(--surface));
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    h1,
    h2,
    h3 {
      margin: 0;
    }

    h1 {
      font-size: clamp(1.45rem, 2vw, 1.9rem);
    }

    h2 {
      font-size: 1.08rem;
    }

    h3 {
      font-size: clamp(1rem, 1.5vw, 1.25rem);
    }

    p,
    .filter-heading p,
    .timeline-panel header p {
      margin: 0.3rem 0 0;
      color: var(--muted);
      line-height: 1.42;
    }

    .audit-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(11.5rem, 1fr));
      gap: 0.75rem;
    }

    .audit-summary article {
      border: 1px solid var(--surface-strong);
      border-radius: 0.9rem;
      background:
        radial-gradient(circle at 95% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 9rem),
        var(--surface-elevated);
      padding: 0.9rem;
      display: grid;
      gap: 0.22rem;
    }

    .audit-summary span {
      color: var(--muted);
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 800;
    }

    .audit-summary strong {
      color: var(--ink);
      font-size: clamp(1rem, 2vw, 1.4rem);
      line-height: 1.08;
    }

    .filter-card,
    .timeline-panel,
    .empty-state {
      padding: 1rem;
    }

    .filter-card {
      display: grid;
      gap: 0.85rem;
    }

    .filter-grid {
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

    input::placeholder {
      color: color-mix(in srgb, var(--muted) 65%, transparent);
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

    .timeline-panel {
      display: grid;
      gap: 0.9rem;
    }

    .timeline {
      position: relative;
      display: grid;
      gap: 0.75rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0.78rem;
      width: 1px;
      background: color-mix(in srgb, var(--accent) 28%, var(--surface-strong));
    }

    .audit-event-card {
      position: relative;
      display: grid;
      grid-template-columns: 1.6rem 1fr;
      gap: 0.85rem;
      align-items: start;
    }

    .event-marker {
      position: relative;
      z-index: 1;
      width: 1.6rem;
      height: 1.6rem;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--accent) 56%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 24%, var(--surface));
      box-shadow: 0 0 0 5px var(--surface-elevated);
    }

    .event-body {
      border: 1px solid var(--surface-strong);
      border-radius: 0.9rem;
      background: var(--surface);
      padding: 0.85rem;
      display: grid;
      gap: 0.65rem;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .action-badge {
      width: fit-content;
      border-radius: 999px;
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      color: var(--ink);
      padding: 0.22rem 0.58rem;
      font-size: 0.76rem;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .event-marker.create,
    .action-badge.create {
      border-color: color-mix(in srgb, var(--success) 58%, var(--surface-strong));
      background: color-mix(in srgb, var(--success) 15%, var(--surface));
    }

    .event-marker.update,
    .action-badge.update {
      border-color: color-mix(in srgb, var(--accent) 58%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
    }

    .event-marker.delete,
    .action-badge.delete {
      border-color: color-mix(in srgb, var(--danger) 58%, var(--surface-strong));
      background: color-mix(in srgb, var(--danger) 12%, var(--surface));
    }

    .event-marker.link,
    .action-badge.link {
      border-color: color-mix(in srgb, var(--accent) 42%, var(--surface-strong));
      background: linear-gradient(145deg, color-mix(in srgb, var(--accent) 18%, var(--surface)), var(--surface));
    }

    time {
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .event-meta {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      gap: 0.55rem;
    }

    .event-meta div {
      border: 1px solid var(--surface-strong);
      border-radius: 0.72rem;
      padding: 0.55rem;
      background: var(--surface-elevated);
    }

    dt {
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    dd {
      margin: 0.2rem 0 0;
      color: var(--ink);
      font-weight: 800;
    }

    .event-details {
      border-left: 3px solid color-mix(in srgb, var(--accent) 50%, var(--surface-strong));
      padding: 0.15rem 0 0.15rem 0.65rem;
      margin: 0;
      display: grid;
      gap: 0.18rem;
    }

    .event-details strong {
      color: var(--ink);
      font-size: 0.82rem;
    }

    .event-details span {
      color: var(--muted);
      font-size: 0.88rem;
      line-height: 1.4;
    }

    .event-details.muted {
      color: var(--muted);
      border-left-color: var(--surface-strong);
    }

    .empty-state {
      display: grid;
      gap: 0.25rem;
    }

    .empty-state strong {
      color: var(--ink);
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
      text-decoration: none;
      border: 1px solid var(--surface-strong);
      border-radius: 0.58rem;
      background: var(--surface);
      padding: 0.48rem 0.65rem;
      white-space: nowrap;
    }

    @media (max-width: 720px) {
      .audit-hero,
      .event-header {
        display: grid;
      }
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

  get actorCount(): number {
    return new Set(this.events.map((event) => event.actorUsername)).size;
  }

  get latestEvent(): AuditEvent | null {
    return this.events[0] ?? null;
  }

  get activeFilterSummary(): string {
    const filters = this.filterForm.getRawValue();
    const activeFilters = [filters.entityType, filters.action, filters.actor]
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return activeFilters.length > 0 ? activeFilters.join(' · ') : this.i18n.t('admin.audit.summary.allActivity');
  }

  actionLabel(action: string): string {
    return this.humanizeToken(action);
  }

  entityLabel(entityType: string): string {
    return this.humanizeToken(entityType);
  }

  detailLabel(details: string): string {
    return details
      .split(/[;,]/)
      .map((detail) => detail.trim())
      .filter((detail) => detail.length > 0)
      .map((detail) => this.humanizeDetail(detail))
      .join(' · ');
  }

  actionToneClass(action: string): string {
    const normalizedAction = action.toLowerCase();
    if (normalizedAction.includes('delete') || normalizedAction.includes('archive') || normalizedAction.includes('cancel')) {
      return 'delete';
    }
    if (normalizedAction.includes('create') || normalizedAction.includes('upload')) {
      return 'create';
    }
    if (normalizedAction.includes('link') || normalizedAction.includes('verify')) {
      return 'link';
    }
    if (normalizedAction.includes('update') || normalizedAction.includes('assign')) {
      return 'update';
    }
    return 'neutral';
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

  private humanizeToken(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter((part) => part.length > 0)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }

  private humanizeDetail(detail: string): string {
    const [rawKey, ...rawValueParts] = detail.split('=');
    if (rawValueParts.length === 0) {
      return this.humanizeToken(detail);
    }

    const key = this.humanizeToken(rawKey);
    const value = rawValueParts.join('=').trim();
    return `${key}: ${value}`;
  }
}
