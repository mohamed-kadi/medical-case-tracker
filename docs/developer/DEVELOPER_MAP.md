# Developer Map

## Project Purpose

Medical Case Tracker is a secure full-stack clinic operations platform for patient management, case tracking, imaging workflows, and scheduling with JWT security and bilingual support.

## Canonical Product Description

- One platform, one codebase, multiple deployment modes.
- Internal clinic workflows are the current primary product.
- Patient portal is limited/read-only in the current phase.
- Specialty support is template-driven on top of shared core modules.
- Deployment targets:
  - on-premise clinic deployment
  - hosted single-tenant deployment
  - multi-tenant SaaS deployment (planned tenant layer)

## Role Semantics (Must Stay Explicit)

Current code contract:

- `ADMIN` means clinic admin (not platform/system admin), scoped to management workflows by default
- `DOCTOR` and `FRONT_DESK` are internal users
- `PATIENT` is a limited read-only portal user
- `registeredByUsername` records who created a patient folder; it is not the same as `assignedFrontDeskUsername`, which represents current front desk responsibility
- Detailed capability matrix: `docs/developer/RBAC_MATRIX.md`

Patient registration contract:

- `FRONT_DESK` patient creation must always record the authenticated receptionist as `registeredByUsername`.
- `FRONT_DESK` patient creation must set `assignedFrontDeskUsername` to the authenticated receptionist.
- If exactly one enabled doctor exists, `FRONT_DESK` patient creation auto-assigns that doctor.
- If zero or multiple enabled doctors exist, doctor assignment stays blank for admin review.

Target contract (future phase):

- `SYSTEM_ADMIN` for platform operations
- `CLINIC_ADMIN` for clinic-local operations
- current `ADMIN` will be migrated to `CLINIC_ADMIN` with backward-compatible migration rules

## Current Architecture

- Backend API layer: `backend/src/main/java/com/doctorapp/medicaltracker/controller`
- Backend service layer: `backend/src/main/java/com/doctorapp/medicaltracker/service`
- Domain model: `backend/src/main/java/com/doctorapp/medicaltracker/model`
- Data access: `backend/src/main/java/com/doctorapp/medicaltracker/repository`
- Security: `backend/src/main/java/com/doctorapp/medicaltracker/security`
- Backend exception handling: `backend/src/main/java/com/doctorapp/medicaltracker/exception`
- Backend configuration: `backend/src/main/resources/application*.properties`
- Backend schema migrations: `backend/src/main/resources/db/migration`
- Backend i18n: `backend/src/main/resources/i18n/messages_*.properties`
- Frontend application: `frontend/src/app`
- Frontend environment config: `frontend/src/environments`
- Frontend tests: `frontend/src/**/*.spec.ts`
- Backend tests: `backend/src/test/java`, `backend/src/test/resources`

## Frontend Module Map

- App shell and routes: `frontend/src/app/app.component.*`, `frontend/src/app/app.routes.ts`
- Auth feature pages: `frontend/src/app/features/auth`
- Admin user provisioning page: `frontend/src/app/features/admin/admin-users-page.component.ts`
- Admin audit page: `frontend/src/app/features/admin/admin-audit-page.component.ts`
- Admin backup/restore page: `frontend/src/app/features/admin/admin-backups-page.component.ts`
- Patient portal page: `frontend/src/app/features/auth/patient-portal-page.component.ts`
- Dashboard page: `frontend/src/app/features/dashboard`
- Patients directory page: `frontend/src/app/features/patients/patients-page.component.ts`
- Patient form page (create/edit routes): `frontend/src/app/features/patients/patient-form-page.component.ts`
- Patient case workspace page: `frontend/src/app/features/cases/patient-cases-page.component.ts`
- Appointment scheduler and paginated schedule: `frontend/src/app/features/appointments/appointments-page.component.ts`
- Security and HTTP flow: `frontend/src/app/core/interceptors`, `frontend/src/app/core/guards`
- Route access guards:
  - `authGuard` protects workspace routes
  - `guestGuard` redirects authenticated users away from auth screens
  - `internalGuard` restricts clinic workspace routes to `ADMIN/DOCTOR/FRONT_DESK`
  - `clinicalGuard` restricts clinical workspace routes to `DOCTOR/FRONT_DESK`
  - `adminGuard` restricts admin provisioning route to `ADMIN` only
  - `patientGuard` restricts `/patient-portal` to `PATIENT` only
- Auth/token services: `frontend/src/app/core/services/auth.service.ts`, `frontend/src/app/core/services/token-storage.service.ts`
- Auth tokens must stay in `sessionStorage` so local offline workstations do not share an admin/doctor/front-desk login across every browser window on the same `localhost` origin.
- Patient portal API: `backend/src/main/java/com/doctorapp/medicaltracker/controller/PatientPortalController.java`
- Patient account link model: `backend/src/main/java/com/doctorapp/medicaltracker/model/PatientAccountLink.java`
- Patient account link API: `backend/src/main/java/com/doctorapp/medicaltracker/controller/PatientAccountLinkController.java`
- Patient account link service: `backend/src/main/java/com/doctorapp/medicaltracker/service/impl/PatientAccountLinkServiceImpl.java`
- Backup API: `backend/src/main/java/com/doctorapp/medicaltracker/controller/AdminBackupController.java`
- Backup service: `backend/src/main/java/com/doctorapp/medicaltracker/service/impl/BackupServiceImpl.java`
- Patient portal frontend service: `frontend/src/app/core/services/patient-portal.service.ts`
- Admin backup frontend service: `frontend/src/app/core/services/admin-backup.service.ts`
- Patient and appointment API services: `frontend/src/app/core/services/patient.service.ts`, `frontend/src/app/core/services/appointment.service.ts`
- Case and image API services: `frontend/src/app/core/services/case.service.ts`, `frontend/src/app/core/services/image.service.ts`
- UI localization: `frontend/src/app/core/services/language.service.ts`, `frontend/src/app/core/services/i18n.service.ts`
- Shared language selector: `frontend/src/app/shared/language-switcher.component.ts`
- Shared UI primitives: localized-date/status pipes, page feedback component, and confirmation service in `frontend/src/app/shared`

## Scheduling and Directory Contracts

- Patient directory queries use `GET /api/patients/page` for role-scoped search, status filtering, and bounded pagination.
- Full upcoming schedules use `GET /api/appointments/upcoming/page`; the shell calendar uses a bounded `from`/`to` request for the visible month.
- Front desk changes an arrival to `CHECKED_IN`; the doctor Patients page reads the role-scoped `GET /api/appointments/checked-in` queue and completes the visit there.
- Appointment DTOs carry patient identity (`patientId`, patient number, and display name) to avoid client-side N+1 lookups.
- Appointment create/reschedule operations reject past times and exact scheduled/checked-in slot conflicts for the patient or assigned doctor.
- The patient workspace summarizes appointment history but delegates appointment creation to `/appointments?patientId=...`.
- Normal UI removal changes appointment status to `CANCELLED`; the delete endpoint remains an explicit API operation.
- Expired API sessions are handled centrally by the auth interceptor and redirected to sign-in with an expiry reason.

## Quality Anchors

- Backend auth/web tests: `backend/src/test/java/com/doctorapp/medicaltracker/controller/AuthControllerTest.java`
- Backend admin audit test: `backend/src/test/java/com/doctorapp/medicaltracker/controller/AdminAuditControllerTest.java`
- Backend admin backup test: `backend/src/test/java/com/doctorapp/medicaltracker/controller/AdminBackupControllerTest.java`
- Backend security integration tests: `backend/src/test/java/com/doctorapp/medicaltracker/security/SecurityConfigIntegrationTest.java`
- Backend i18n bundle parity test: `backend/src/test/java/com/doctorapp/medicaltracker/config/LocalizationBundleConsistencyTest.java`
- Backend audit/service tests: `backend/src/test/java/com/doctorapp/medicaltracker/service/AuditEventServiceImplTest.java`, `backend/src/test/java/com/doctorapp/medicaltracker/service/MedicalCaseServiceImplTest.java`, `backend/src/test/java/com/doctorapp/medicaltracker/service/MedicalImageServiceImplTest.java`
- Frontend audit service test: `frontend/src/app/core/services/audit.service.spec.ts`
- Frontend service tests: `frontend/src/app/core/services/*.spec.ts`
- Frontend page/component tests: `frontend/src/app/features/**/*.spec.ts`
- Frontend interceptor tests: `frontend/src/app/core/interceptors/*.spec.ts`

## Environment and Secrets

- Example backend env template: `backend/.env.example`
- Local secrets file: `backend/.env` (gitignored, never committed)
- Runtime configuration still resolves via Spring environment variables from `application*.properties`
- CI/deploy secrets must be stored in GitHub Secrets, not repo files
- Backup/restore runtime settings: `APP_BACKUP_STORAGE_PATH`, `APP_BACKUP_PG_DUMP_COMMAND`, `APP_BACKUP_PSQL_COMMAND`
- Schema changes must ship as Flyway migrations; Hibernate is validation-only in `dev`/`prod`.

## Branching and Delivery Flow

1. Create a feature branch from `main`.
2. Add or update tests with every code change.
3. Update docs in `docs/` in the same branch.
4. Run local checks:
   - `cd backend && ./mvnw -q -DskipTests compile`
   - `cd backend && ./mvnw -q test`
   - `PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run build -- --configuration development`
   - `PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run test -- --watch=false --browsers=ChromeHeadlessCI`
5. Open PR with:
   - functional summary
   - risk list
   - test evidence
   - docs updated list

## Frontend Direction (Enterprise Track)

- Framework: Angular 19 + TypeScript
- Workspace tooling: Angular CLI now, Nx adoption in later scaling phase
- UI system: shared design tokens first, component library second
- State management: service/state signals now, ComponentStore/NgRx when workflows expand
- API contracts: typed DTO client layer, OpenAPI generation when contracts stabilize
- i18n: project-level `en` and `fr` support is mandatory
- Testing: Karma/Jasmine now, Playwright for end-to-end in next phase

## Responsibility Map

- Backend team: API, business logic, data integrity, auth/security, migrations
- Frontend team: workflows, RBAC-aware UI, accessibility, localization UX
- QA team: regression, localization checks, auth/data protection tests
- DevOps team: CI/CD, secrets management, observability, deployment policy
