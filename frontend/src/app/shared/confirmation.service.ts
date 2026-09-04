import { Injectable, signal } from '@angular/core';

export interface ConfirmationRequest {
  titleKey: string;
  messageKey: string;
  confirmKey: string;
  cancelKey: string;
  tone: 'default' | 'danger';
}

export interface ConfirmationOptions {
  titleKey?: string;
  confirmKey?: string;
  cancelKey?: string;
  tone?: 'default' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly activeRequest = signal<ConfirmationRequest | null>(null);
  private pendingResolution: ((confirmed: boolean) => void) | null = null;
  readonly request = this.activeRequest.asReadonly();

  confirm(messageKey: string, options: ConfirmationOptions = {}): Promise<boolean> {
    this.resolve(false);
    this.activeRequest.set({
      titleKey: options.titleKey ?? 'confirmation.title',
      messageKey,
      confirmKey: options.confirmKey ?? 'confirmation.confirm',
      cancelKey: options.cancelKey ?? 'confirmation.cancel',
      tone: options.tone ?? 'default'
    });
    return new Promise<boolean>((resolve) => {
      this.pendingResolution = resolve;
    });
  }

  resolve(confirmed: boolean): void {
    this.pendingResolution?.(confirmed);
    this.pendingResolution = null;
    this.activeRequest.set(null);
  }
}
