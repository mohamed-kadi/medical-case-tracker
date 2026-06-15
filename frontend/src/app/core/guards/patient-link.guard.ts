import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

const PATIENT_LINK_ROLES = new Set(['ADMIN', 'FRONT_DESK']);

export const patientLinkGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const role = authService.getCurrentRole();
  if (PATIENT_LINK_ROLES.has(role)) {
    return true;
  }

  if (role === 'PATIENT') {
    return router.createUrlTree(['/patient-portal']);
  }

  return router.createUrlTree(['/dashboard']);
};
