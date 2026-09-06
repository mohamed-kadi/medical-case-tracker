# Testing Strategy

## Goals

- Every functional change must include tests.
- Critical patient, case, prescription, image, and auth paths must always be covered.
- Test failures block merge.

## Test Layers

1. Unit tests
   - Scope: backend service logic, validators, utility methods
   - Tools: JUnit 5, Mockito
2. Web slice tests
   - Scope: controller request/response behavior, validation, status codes
   - Tools: `@WebMvcTest`, MockMvc
3. Frontend unit tests
   - Scope: auth service behavior, language selection behavior, app shell wiring
   - Tools: Karma, Jasmine, Angular TestBed
4. Integration tests
   - Scope: repository + security + application context wiring
   - Tools: `@SpringBootTest`, test profile, H2 or Testcontainers
5. End-to-end tests (frontend expansion phase)
   - Scope: full user workflow and localization
   - Tools: Playwright

## Mandatory Coverage Areas

- Role contract:
  - current role behavior (`ADMIN`, `DOCTOR`, `FRONT_DESK`, `PATIENT`) remains stable
  - future role split (`SYSTEM_ADMIN`, `CLINIC_ADMIN`) must ship with migration and compatibility tests
- Schema migrations:
  - every persistent model/table change must include a Flyway migration
  - dev/prod use Hibernate validation only, not automatic table updates
- Auth login/register:
  - validation errors
  - role restrictions
  - localized responses
- Frontend auth flow:
  - login page form validation
  - register page form validation
  - token persistence and logout behavior
  - centralized `401` session-expiration redirect
- Frontend language flow:
  - `en`/`fr` switch behavior
  - `Accept-Language` header propagation
- Localization resource integrity:
  - backend `messages_en.properties` and `messages_fr.properties` key parity
- Patient service:
  - happy path
  - not found path
  - conflict path
  - role-scoped search, status filtering, and pagination
- Appointment safety:
  - patient and assigned-doctor slot conflicts
  - past-date rejection
  - bounded calendar and paginated schedule queries
- Image service:
  - upload validation
  - path safety
  - deleted image access restrictions
- Prescription safety:
  - doctor-only and assignment-scoped access
  - structured draft validation and open-case restriction
  - immutable issued records, printable issued state, and reason-required voiding
  - patient/prescriber snapshots and lifecycle audit events
- Audit trail:
  - actor attribution from security context
  - key mutation events persisted for patient/case/prescription/image/appointment flows
  - admin audit endpoint returns filtered recent events
- Security:
  - public endpoints
  - protected endpoint role access
  - assignment-based data visibility isolation (doctor/staff)
  - interceptor header behavior (`Authorization`, `Accept-Language`)

## Runtime Profiles

- `dev`: PostgreSQL local development
- `test`: H2 in-memory for repeatable CI/local tests
- `prod`: externalized configuration only

Environment source policy:

- Local: `backend/.env` loaded into shell before starting backend
- Template: `backend/.env.example` committed for onboarding
- CI/Deploy: secrets from GitHub Secrets (never committed)

## CI Test Command Set

- `cd backend && ./mvnw -q -DskipTests compile`
- `cd backend && ./mvnw -q test`
- `PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run build -- --configuration development`
- `PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run test -- --watch=false --browsers=ChromeHeadlessCI`
- GitHub Actions workflow: `.github/workflows/ci.yml`

## Current Automated Checks (Implemented)

- Backend:
  - `AuthControllerTest` (`@WebMvcTest`) for auth validation, role restrictions, localized responses
  - `AdminUserControllerTest` (`@WebMvcTest`) for admin provisioning and internal-user directory role filtering/localized errors
  - `AdminPatientControllerTest` (`@WebMvcTest`) for admin patient assignment endpoint behavior
  - `AppointmentControllerTest` (`@WebMvcTest`) for scheduling endpoint request/response behavior
  - `PrescriptionControllerTest` (`@WebMvcTest`) for structured prescription responses and request validation
  - `AdminAuditControllerTest` (`@WebMvcTest`) for admin audit endpoint behavior and limit guardrails
  - `BootstrapAdminInitializerTest` for bootstrap admin creation/guardrails
  - `SecurityConfigIntegrationTest` (`@SpringBootTest`) for route access rules by role (including admin non-clinical restrictions)
  - `AssignmentAccessIntegrationTest` (`@SpringBootTest`) for doctor/staff patient, case, and appointment visibility boundaries
  - `LocalizationBundleConsistencyTest` for `en/fr` message-key synchronization
  - `PatientServiceImplTest` for service behavior, conflict paths, role-scoped assignment/search/pagination logic, and patient mutation audit emission
  - `AppointmentServiceImplTest` for scheduling conflicts, role-scoped upcoming/checked-in queues, valid visit transitions, and appointment mutation audit emission
  - `AuditEventServiceImplTest` for actor resolution and event persistence behavior
  - `MedicalCaseServiceImplTest` for atomic case detail/status updates and mutation audit event emission
  - `MedicalImageServiceImplTest` for image upload/delete audit event emission
  - `PrescriptionServiceImplTest` for draft, issue, immutability, void, case-state, and audit behavior
- Frontend:
  - `auth.service.spec.ts` for login/register/token behavior
  - `admin-user.service.spec.ts` for admin internal-user provisioning API calls
  - `patient.service.spec.ts` for paginated patient search/list, create/update, and assignment API calls
  - `appointment.service.spec.ts` for bounded/paginated upcoming and checked-in appointment API calls
  - `case.service.spec.ts` for patient case create/update/status API calls
  - `image.service.spec.ts` for case image list/upload/delete API calls
  - `prescription.service.spec.ts` for draft/history/issue/print/void API calls
  - `admin-users-page.component.spec.ts` for admin provisioning form and internal-user directory/search behavior
  - `admin-audit-page.component.spec.ts` for admin audit filter and loading/error behavior
  - `dashboard-page.component.spec.ts` for patient visibility, role-specific actions, and upcoming appointments rendering
  - `patients-page.component.spec.ts` for server-backed patient directory behavior and the doctor's checked-in waiting queue
  - `patient-form-page.component.spec.ts` for patient create/edit routes and active-status change confirmation
  - `patient-cases-page.component.spec.ts` for patient identity, case selection, atomic edit/status save, prescription drafting, and image upload behavior
  - `guest.guard.spec.ts`, `internal.guard.spec.ts`, `clinical.guard.spec.ts`, and `admin.guard.spec.ts` for role-based routing behavior
  - `login-page.component.spec.ts` for post-login role-based redirect behavior
  - `i18n.service.spec.ts` for translation behavior and dictionary key parity
  - `language.service.spec.ts` for language persistence
  - `auth.interceptor.spec.ts` for `Authorization` header rules and expired-session handling
  - `language.interceptor.spec.ts` for `Accept-Language` propagation

## Definition of Done (Testing)

- New code path has a test.
- Existing tests remain green.
- Edge case and error path are asserted.
- Docs update references test behavior where needed.
