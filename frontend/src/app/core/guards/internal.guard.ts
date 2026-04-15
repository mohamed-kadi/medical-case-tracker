import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

const CLINIC_ROLES = new Set(['ADMIN', 'DOCTOR', 'STAFF']);

export const internalGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (CLINIC_ROLES.has(authService.getCurrentRole())) {
    return true;
  }

  return router.createUrlTree(['/patient-portal']);
};
