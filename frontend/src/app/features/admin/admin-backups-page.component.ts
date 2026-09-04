import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { BackupFile, BackupStatus } from '../../core/models/admin-backup.model';
import { AdminBackupService } from '../../core/services/admin-backup.service';
import { I18nService } from '../../core/services/i18n.service';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';
import { PageFeedbackComponent } from '../../shared/page-feedback.component';

@Component({
  selector: 'app-admin-backups-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LocalizedDatePipe, PageFeedbackComponent],
  template: `
    <section class="backup-shell">
      <app-page-feedback
        [success]="successMessage"
        [error]="errorMessage"
        [loading]="isLoading"
        [loadingText]="i18n.t('admin.backups.loading')"
      ></app-page-feedback>

      <section class="backup-summary">
        <article>
          <span>{{ i18n.t('admin.backups.summary.latest') }}</span>
          <strong>{{ status?.latestBackup?.fileName || i18n.t('admin.backups.summary.none') }}</strong>
        </article>
        <article>
          <span>{{ i18n.t('admin.backups.summary.folder') }}</span>
          <strong>{{ status?.backupDirectory || '-' }}</strong>
        </article>
        <article>
          <span>{{ i18n.t('admin.backups.summary.images') }}</span>
          <strong>{{ status?.imageStorageDirectory || '-' }}</strong>
        </article>
        <article>
          <span>{{ i18n.t('admin.backups.summary.restoreWord') }}</span>
          <strong>{{ status?.restoreConfirmationText || 'RESTORE' }}</strong>
        </article>
      </section>

      <section class="backup-grid">
        <article class="panel create-panel">
          <header>
            <h2>{{ i18n.t('admin.backups.create.title') }}</h2>
            <p>{{ i18n.t('admin.backups.create.description') }}</p>
          </header>

          <button type="button" (click)="createBackup()" [disabled]="isCreating || isRestoring">
            {{ isCreating ? i18n.t('admin.backups.create.creating') : i18n.t('admin.backups.create.action') }}
          </button>

          <ul class="check-list">
            <li>{{ i18n.t('admin.backups.create.includesDatabase') }}</li>
            <li>{{ i18n.t('admin.backups.create.includesImages') }}</li>
            <li>{{ i18n.t('admin.backups.create.keepExternal') }}</li>
          </ul>
        </article>

        <article class="panel restore-panel">
          <header>
            <h2>{{ i18n.t('admin.backups.restore.title') }}</h2>
            <p>{{ i18n.t('admin.backups.restore.description') }}</p>
          </header>

          <div class="warning-card">
            <strong>{{ i18n.t('admin.backups.restore.warningTitle') }}</strong>
            <span>{{ i18n.t('admin.backups.restore.warningText') }}</span>
          </div>

          <label class="file-picker">
            {{ i18n.t('admin.backups.restore.file') }}
            <input type="file" accept=".zip,application/zip" (change)="onFileSelected($event)" />
            <small>{{ selectedFileName || i18n.t('admin.backups.restore.noFile') }}</small>
          </label>

          <label>
            {{ i18n.t('admin.backups.restore.confirmation') }}
            <input
              type="text"
              [formControl]="confirmationControl"
              [placeholder]="status?.restoreConfirmationText || 'RESTORE'"
            />
          </label>

          <button type="button" class="danger" (click)="restoreBackup()" [disabled]="isRestoreDisabled">
            {{ isRestoring ? i18n.t('admin.backups.restore.restoring') : i18n.t('admin.backups.restore.action') }}
          </button>
        </article>
      </section>

      <section class="panel history-panel">
        <header class="panel-header">
          <div>
            <h2>{{ i18n.t('admin.backups.history.title') }}</h2>
            <p>{{ i18n.t('admin.backups.history.description') }}</p>
          </div>
          <button type="button" class="secondary" (click)="loadBackupOverview()" [disabled]="isLoading">
            {{ i18n.t('admin.backups.history.refresh') }}
          </button>
        </header>

        <div class="backup-list" *ngIf="backups.length > 0; else noBackups">
          <article class="backup-item" *ngFor="let backup of backups; trackBy: trackByFileName">
            <div>
              <strong>{{ backup.fileName }}</strong>
              <span>{{ backup.createdAt | localizedDate: 'medium' }} · {{ formatBytes(backup.sizeBytes) }}</span>
            </div>
            <button type="button" class="secondary" (click)="downloadBackup(backup)" [disabled]="isRestoring">
              {{ i18n.t('admin.backups.history.download') }}
            </button>
          </article>
        </div>

        <ng-template #noBackups>
          <p class="empty">{{ i18n.t('admin.backups.history.empty') }}</p>
        </ng-template>
      </section>
    </section>
  `,
  styles: `
    .backup-shell {
      width: min(76rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .panel,
    .backup-summary article {
      border: 1px solid var(--surface-strong);
      border-radius: 1rem;
      background: var(--surface-elevated);
      box-shadow: var(--elevation-soft);
    }

    h2 {
      margin: 0;
    }

    h2 {
      font-size: 1.1rem;
    }

    p,
    .empty,
    .backup-item span,
    .warning-card span,
    label,
    .check-list {
      color: var(--muted);
      line-height: 1.42;
    }

    p {
      margin: 0.3rem 0 0;
    }

    .backup-summary,
    .backup-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
      gap: 0.75rem;
    }

    .backup-summary article {
      padding: 0.9rem;
      display: grid;
      gap: 0.22rem;
      min-width: 0;
    }

    .backup-summary span {
      color: var(--muted);
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 800;
    }

    .backup-summary strong {
      color: var(--ink);
      font-size: 0.95rem;
      overflow-wrap: anywhere;
    }

    .panel {
      padding: 1rem;
      display: grid;
      gap: 0.85rem;
      align-content: start;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: 0.8rem;
      align-items: start;
    }

    label {
      display: grid;
      gap: 0.35rem;
      font-size: 0.9rem;
    }

    input {
      border: 1px solid var(--surface-strong);
      border-radius: 0.58rem;
      padding: 0.62rem;
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
    }

    input[type='file'] {
      padding: 0.55rem;
    }

    button {
      border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
      color: var(--ink);
      border-radius: 0.58rem;
      padding: 0.58rem 0.78rem;
      font-size: 0.88rem;
      font-weight: 800;
      width: fit-content;
      cursor: pointer;
      text-decoration: none;
    }

    button.secondary {
      border-color: var(--surface-strong);
      background: var(--surface);
    }

    button.danger {
      border-color: color-mix(in srgb, var(--danger) 48%, var(--surface-strong));
      background: color-mix(in srgb, var(--danger) 12%, var(--surface));
    }

    button:disabled {
      opacity: 0.65;
      cursor: wait;
    }

    .warning-card {
      border: 1px solid color-mix(in srgb, var(--danger) 44%, var(--surface-strong));
      border-radius: 0.85rem;
      background: color-mix(in srgb, var(--danger) 10%, var(--surface));
      padding: 0.75rem;
      display: grid;
      gap: 0.2rem;
    }

    .warning-card strong,
    .backup-item strong {
      color: var(--ink);
    }

    .check-list {
      margin: 0;
      padding-left: 1.2rem;
      display: grid;
      gap: 0.3rem;
      font-size: 0.9rem;
    }

    .backup-list {
      display: grid;
      gap: 0.62rem;
    }

    .backup-item {
      border: 1px solid var(--surface-strong);
      border-radius: 0.85rem;
      background: var(--surface);
      padding: 0.75rem;
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: center;
    }

    .backup-item div {
      display: grid;
      gap: 0.2rem;
      min-width: 0;
    }

    .backup-item strong {
      overflow-wrap: anywhere;
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

    .loading {
      color: var(--muted);
    }

    @media (max-width: 720px) {
      .panel-header,
      .backup-item {
        display: grid;
      }
    }
  `
})
export class AdminBackupsPageComponent implements OnInit {
  readonly confirmationControl = new FormControl('', { nonNullable: true });

  status: BackupStatus | null = null;
  backups: BackupFile[] = [];
  selectedFile: File | null = null;
  selectedFileName = '';
  isLoading = false;
  isCreating = false;
  isRestoring = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly backupService: AdminBackupService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.loadBackupOverview();
  }

  get isRestoreDisabled(): boolean {
    return (
      this.isCreating ||
      this.isRestoring ||
      !this.selectedFile ||
      this.confirmationControl.value.trim() !== (this.status?.restoreConfirmationText || 'RESTORE')
    );
  }

  loadBackupOverview(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      status: this.backupService.getStatus(),
      backups: this.backupService.listBackups()
    }).subscribe({
      next: ({ status, backups }) => {
        this.status = status;
        this.backups = backups;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.i18n.t('admin.backups.error.load');
        this.isLoading = false;
      }
    });
  }

  createBackup(): void {
    this.isCreating = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.backupService.createBackup().subscribe({
      next: (backup) => {
        this.successMessage = `${this.i18n.t('admin.backups.create.success')} (${backup.fileName})`;
        this.isCreating = false;
        this.loadBackupOverview();
      },
      error: () => {
        this.errorMessage = this.i18n.t('admin.backups.error.create');
        this.isCreating = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.selectedFile = file;
    this.selectedFileName = file?.name ?? '';
  }

  restoreBackup(): void {
    if (this.isRestoreDisabled || !this.selectedFile) {
      return;
    }

    this.isRestoring = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.backupService.restoreBackup(this.selectedFile, this.confirmationControl.value.trim()).subscribe({
      next: (response) => {
        this.successMessage = `${this.i18n.t('admin.backups.restore.success')} ${this.i18n.t(
          'admin.backups.restore.safetyBackup'
        )}: ${response.preRestoreBackupFileName}`;
        this.selectedFile = null;
        this.selectedFileName = '';
        this.confirmationControl.setValue('');
        this.isRestoring = false;
        this.loadBackupOverview();
      },
      error: () => {
        this.errorMessage = this.i18n.t('admin.backups.error.restore');
        this.isRestoring = false;
      }
    });
  }

  downloadBackup(backup: BackupFile): void {
    this.backupService.downloadBackup(backup.fileName).subscribe({
      next: (blob) => this.saveBlob(blob, backup.fileName),
      error: () => {
        this.errorMessage = this.i18n.t('admin.backups.error.download');
      }
    });
  }

  trackByFileName(_index: number, backup: BackupFile): string {
    return backup.fileName;
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
