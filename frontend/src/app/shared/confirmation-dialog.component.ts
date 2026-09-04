import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

import { I18nService } from '../core/services/i18n.service';
import { ConfirmationService } from './confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-backdrop" *ngIf="confirmation.request() as request" (click)="close(false)">
      <section
        #dialog
        class="dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        (click)="$event.stopPropagation()"
      >
        <span class="dialog-icon" [class.danger]="request.tone === 'danger'" aria-hidden="true">!</span>
        <div>
          <h2 id="confirmation-title">{{ i18n.t(request.titleKey) }}</h2>
          <p id="confirmation-message">{{ i18n.t(request.messageKey) }}</p>
        </div>
        <div class="dialog-actions">
          <button #cancelButton type="button" class="secondary" (click)="close(false)">
            {{ i18n.t(request.cancelKey) }}
          </button>
          <button type="button" [class.danger]="request.tone === 'danger'" (click)="close(true)">
            {{ i18n.t(request.confirmKey) }}
          </button>
        </div>
      </section>
    </div>
  `,
  styles: `
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgb(10 18 25 / 62%);
      backdrop-filter: blur(3px);
    }
    .dialog-card {
      width: min(28rem, 100%);
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.9rem;
      padding: 1.15rem;
      border: 1px solid var(--surface-strong);
      border-radius: 1rem;
      background: var(--surface-elevated);
      color: var(--ink);
      box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 30%);
    }
    .dialog-icon {
      width: 2.3rem;
      height: 2.3rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: color-mix(in srgb, var(--accent) 18%, var(--surface));
      color: var(--accent);
      font-size: 1.15rem;
      font-weight: 800;
    }
    .dialog-icon.danger {
      color: var(--danger);
      background: color-mix(in srgb, var(--danger) 14%, var(--surface));
    }
    h2 {
      margin: 0;
      font-size: 1.08rem;
    }
    p {
      margin: 0.4rem 0 0;
      color: var(--muted);
      line-height: 1.5;
    }
    .dialog-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 0.55rem;
      margin-top: 0.25rem;
    }
    button {
      min-width: 6.5rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.55rem;
      padding: 0.58rem 0.85rem;
      background: color-mix(in srgb, var(--accent) 18%, var(--surface));
      color: var(--ink);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    button.secondary {
      background: var(--surface);
    }
    button.danger {
      border-color: color-mix(in srgb, var(--danger) 55%, var(--surface-strong));
      background: var(--danger);
      color: #fff;
    }
  `
})
export class ConfirmationDialogComponent {
  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;
  private returnFocusTo: HTMLElement | null = null;

  constructor(
    public readonly confirmation: ConfirmationService,
    public readonly i18n: I18nService
  ) {}

  ngAfterViewChecked(): void {
    if (this.confirmation.request() && !this.returnFocusTo) {
      this.returnFocusTo = document.activeElement as HTMLElement | null;
      this.cancelButton?.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  cancelFromKeyboard(): void {
    if (this.confirmation.request()) {
      this.close(false);
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  trapFocus(event: KeyboardEvent): void {
    if (!this.confirmation.request()) {
      return;
    }
    const focusable = Array.from(this.dialog?.nativeElement.querySelectorAll<HTMLButtonElement>('button') ?? []);
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  close(confirmed: boolean): void {
    const returnFocusTo = this.returnFocusTo;
    this.returnFocusTo = null;
    this.confirmation.resolve(confirmed);
    window.requestAnimationFrame(() => returnFocusTo?.focus());
  }
}
