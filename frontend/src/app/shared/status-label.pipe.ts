import { Pipe, PipeTransform } from '@angular/core';

import { I18nService } from '../core/services/i18n.service';

export type StatusDomain = 'appointments' | 'cases' | 'patients';

@Pipe({
  name: 'statusLabel',
  standalone: true,
  pure: false
})
export class StatusLabelPipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(status: string | null | undefined, domain: StatusDomain): string {
    if (!status) {
      return '-';
    }
    const key = `${domain}.status.${status}`;
    const translated = this.i18n.t(key);
    return translated === key ? status : translated;
  }
}
