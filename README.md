# Medical Case Tracker

Secure full-stack clinic operations platform for patient records, medical cases, medical images, and scheduling workflows.

## Product Positioning (Updated)

- One product, one codebase.
- Internal clinic workflows first (`ADMIN`, `DOCTOR`, `STAFF`) with optional patient portal expansion.
- Deployment-ready for three business models without rebuild:
  - Clinic on-premise
  - Single-tenant hosted
  - Multi-tenant SaaS (target phase, tenant layer to be added)
- Specialty packs are templates on top of the same core platform (dermatology first, then aesthetic/wound-care).

## Repository Structure

- `backend/` - Spring Boot API (Maven project root)
- `frontend/` - Angular application
- `docs/` - developer and user documentation

## Implemented Scope (Spec v1 Baseline)

- Spring Boot backend API with JWT authentication and role-based access controls
- Angular frontend with login/register, role-based routing, protected workspace, and patient portal holding page
- Dashboard visualization for role-filtered patients and upcoming appointments
- Admin-only internal user management screen for `DOCTOR`/`STAFF` creation plus searchable role-filtered directory
- Dedicated Patients frontend workspace with directory/list view and separate create/edit form routes
- Patient case workspace route (`/patients/:id/cases`) for case lifecycle, image uploads, category filtering, preview, and download
- English/French localization across backend responses and frontend UI
- Developer and user documentation maps in `docs/`
- Frontend-first delivery while Flyway migrations are intentionally deferred

## Role Model (Current vs Target)

Current behavior (implemented now):

- `ADMIN`: clinic administrator for one clinic workspace (user provisioning + assignments, non-clinical by default)
- `DOCTOR`: provider workflows for assigned patients/cases
- `STAFF`: operational workflows for assigned patients/cases
- `PATIENT`: limited/placeholder portal role (future expansion)

Target model (planned, not yet implemented):

- `SYSTEM_ADMIN`: platform/operator role (SaaS operations, tenant lifecycle)
- `CLINIC_ADMIN`: clinic-local admin role (today's `ADMIN` semantics)
- `DOCTOR`, `STAFF`, `PATIENT`: unchanged functional meaning

Migration note:

- Until tenant architecture is introduced, treat `ADMIN` as `CLINIC_ADMIN`.
- Full capability matrix: `docs/developer/RBAC_MATRIX.md`

## V1 Practical Workflow

1. `ADMIN` logs in and provisions internal users (`DOCTOR`/`STAFF`) from `/admin/users`.
2. `ADMIN` assigns patients to doctor/staff using assignment endpoints.
3. `DOCTOR`/`STAFF` run clinical operations:
   - patient CRUD
   - case management
   - image workflows
   - appointment workflows
4. Public `/register` remains patient-only and does not create internal roles.
5. `PATIENT` accounts are redirected to `/patient-portal` placeholder in this phase.

## Frontend UX Flow

- Signed-out: `login` / `register` pages only.
- Signed-in internal users (`ADMIN`/`DOCTOR`/`STAFF`): dashboard-first workspace, with patient management routed from workspace actions.
- Signed-in `PATIENT`: redirected to `/patient-portal`.
- Clinical workspace routes (`/patients`, `/patients/new`, `/patients/:id/edit`) are limited to `DOCTOR`/`STAFF`.
- Patient creation/editing is separated from list browsing:
  - Directory: `/patients`
  - Create: `/patients/new`
  - Edit: `/patients/:id/edit`
  - Cases: `/patients/:id/cases`
- Admin team provisioning:
  - Route: `/admin/users`
  - Access: `ADMIN` only

## Technology Stack

### Backend

- Java 17
- Spring Boot 3.4.x
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL (dev/prod), H2 (test profile)
- Maven Wrapper (`backend/mvnw`)

### Frontend

- Angular 19 + TypeScript (standalone components)
- Angular Router + route guard
- HTTP interceptors for JWT and `Accept-Language`
- Reactive Forms
- Karma/Jasmine unit tests

## Frontend-First Quick Start

Flyway is not required for the current phase.

### First-Time Setup (once per machine)

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and set:

- `JWT_SECRET`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Default values in `backend/.env.example` are:

- `DB_URL=jdbc:postgresql://localhost:5432/medicaltracker`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=postgres`

If your Postgres role/database are not already created, run this once (and keep user/password identical to `backend/.env`):

```bash
PG_SUPERUSER=postgres APP_DB_NAME=medicaltracker APP_DB_USER=postgres APP_DB_PASSWORD=postgres ./backend/scripts/bootstrap-postgres-dev.sh
```

If your Postgres is already set up, skip that bootstrap step.

Bootstrap behavior:

- Idempotent setup helper for creating missing role/database.
- It does not wipe existing tables/data by default.

### Daily Run

From repository root:

```bash
set -a; source backend/.env; set +a
cd backend && ./mvnw spring-boot:run
```

If you are already inside `backend/`:

```bash
set -a; source .env; set +a
./mvnw spring-boot:run
```

Start frontend (from repository root):

```bash
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run start
```

If you use a system-wide Node installation (Node 20+), `PATH=...` is not needed.

## Localization

- Supported languages: English (`en`) and French (`fr`)
- Frontend language switcher persists the chosen language
- Backend localization is driven by `Accept-Language` header
- Backend bundles:
  - `backend/src/main/resources/i18n/messages_en.properties`
  - `backend/src/main/resources/i18n/messages_fr.properties`
- Frontend dictionary:
  - `frontend/src/app/core/services/i18n.service.ts`

## Profiles and Runtime Configuration

- `dev` profile: local PostgreSQL, values must come from environment (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`)
- `test` profile: in-memory H2 for repeatable tests
- `prod` profile: strict externalized DB configuration

Secrets policy:

- Commit only `.env.example` templates.
- Keep real `.env` files local and gitignored.
- Store CI/deploy secrets in GitHub Secrets.
- Optional first-admin bootstrap is controlled by `APP_BOOTSTRAP_ADMIN_*` env vars.

Main config files:

- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-dev.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/src/test/resources/application-test.properties`

## Build and Test

Backend:

```bash
cd backend && ./mvnw -q -DskipTests compile
cd backend && ./mvnw -q test
```

Frontend:

```bash
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run build -- --configuration development
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run test -- --watch=false --browsers=ChromeHeadlessCI
```

## Documentation Map

- Central hub: `docs/README.md`
- Developer map: `docs/developer/DEVELOPER_MAP.md`
- Phase plan: `docs/developer/PHASE_PLAN.md`
- Testing strategy: `docs/developer/TESTING_STRATEGY.md`
- Documentation checklist: `docs/developer/DOCUMENTATION_CHECKLIST.md`
- User guide (EN): `docs/user/USER_GUIDE_EN.md`
- User guide (FR): `docs/user/GUIDE_UTILISATEUR_FR.md`
- Support map: `docs/user/SUPPORT_MAP.md`

## Core API Endpoints

- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- Admin:
  - `GET /api/admin/users` (clinic-admin only; lists internal users, optional `?role=DOCTOR|STAFF|ALL`)
  - `POST /api/admin/users` (clinic-admin only; creates `DOCTOR`/`STAFF`)
  - `PATCH /api/admin/patients/{id}/assignment` (clinic-admin only; assigns DOCTOR/STAFF usernames)
- Patients:
  - `GET /api/patients`
  - `GET /api/patients/{id}`
  - `POST /api/patients`
  - `PUT /api/patients/{id}`
  - `PATCH /api/patients/{id}/status`
  - `DELETE /api/patients/{id}`
- Cases:
  - `POST /api/cases/patients/{patientId}`
  - `GET /api/cases/{id}`
  - `GET /api/cases/patients/{patientId}`
  - `PUT /api/cases/{id}`
  - `PATCH /api/cases/{id}/status`
  - `DELETE /api/cases/{id}`
- Images:
  - `POST /api/images/upload`
  - `GET /api/images/{id}`
  - `GET /api/images/download/{id}`
  - `GET /api/images/case/{caseId}`
  - `DELETE /api/images/{id}`
- Appointments:
  - `POST /api/appointments/patients/{patientId}`
  - `GET /api/appointments/{id}`
  - `GET /api/appointments/patients/{patientId}`
  - `GET /api/appointments/upcoming`
  - `PUT /api/appointments/{id}`
  - `PATCH /api/appointments/{id}/status`
  - `DELETE /api/appointments/{id}`

Role constraints for appointments:

- Appointment APIs are accessible to `DOCTOR` and `STAFF` only.
- `ADMIN` is restricted to management workflows (`/api/admin/**`).

Role constraints for clinical APIs:

- `GET /api/patients/**`: `ADMIN`/`DOCTOR`/`STAFF`
- write patient routes + cases + images + appointments: `DOCTOR`/`STAFF` only

## License

MIT. See `LICENSE`.
