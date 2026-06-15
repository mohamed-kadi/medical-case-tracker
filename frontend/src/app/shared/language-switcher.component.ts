import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { I18nService } from '../core/services/i18n.service';
import { LanguageService, SupportedLanguage } from '../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-switcher" role="group" [attr.aria-label]="i18n.t('language.label')">
      <span class="globe-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M3 12h18M12 3c2.4 2.4 3.6 5.4 3.6 9s-1.2 6.6-3.6 9M12 3c-2.4 2.4-3.6 5.4-3.6 9s1.2 6.6 3.6 9"></path>
        </svg>
      </span>
      <button
        type="button"
        class="language-flag"
        [class.active]="isCurrentLanguage('en')"
        [attr.aria-label]="i18n.t('language.en')"
        [attr.aria-pressed]="isCurrentLanguage('en')"
        (click)="setLanguage('en')"
      >
        <span aria-hidden="true">🇬🇧</span>
      </button>
      <button
        type="button"
        class="language-flag"
        [class.active]="isCurrentLanguage('fr')"
        [attr.aria-label]="i18n.t('language.fr')"
        [attr.aria-pressed]="isCurrentLanguage('fr')"
        (click)="setLanguage('fr')"
      >
        <span aria-hidden="true">🇫🇷</span>
      </button>
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
    }

    .language-switcher {
      display: inline-flex;
      align-items: center;
      gap: 0.22rem;
      border: 1px solid var(--surface-strong);
      border-radius: 999px;
      background: color-mix(in srgb, var(--surface) 86%, transparent);
      padding: 0.18rem;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, #ffffff 4%, transparent);
    }

    .globe-icon,
    .language-flag {
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
    }

    .globe-icon {
      color: var(--ink);
      background: color-mix(in srgb, var(--accent) 12%, transparent);
    }

    .globe-icon svg {
      width: 1.08rem;
      height: 1.08rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .language-flag {
      border: 1px solid transparent;
      background: transparent;
      color: var(--ink);
      cursor: pointer;
      font-size: 1.02rem;
      line-height: 1;
      transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
    }

    .language-flag:hover,
    .language-flag:focus-visible {
      border-color: color-mix(in srgb, var(--accent) 48%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 10%, var(--surface));
      outline: none;
      transform: translateY(-1px);
    }

    .language-flag.active {
      border-color: color-mix(in srgb, var(--accent) 58%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 18%, var(--surface));
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 12%, transparent);
    }
  `
})
export class LanguageSwitcherComponent {
  constructor(
    public readonly i18n: I18nService,
    public readonly languageService: LanguageService
  ) {}

  isCurrentLanguage(language: SupportedLanguage): boolean {
    return this.languageService.getCurrentLanguage() === language;
  }

  setLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
  }
}
