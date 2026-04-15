import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

const CLINICAL_ROLES = new Set(['DOCTOR', 'STAFF']);

export const clinicalGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const role = authService.getCurrentRole();
  if (CLINICAL_ROLES.has(role)) {
    return true;
  }

  if (role === 'PATIENT') {
    return router.createUrlTree(['/patient-portal']);
  }

  return router.createUrlTree(['/dashboard']);
};
