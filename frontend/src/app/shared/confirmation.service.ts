import { Injectable } from '@angular/core';

import { I18nService } from '../core/services/i18n.service';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  constructor(private readonly i18n: I18nService) {}

  confirm(messageKey: string): boolean {
    return window.confirm(this.i18n.t(messageKey));
  }
}
