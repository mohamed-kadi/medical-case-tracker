# Medical Case Tracker

Secure full-stack clinic operations platform for patient records, medical cases, medical images, and scheduling workflows.

## Product Positioning (Updated)

- One product, one codebase.
- Internal clinic workflows first (`ADMIN`, `DOCTOR`, `FRONT_DESK`) with optional patient portal expansion.
- Deployment-ready for three business models without rebuild:
  - Clinic on-premise
  - Single-tenant hosted
  - Multi-tenant SaaS (target phase, tenant layer to be added)
- Specialty packs are templates on top of the same core platform (dermatology first, then aesthetic/wound-care).

## Repository Structure

- `.github/workflows/` - CI automation
- `backend/` - Spring Boot API and database-facing application logic
- `frontend/` - Angular application
- `docs/` - developer and user documentation

Suggested mental model:

- Keep application code isolated in `backend/` and `frontend/`.
- Keep deployment and automation concerns isolated in `.github/`.
- Keep docs isolated in `docs/`.

## Implemented Scope (Spec v1 Baseline)

- Spring Boot backend API with JWT authentication and role-based access controls
- Angular frontend with login/register, role-based routing, protected workspace, and patient portal holding page
- Dashboard visualization for role-filtered patients and upcoming appointments
- Admin-only internal user management screen for `DOCTOR`/`FRONT_DESK` creation plus searchable role-filtered directory
- Dedicated Patients frontend workspace with directory/list view and separate create/edit form routes
- Patient case workspace route (`/patients/:id/cases`) for case lifecycle, image uploads, category filtering, preview, and download
- English/French localization across backend responses and frontend UI
- Developer and user documentation maps in `docs/`
- Frontend-first delivery while Flyway migrations are intentionally deferred

## Role Model (Current vs Target)

Current behavior (implemented now):

- `ADMIN`: clinic administrator for one clinic workspace (user provisioning + assignments, non-clinical by default)
- `DOCTOR`: provider workflows for assigned patients, clinical cases, medical history, and images
- `FRONT_DESK`: intake and scheduling workflows for patient identity/contact details and appointments; clinical history, cases, and images are hidden; patient creation records the logged-in receptionist as the registrar
- `PATIENT`: limited/placeholder portal role (future expansion)

Target model (planned, not yet implemented):

- `SYSTEM_ADMIN`: platform/operator role (SaaS operations, tenant lifecycle)
- `CLINIC_ADMIN`: clinic-local admin role (today's `ADMIN` semantics)
- `DOCTOR`, `FRONT_DESK`, `PATIENT`: unchanged functional meaning

Migration note:

- Until tenant architecture is introduced, treat `ADMIN` as `CLINIC_ADMIN`.
- Full capability matrix: `docs/developer/RBAC_MATRIX.md`

## V1 Practical Workflow

1. `ADMIN` logs in and provisions internal users (`DOCTOR`/`FRONT_DESK`) from `/admin/users`.
2. `ADMIN` assigns or reassigns patients to doctors and front desk users from `/admin/assignments`.
3. `FRONT_DESK` creates patient folders, records identity/contact details, schedules appointments, and shares the patient number/card.
4. `DOCTOR` manages assigned patients, medical history, cases, images, and clinical follow-up.
5. Public `/register` remains patient-only and does not create internal roles.
6. `PATIENT` accounts are redirected to `/patient-portal` placeholder in this phase.

## Patient Registration Flow

Registration and assignment are separate. This rule is important for clinics with one doctor and multiple receptionists.

- `registeredByUsername` records the user who created the patient folder and is treated as historical traceability.
- `assignedFrontDeskUsername` records the current receptionist responsible for follow-up and can be changed by an admin.
- When a `FRONT_DESK` user creates a patient, the backend automatically sets `registeredByUsername` to that receptionist.
- The backend also sets `assignedFrontDeskUsername` to that same receptionist so the patient remains linked to the person who performed intake.
- If there is exactly one enabled doctor, the backend auto-assigns that doctor.
- If there are multiple enabled doctors, the patient remains without a doctor assignment until an `ADMIN` reviews `/admin/assignments`.
- If there are zero enabled doctors, the patient also remains without a doctor assignment until a doctor is created and assigned.

| Clinic state during front desk intake | Backend result |
| --- | --- |
| One enabled doctor | Patient is registered by the receptionist, assigned to that receptionist, and auto-assigned to the only doctor. |
| Multiple enabled doctors | Patient is registered by the receptionist and assigned to that receptionist; doctor is left blank for admin review. |
| Zero enabled doctors | Patient is registered by the receptionist and assigned to that receptionist; doctor is left blank until a doctor exists. |

## Frontend UX Flow

- Signed-out: `login` / `register` pages only.
- Signed-in internal users (`ADMIN`/`DOCTOR`/`FRONT_DESK`): dashboard-first workspace, with patient management routed from workspace actions.
- Signed-in `PATIENT`: redirected to `/patient-portal`.
- Patient intake and scheduling routes (`/patients`, `/patients/new`, `/patients/:id/edit`, `/appointments`) are limited to `DOCTOR`/`FRONT_DESK`.
- Clinical case route (`/patients/:id/cases`) is doctor-only.
- Auth tokens are stored in browser `sessionStorage`, not `localStorage`; signing in on one tab/window should not automatically sign in a separate browser tab/window.
- Language preference may persist across windows because it is not sensitive.
- Patient creation/editing is separated from list browsing:
  - Directory: `/patients`
  - Create: `/patients/new`
  - Edit: `/patients/:id/edit`
  - Cases: `/patients/:id/cases` (`DOCTOR` only)
- Admin team provisioning:
  - Route: `/admin/users`
  - Access: `ADMIN` only
- Admin patient assignments:
  - Route: `/admin/assignments`
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

## Setup and Run

Flyway is not required for the current phase.

### Prerequisites

- Java 17
- PostgreSQL 14+ running locally
- Node 20+ and npm 10+

Notes:

- The backend targets Java 17.
- The frontend uses Angular 19 and requires Node 18.19+ at minimum; use Node 20+ to match CI and avoid version drift.
- If you use the repo-provided Node runtime, prefix frontend commands with `PATH="$(pwd)/.tools/node/bin:$PATH"`.

### First-Time Setup (once per machine)

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and set:

- `JWT_SECRET`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Recommended local dev values in `backend/.env.example` are:

- `DB_URL=jdbc:postgresql://localhost:5432/medicaltracker`
- `DB_USERNAME=medical_user`
- `DB_PASSWORD=medical_password`

Meaning of those values:

- `medicaltracker` is the database name.
- `medical_user` is the PostgreSQL login role the backend uses to connect to that database.
- `postgres` should be treated as the admin/bootstrap role, not the app runtime user.

If your Postgres role/database are not already created, run this once (and keep user/password identical to `backend/.env`):

```bash
PG_SUPERUSER=postgres APP_DB_NAME=medicaltracker APP_DB_USER=medical_user APP_DB_PASSWORD=medical_password ./backend/scripts/bootstrap-postgres-dev.sh
```

If your Postgres is already set up, skip that bootstrap step.

Bootstrap behavior:

- Idempotent setup helper for creating missing role/database.
- It does not wipe existing tables/data by default.

Dev database compatibility:

- The dev backend checks PostgreSQL on startup and repairs the local `users.role` constraint if an older database still only allows the previous staff role name.
- If creating a `FRONT_DESK` internal user fails with `users_role_check`, restart the backend once so the dev compatibility check can update the constraint.

### Start The Backend

Use the command that matches your current directory.

If you are at the repository root:

```bash
set -a; source backend/.env; set +a
cd backend && ./mvnw spring-boot:run
```

If you are already inside `backend/`:

```bash
set -a; source .env; set +a
./mvnw spring-boot:run
```

Do not mix these paths:

- From the repo root, use `backend/.env`.
- From inside `backend/`, use `.env`.
- Running `source backend/.env` while already inside `backend/` looks for `backend/backend/.env`, which is wrong.

Backend default URL:

- `http://localhost:8080`

### Start The Frontend

Open a second terminal at the repository root and run:

```bash
cd frontend && npm install
npm run start
```

If you want to use the repo-provided Node runtime instead of a system Node install:

```bash
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm install
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run start
```

Frontend default URL:

- `http://localhost:4200`

### Daily Run Summary

1. Start PostgreSQL.
2. Start the backend on `http://localhost:8080`.
3. Start the frontend on `http://localhost:4200`.
4. Open `http://localhost:4200` in your browser.

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
  - `GET /api/admin/users` (clinic-admin only; lists internal users, optional `?role=DOCTOR|FRONT_DESK|ALL`)
  - `POST /api/admin/users` (clinic-admin only; creates `DOCTOR`/`FRONT_DESK`)
  - `PATCH /api/admin/patients/{id}/assignment` (clinic-admin only; used by `/admin/assignments` to assign DOCTOR/FRONT_DESK usernames)
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
  - `GET /api/appointments/upcoming` (returns `SCHEDULED` appointments only)
  - `PUT /api/appointments/{id}`
  - `PATCH /api/appointments/{id}/status` (JSON body: `{ "status": "CANCELLED|COMPLETED|NO_SHOW|SCHEDULED" }`)
  - `DELETE /api/appointments/{id}`

Role constraints for appointments:

- Appointment APIs are accessible to `DOCTOR` and `FRONT_DESK` only.
- `ADMIN` is restricted to management workflows (`/api/admin/**`).

Role constraints for clinical APIs:

- `GET /api/patients/**`: `ADMIN`/`DOCTOR`/`FRONT_DESK`
- write patient routes + appointments: `DOCTOR`/`FRONT_DESK`
- cases + images: `DOCTOR` only

## License

MIT. See `LICENSE`.
