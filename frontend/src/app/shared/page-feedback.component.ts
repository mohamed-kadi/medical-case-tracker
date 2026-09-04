import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-feedback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="feedback success" *ngIf="success" role="status" aria-live="polite">{{ success }}</p>
    <p class="feedback error" *ngIf="error" role="alert">{{ error }}</p>
    <p class="loading" *ngIf="loading && loadingText" role="status">{{ loadingText }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.45rem;
    }
    :host:empty {
      display: none;
    }
    p {
      margin: 0;
    }
    .feedback {
      font-weight: 600;
    }
    .success {
      color: var(--success);
    }
    .error {
      color: var(--danger);
    }
    .loading {
      color: var(--muted);
    }
  `
})
export class PageFeedbackComponent {
  @Input() success = '';
  @Input() error = '';
  @Input() loading = false;
  @Input() loadingText = '';
}
