import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { clinicalGuard } from './core/guards/clinical.guard';
import { doctorGuard } from './core/guards/doctor.guard';
import { guestGuard } from './core/guards/guest.guard';
import { internalGuard } from './core/guards/internal.guard';
import { patientGuard } from './core/guards/patient.guard';
import { patientLinkGuard } from './core/guards/patient-link.guard';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { PatientPortalPageComponent } from './features/auth/patient-portal-page.component';
import { RegisterPageComponent } from './features/auth/register-page.component';
import { PatientsPageComponent } from './features/patients/patients-page.component';
import { PatientFormPageComponent } from './features/patients/patient-form-page.component';
import { PatientWorkspacePageComponent } from './features/patients/patient-workspace-page.component';
import { AdminUsersPageComponent } from './features/admin/admin-users-page.component';
import { AdminAuditPageComponent } from './features/admin/admin-audit-page.component';
import { AdminAssignmentsPageComponent } from './features/admin/admin-assignments-page.component';
import { AdminBackupsPageComponent } from './features/admin/admin-backups-page.component';
import { PatientCasesPageComponent } from './features/cases/patient-cases-page.component';
import { AppointmentsPageComponent } from './features/appointments/appointments-page.component';
import { PatientAccountLinksPageComponent } from './features/patient-links/patient-account-links-page.component';

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
    canActivate: [doctorGuard]
  },
  {
    path: 'patients/:id',
    component: PatientWorkspacePageComponent,
    canActivate: [clinicalGuard]
  },
  {
    path: 'appointments',
    component: AppointmentsPageComponent,
    canActivate: [clinicalGuard]
  },
  {
    path: 'patient-links',
    component: PatientAccountLinksPageComponent,
    canActivate: [patientLinkGuard]
  },
  {
    path: 'admin/users',
    component: AdminUsersPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/assignments',
    component: AdminAssignmentsPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/audit',
    component: AdminAuditPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/backups',
    component: AdminBackupsPageComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'patient-portal',
    component: PatientPortalPageComponent,
    canActivate: [patientGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
