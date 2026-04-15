import { Injectable, signal } from '@angular/core';

export type SupportedLanguage = 'en' | 'fr';

const LANGUAGE_STORAGE_KEY = 'medicaltracker.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly currentLanguageSignal = signal<SupportedLanguage>(this.resolveInitialLanguage());
  readonly language = this.currentLanguageSignal.asReadonly();

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguageSignal();
  }

  setLanguage(language: SupportedLanguage): void {
    this.currentLanguageSignal.set(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  private resolveInitialLanguage(): SupportedLanguage {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage === 'en' || storedLanguage === 'fr') {
      return storedLanguage;
    }

    if (navigator.language.toLowerCase().startsWith('fr')) {
      return 'fr';
    }

    return 'en';
  }
}
