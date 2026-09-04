import { Pipe, PipeTransform } from '@angular/core';

import { LanguageService } from '../core/services/language.service';

export type LocalizedDateStyle = 'short' | 'medium' | 'date' | 'time' | 'appointment';

@Pipe({
  name: 'localizedDate',
  standalone: true,
  pure: false
})
export class LocalizedDatePipe implements PipeTransform {
  constructor(private readonly languageService: LanguageService) {}

  transform(value: string | Date | null | undefined, style: LocalizedDateStyle = 'medium'): string {
    if (value == null || value === '') {
      return '-';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat(this.languageService.getCurrentLanguage(), this.options(style)).format(date);
  }

  private options(style: LocalizedDateStyle): Intl.DateTimeFormatOptions {
    switch (style) {
      case 'short':
        return { dateStyle: 'short', timeStyle: 'short' };
      case 'date':
        return { dateStyle: 'medium' };
      case 'time':
        return { timeStyle: 'short' };
      case 'appointment':
        return { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      default:
        return { dateStyle: 'medium', timeStyle: 'short' };
    }
  }
}
