import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { LanguageService } from '../services/language.service';

export const languageInterceptor: HttpInterceptorFn = (request, next) => {
  const languageService = inject(LanguageService);
  const language = languageService.getCurrentLanguage();

  return next(
    request.clone({
      setHeaders: {
        'Accept-Language': language
      }
    })
  );
};
