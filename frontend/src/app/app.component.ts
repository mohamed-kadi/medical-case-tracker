import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { Appointment } from './core/models/appointment.model';
import { AppointmentService } from './core/services/appointment.service';
import { I18nService } from './core/services/i18n.service';
import { LanguageSwitcherComponent } from './shared/language-switcher.component';

type InternalRole = 'ADMIN' | 'DOCTOR' | 'FRONT_DESK';

interface WorkspaceNavItem {
  labelKey: string;
  route: string;
  icon: string;
  prefixMatch?: boolean;
  roles: InternalRole[];
}

interface WorkspaceAction {
  labelKey: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, LanguageSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly workspaceNav: WorkspaceNavItem[] = [
    { labelKey: 'nav.dashboard', route: '/dashboard', icon: 'D', roles: ['ADMIN', 'DOCTOR', 'FRONT_DESK'] },
    { labelKey: 'nav.patients', route: '/patients', icon: 'P', prefixMatch: true, roles: ['DOCTOR', 'FRONT_DESK'] },
    { labelKey: 'nav.newPatient', route: '/patients/new', icon: '+', roles: ['DOCTOR', 'FRONT_DESK'] },
    { labelKey: 'nav.appointments', route: '/appointments', icon: 'A', roles: ['DOCTOR', 'FRONT_DESK'] },
    { labelKey: 'nav.patientLinks', route: '/patient-links', icon: 'V', roles: ['ADMIN', 'FRONT_DESK'] },
    { labelKey: 'nav.adminUsers', route: '/admin/users', icon: 'U', roles: ['ADMIN'] },
    { labelKey: 'nav.adminAssignments', route: '/admin/assignments', icon: 'S', roles: ['ADMIN'] },
    { labelKey: 'nav.adminAudit', route: '/admin/audit', icon: 'L', roles: ['ADMIN'] },
    { labelKey: 'nav.adminBackups', route: '/admin/backups', icon: 'B', roles: ['ADMIN'] }
  ];
  private readonly subscriptions = new Subscription();
  private agendaRequest: Subscription | null = null;

  agendaRange: 'TODAY' | 'WEEK' = 'WEEK';
  agendaItems: Appointment[] = [];
  agendaLoading = false;
  agendaError = '';

  constructor(
    private readonly authService: AuthService,
    private readonly appointmentService: AppointmentService,
    private readonly router: Router,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.refreshClinicalAgenda();
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => this.refreshClinicalAgenda())
    );
  }

  ngOnDestroy(): void {
    this.agendaRequest?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isAuthRoute(): boolean {
    const path = this.currentPath();
    return path === '/login' || path === '/register';
  }

  isWorkspaceLayout(): boolean {
    return this.isAuthenticated() && this.isInternalRole(this.currentRole());
  }

  isInternalRole(role: string): role is InternalRole {
    return role === 'ADMIN' || role === 'DOCTOR' || role === 'FRONT_DESK';
  }

  currentRole(): string {
    return this.authService.getCurrentRole();
  }

  currentUsername(): string {
    return this.authService.getCurrentUsername();
  }

  workspaceNavItems(): WorkspaceNavItem[] {
    const role = this.currentRole();
    if (!this.isInternalRole(role)) {
      return [];
    }
    return this.workspaceNav.filter((item) => item.roles.includes(role));
  }

  workspaceThemeClass(): string {
    const role = this.currentRole();
    if (role === 'ADMIN') {
      return 'role-admin';
    }
    if (role === 'DOCTOR') {
      return 'role-doctor';
    }
    if (role === 'FRONT_DESK') {
      return 'role-front-desk';
    }
    return '';
  }

  contextTitleKey(): string {
    if (this.isAdminUsersRoute()) {
      return 'admin.users.title';
    }
    if (this.isAdminAssignmentsRoute()) {
      return 'admin.assignments.title';
    }
    if (this.isAdminAuditRoute()) {
      return 'admin.audit.title';
    }
    if (this.isAdminBackupsRoute()) {
      return 'admin.backups.title';
    }
    if (this.isPatientLinksRoute()) {
      return 'patientLinks.title';
    }
    if (this.isCasesRoute()) {
      return 'cases.title';
    }
    if (this.isAppointmentsRoute()) {
      return 'appointments.title';
    }
    if (this.isPatientWorkspaceRoute()) {
      return 'patientWorkspace.title';
    }
    if (this.isPatientFormRoute()) {
      return this.currentPath() === '/patients/new' ? 'patients.form.title.create' : 'patients.form.title.edit';
    }
    if (this.isPatientsRoute()) {
      return 'patients.title';
    }
    return this.dashboardTitleKey();
  }

  contextDescriptionKey(): string {
    if (this.isAdminUsersRoute()) {
      return 'admin.users.description';
    }
    if (this.isAdminAssignmentsRoute()) {
      return 'admin.assignments.description';
    }
    if (this.isAdminAuditRoute()) {
      return 'admin.audit.description';
    }
    if (this.isAdminBackupsRoute()) {
      return 'admin.backups.description';
    }
    if (this.isPatientLinksRoute()) {
      return 'patientLinks.description';
    }
    if (this.isCasesRoute()) {
      return 'cases.description';
    }
    if (this.isAppointmentsRoute()) {
      return 'appointments.description';
    }
    if (this.isPatientWorkspaceRoute()) {
      return 'patientWorkspace.description';
    }
    if (this.isPatientFormRoute()) {
      return 'patients.form.helper';
    }
    if (this.isPatientsRoute()) {
      return 'patients.description';
    }
    return this.dashboardDescriptionKey();
  }

  contextActions(): WorkspaceAction[] {
    const path = this.currentPath();
    const role = this.currentRole();
    if (!this.isInternalRole(role)) {
      return [];
    }

    if (role === 'ADMIN') {
      const actions: WorkspaceAction[] = [
        { labelKey: 'nav.dashboard', route: '/dashboard' },
        { labelKey: 'nav.patientLinks', route: '/patient-links' },
        { labelKey: 'nav.adminUsers', route: '/admin/users' },
        { labelKey: 'nav.adminAssignments', route: '/admin/assignments' },
        { labelKey: 'nav.adminAudit', route: '/admin/audit' },
        { labelKey: 'nav.adminBackups', route: '/admin/backups' }
      ];
      return actions.filter((action) => action.route !== path);
    }

    const clinicalActions: WorkspaceAction[] = [
      { labelKey: 'nav.dashboard', route: '/dashboard' },
      { labelKey: 'nav.patients', route: '/patients' },
      { labelKey: 'nav.appointments', route: '/appointments' },
      { labelKey: 'nav.patientLinks', route: '/patient-links' },
      { labelKey: 'nav.newPatient', route: '/patients/new' }
    ];
    return clinicalActions.filter((action) => action.route !== path);
  }

  showClinicalAgenda(): boolean {
    const role = this.currentRole();
    return this.isAuthenticated() && (role === 'DOCTOR' || role === 'FRONT_DESK');
  }

  showContextActions(): boolean {
    return !this.showClinicalAgenda() && this.contextActions().length > 0;
  }

  onAgendaRangeChange(value: string): void {
    if (value !== 'TODAY' && value !== 'WEEK') {
      return;
    }
    this.agendaRange = value;
    this.refreshClinicalAgenda();
  }

  isRoutePrefix(prefix: string): boolean {
    const path = this.currentPath();
    if (path !== prefix && !path.startsWith(`${prefix}/`)) {
      return false;
    }

    return !this.workspaceNav.some((item) => item.route !== prefix && item.route === path);
  }

  isRoute(route: string): boolean {
    return this.currentPath() === route;
  }

  isDashboardRoute(): boolean {
    return this.currentPath() === '/dashboard';
  }

  sidebarRoleLabel(): string {
    const role = this.currentRole();
    return role.length > 0 ? role : 'UNKNOWN';
  }

  sidebarRoleLabelKey(): string {
    const role = this.currentRole();
    if (role === 'ADMIN') {
      return 'roles.admin';
    }
    if (role === 'DOCTOR') {
      return 'roles.doctor';
    }
    if (role === 'FRONT_DESK') {
      return 'roles.frontDesk';
    }
    return 'roles.unknown';
  }

  roleInitial(): string {
    const role = this.currentRole();
    if (role === 'ADMIN') {
      return 'A';
    }
    if (role === 'DOCTOR') {
      return 'D';
    }
    if (role === 'FRONT_DESK') {
      return 'F';
    }
    return '?';
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  private dashboardTitleKey(): string {
    const role = this.currentRole();
    if (role === 'ADMIN') {
      return 'dashboard.title.admin';
    }
    if (role === 'DOCTOR') {
      return 'dashboard.title.doctor';
    }
    if (role === 'FRONT_DESK') {
      return 'dashboard.title.frontDesk';
    }
    return 'dashboard.title';
  }

  private dashboardDescriptionKey(): string {
    const role = this.currentRole();
    if (role === 'ADMIN') {
      return 'dashboard.description.admin';
    }
    if (role === 'DOCTOR') {
      return 'dashboard.description.doctor';
    }
    if (role === 'FRONT_DESK') {
      return 'dashboard.description.frontDesk';
    }
    return 'dashboard.description';
  }

  private isPatientsRoute(): boolean {
    return this.currentPath() === '/patients';
  }

  private isPatientFormRoute(): boolean {
    const path = this.currentPath();
    return path === '/patients/new' || /^\/patients\/\d+\/edit$/.test(path);
  }

  private isPatientWorkspaceRoute(): boolean {
    return /^\/patients\/\d+$/.test(this.currentPath());
  }

  private isCasesRoute(): boolean {
    return /^\/patients\/\d+\/cases$/.test(this.currentPath());
  }

  private isAppointmentsRoute(): boolean {
    return this.currentPath() === '/appointments';
  }

  private isAdminUsersRoute(): boolean {
    return this.currentPath() === '/admin/users';
  }

  private isAdminAssignmentsRoute(): boolean {
    return this.currentPath() === '/admin/assignments';
  }

  private isAdminAuditRoute(): boolean {
    return this.currentPath() === '/admin/audit';
  }

  private isAdminBackupsRoute(): boolean {
    return this.currentPath() === '/admin/backups';
  }

  private isPatientLinksRoute(): boolean {
    return this.currentPath() === '/patient-links';
  }

  private currentPath(): string {
    return this.router.url.split('?')[0].split('#')[0];
  }

  private refreshClinicalAgenda(): void {
    if (!this.showClinicalAgenda()) {
      this.agendaItems = [];
      this.agendaLoading = false;
      this.agendaError = '';
      this.agendaRequest?.unsubscribe();
      this.agendaRequest = null;
      return;
    }

    this.agendaLoading = true;
    this.agendaError = '';
    const from = this.agendaRange === 'TODAY' ? this.startOfToday() : new Date();

    this.agendaRequest?.unsubscribe();
    this.agendaRequest = this.appointmentService.getUpcomingAppointments(this.toLocalDateTime(from)).subscribe({
      next: (appointments) => {
        this.agendaItems = appointments.slice(0, 8);
        this.agendaLoading = false;
      },
      error: (error: unknown) => {
        this.agendaLoading = false;
        this.agendaError = this.resolveErrorMessage(error, 'shell.agenda.error');
      }
    });
  }

  private resolveErrorMessage(error: unknown, fallbackKey: string): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;
      if (payload && typeof payload === 'object') {
        const objectPayload = payload as Record<string, unknown>;
        if (typeof objectPayload['error'] === 'string' && objectPayload['error'].trim().length > 0) {
          return objectPayload['error'];
        }
        if (typeof objectPayload['message'] === 'string' && objectPayload['message'].trim().length > 0) {
          return objectPayload['message'];
        }
      }
      if (typeof payload === 'string' && payload.trim().length > 0) {
        return payload;
      }
    }
    return this.i18n.t(fallbackKey);
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  }

  private toLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}
