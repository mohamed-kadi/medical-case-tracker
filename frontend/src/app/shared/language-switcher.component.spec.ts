import { TestBed } from '@angular/core/testing';

import { I18nService } from '../core/services/i18n.service';
import { LanguageService } from '../core/services/language.service';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;
  let languageServiceSpy: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    languageServiceSpy = jasmine.createSpyObj<LanguageService>('LanguageService', [
      'getCurrentLanguage',
      'setLanguage'
    ]);

    i18nServiceSpy.t.and.callFake((key: string) => key);
    languageServiceSpy.getCurrentLanguage.and.returnValue('en');

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [
        { provide: I18nService, useValue: i18nServiceSpy },
        { provide: LanguageService, useValue: languageServiceSpy }
      ]
    }).compileComponents();
  });

  it('renders a compact globe and flag language control without a text select', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const flags = element.querySelectorAll('.language-flag');

    expect(element.querySelector('select')).toBeNull();
    expect(element.querySelector('.globe-icon svg')).not.toBeNull();
    expect(flags.length).toBe(2);
    expect(element.textContent).toContain('🇬🇧');
    expect(element.textContent).toContain('🇫🇷');
    expect(element.textContent).not.toContain('language.label');
  });

  it('changes language when a flag is selected', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.language-flag') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();

    expect(languageServiceSpy.setLanguage).toHaveBeenCalledOnceWith('fr');
  });

  it('marks the current language flag as active', () => {
    languageServiceSpy.getCurrentLanguage.and.returnValue('fr');

    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.language-flag') as NodeListOf<HTMLButtonElement>;

    expect(buttons[0].classList.contains('active')).toBeFalse();
    expect(buttons[1].classList.contains('active')).toBeTrue();
  });
});
