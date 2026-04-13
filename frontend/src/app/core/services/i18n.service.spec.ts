import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';
import { LanguageService } from './language.service';

describe('I18nService', () => {
  let service: I18nService;
  let languageService: LanguageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});

    service = TestBed.inject(I18nService);
    languageService = TestBed.inject(LanguageService);
  });

  it('returns English translations by default', () => {
    expect(service.t('nav.login')).toBe('Login');
  });

  it('returns French translations after switching language', () => {
    languageService.setLanguage('fr');

    expect(service.t('nav.login')).toBe('Connexion');
  });

  it('falls back to key for unknown translations', () => {
    expect(service.t('unknown.translation.key')).toBe('unknown.translation.key');
  });

  it('keeps English and French dictionaries in key sync', () => {
    const dictionaries = (service as any)['dictionaries'] as Record<string, Record<string, string>>;
    const englishKeys = Object.keys(dictionaries['en']).sort();
    const frenchKeys = Object.keys(dictionaries['fr']).sort();

    expect(frenchKeys).toEqual(englishKeys);
  });
});
