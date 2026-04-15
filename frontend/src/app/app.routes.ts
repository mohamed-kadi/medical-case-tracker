import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { clinicalGuard } from './core/guards/clinical.guard';
import { guestGuard } from './core/guards/guest.guard';
import { internalGuard } from './core/guards/internal.guard';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { PatientPortalPageComponent } from './features/auth/patient-portal-page.component';
import { RegisterPageComponent } from './features/auth/register-page.component';
import { PatientsPageComponent } from './features/patients/patients-page.component';
import { PatientFormPageComponent } from './features/patients/patient-form-page.component';
import { AdminUsersPageComponent } from './features/admin/admin-users-page.component';
import { AdminAuditPageComponent } from './features/admin/admin-audit-page.component';
import { PatientCasesPageComponent } from './features/cases/patient-cases-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    component: RegisterPageComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    canActivate: [internalGuard]
  },
  {
    path: 'patients',
    component: PatientsPageComponent,
    canActivate: [clinicalGuard]
  },
  {
    path: 'patients/new',
    component: PatientFormPageComponent,
    canActivate: [clinicalGuard]
  },
  {
    path: 'patients/:id/edit',
    component: PatientFormPageComponent,
    canActivate: [clinicalGuard]
  },
  {
    path: 'patients/:id/cases',
    component: PatientCasesPageComponent,
    canActivate: [clinicalGuard]
  },
  {
    path: 'admin/users',
    component: AdminUsersPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/audit',
    component: AdminAuditPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'patient-portal',
    component: PatientPortalPageComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
