import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { I18nService } from '../core/services/i18n.service';
import { LanguageService, SupportedLanguage } from '../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="switcher-label" for="language-switcher">{{ i18n.t('language.label') }}</label>
    <select
      id="language-switcher"
      class="switcher-select"
      [value]="languageService.getCurrentLanguage()"
      (change)="onLanguageChange($event)"
    >
      <option value="en">{{ i18n.t('language.en') }}</option>
      <option value="fr">{{ i18n.t('language.fr') }}</option>
    </select>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .switcher-label {
      font-size: 0.85rem;
      color: var(--muted);
    }

    .switcher-select {
      border: 1px solid var(--surface-strong);
      background: var(--surface);
      color: var(--ink);
      border-radius: 0.5rem;
      padding: 0.35rem 0.5rem;
      font-size: 0.9rem;
    }
  `
})
export class LanguageSwitcherComponent {
  constructor(
    public readonly i18n: I18nService,
    public readonly languageService: LanguageService
  ) {}

  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.languageService.setLanguage(target.value as SupportedLanguage);
  }
}
