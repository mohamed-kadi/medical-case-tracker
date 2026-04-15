import { TestBed } from '@angular/core/testing';

import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should restore saved language from localStorage', () => {
    localStorage.setItem('medicaltracker.language', 'fr');

    TestBed.configureTestingModule({});
    const service = TestBed.inject(LanguageService);

    expect(service.getCurrentLanguage()).toBe('fr');
  });

  it('should persist language changes', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(LanguageService);

    service.setLanguage('fr');

    expect(service.getCurrentLanguage()).toBe('fr');
    expect(localStorage.getItem('medicaltracker.language')).toBe('fr');
  });
});
