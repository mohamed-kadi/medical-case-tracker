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
- Angular frontend with login/register, role-based routing, protected workspace, and limited patient portal dashboard
- Dashboard visualization for role-filtered patients and upcoming appointments
- Admin-only internal user management screen for `DOCTOR`/`FRONT_DESK` creation plus searchable role-filtered directory
- Dedicated Patients frontend workspace with directory/list view and separate create/edit form routes
- Patient case workspace route (`/patients/:id/cases`) for case lifecycle, image uploads, category filtering, preview, and download
- English/French localization across backend responses and frontend UI
- Developer and user documentation maps in `docs/`
- Flyway-backed PostgreSQL schema migrations for safer local/offline updates

## Role Model (Current vs Target)

Current behavior (implemented now):

- `ADMIN`: clinic administrator for one clinic workspace (user provisioning + assignments, non-clinical by default)
- `DOCTOR`: provider workflows for assigned patients, clinical cases, medical history, and images
- `FRONT_DESK`: intake and scheduling workflows for patient identity/contact details and appointments; clinical history, cases, and images are hidden; patient creation records the logged-in receptionist as the registrar
- `PATIENT`: limited read-only portal role for verified linked patient file, patient number, assigned contacts, and upcoming appointments

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
6. `PATIENT` accounts are redirected to `/patient-portal` for their limited read-only dashboard.

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

## Patient Card Flow

The patient card is the clinic-facing identifier for an official patient file.

- `FRONT_DESK` creates the patient file and gives the patient their patient number/card.
- The card is visible inside the patient workspace at `/patients/:id`.
- The card includes the patient number, full name, phone, birth date, assigned doctor, assigned front desk user, registrar, and file creation date when available.
- Printing from the card panel prints the card design, not the whole patient workspace.
- The card is not a patient portal account. It is only an identifier for the clinic file.
- Later online access should still use the verified patient account linking flow before exposing portal data.

## Offline-To-Online Patient Linking Flow

The clinic patient file is always the source of truth.

1. In offline/local clinic mode, `FRONT_DESK` creates the official `patients` file and gives the patient their patient number/card.
2. If the clinic later enables online access, the patient can create a `PATIENT` portal account from the public registration flow.
3. That online account does not automatically own or expose any clinic file.
4. The clinic verifies the patient using the patient number/card plus local identity checks.
5. Staff opens `/patient-links`, loads the patient by number, searches the patient portal account, and verifies the link.
6. After verification, the app creates a `patient_account_links` row between the `users` account and the `patients` file with status `VERIFIED`.
7. Only then does `/patient-portal` show the limited patient summary and upcoming appointments.

Important rule:

- Public self-registration creates a login account only. It must not create a second official clinic patient file.
- Email or phone matching can help staff search for likely matches, but it must not be treated as verification by itself.
- A `PENDING` or `REVOKED` link must show the unlinked portal state and expose no patient file data.

## Frontend UX Flow

- Signed-out: `login` / `register` pages only.
- Signed-in internal users (`ADMIN`/`DOCTOR`/`FRONT_DESK`): dashboard-first workspace, with patient management routed from workspace actions.
- Signed-in `PATIENT`: redirected to `/patient-portal`.
- Patient portal is read-only and exposes only the verified linked patient file summary, patient number, assigned doctor/front desk usernames, and upcoming scheduled appointments.
- Patient portal does not expose clinical notes, medical history, cases, images, appointment notes, or internal audit data.
- Patient accounts and patient files are separate records; `patient_account_links` is the bridge used after clinic verification.
- Patient account linking route (`/patient-links`) is limited to `ADMIN`/`FRONT_DESK`.
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
- Admin backup and restore:
  - Route: `/admin/backups`
  - Access: `ADMIN` only

## Backup And Restore Workflow

The backup feature is designed for the local/offline clinic deployment where the doctor owns the data on one clinic machine or local network.

What a backup contains:

- PostgreSQL database dump from the configured `DB_URL`
- Local medical image files from `APP_IMAGE_STORAGE_PATH`
- Backup manifest metadata inside the generated ZIP

Where backups are stored:

- `APP_BACKUP_STORAGE_PATH` controls the folder used by the backend.
- Default local value: `./var/backups` relative to the backend runtime directory.
- The admin can download backup ZIP files from `/admin/backups`.

Required PostgreSQL tools:

- `pg_dump` is required to create database backups.
- `psql` is required to restore database backups.
- If those commands are not available in the system `PATH`, set:
  - `APP_BACKUP_PG_DUMP_COMMAND`
  - `APP_BACKUP_PSQL_COMMAND`

Recommended clinic routine:

1. Create one backup before app updates or database changes.
2. Create one backup at the end of each clinic day.
3. Download/copy the ZIP to an external drive or trusted clinic NAS.
4. Test restore on a non-production machine before trusting the routine for real clinic data.

Restore behavior:

- Restore is admin-only.
- The admin must upload a backup ZIP and type `RESTORE`.
- Restore replaces the current database data and local image folder with the selected backup.
- Before restore, the backend creates a safety backup of the current state.
- After restore, image paths are rewritten for the current machine's configured image folder.

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

Flyway runs automatically when the backend starts in `dev` or `prod`.

### Prerequisites

- Java 17
- PostgreSQL 14+ running locally
- PostgreSQL command-line tools available locally (`pg_dump` and `psql`) for backup/restore
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
- optional backup settings: `APP_BACKUP_STORAGE_PATH`, `APP_BACKUP_PG_DUMP_COMMAND`, `APP_BACKUP_PSQL_COMMAND`

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

Schema migration behavior:

- Database schema changes live in `backend/src/main/resources/db/migration`.
- Flyway creates/updates tables before Hibernate validates the entity mapping.
- Existing local databases without Flyway history are baselined safely, then the compatibility migration runs.
- Hibernate is set to `validate` in `dev` and `prod`; it should not create production tables automatically.
- Before pulling/running migrations on real clinic data, create a backup ZIP from `/admin/backups`.

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
- `dev`/`prod` schema management: Flyway migrations + Hibernate validation
- `test` schema management: H2 create/drop for fast repeatable tests

Secrets policy:

- Commit only `.env.example` templates.
- Keep real `.env` files local and gitignored.
- Store CI/deploy secrets in GitHub Secrets.
- Optional first-admin bootstrap is controlled by `APP_BOOTSTRAP_ADMIN_*` env vars.

Main config files:

- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-dev.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/src/main/resources/db/migration/V1__create_current_schema.sql`
- `backend/src/main/resources/db/migration/V2__adopt_existing_hibernate_schema.sql`
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
  - `GET /api/admin/backups/status` (clinic-admin only; backup configuration and latest backup summary)
  - `GET /api/admin/backups` (clinic-admin only; lists backup ZIP files)
  - `POST /api/admin/backups` (clinic-admin only; creates a backup ZIP)
  - `GET /api/admin/backups/{fileName}` (clinic-admin only; downloads a backup ZIP)
  - `POST /api/admin/backups/restore` (clinic-admin only; restores from uploaded backup ZIP with `RESTORE` confirmation)
- Patients:
  - `GET /api/patients`
  - `GET /api/patients/{id}`
  - `POST /api/patients`
  - `PUT /api/patients/{id}`
  - `PATCH /api/patients/{id}/status`
  - `DELETE /api/patients/{id}`
- Patient portal:
  - `GET /api/patient-portal/dashboard` (`PATIENT` only; read-only verified linked patient summary and upcoming appointments)
- Patient account links:
  - `GET /api/patient-account-links/patient?patientNumber=...` (`ADMIN`/`FRONT_DESK`; loads clinic patient summary and current verified link status)
  - `GET /api/patient-account-links/accounts?query=...` (`ADMIN`/`FRONT_DESK`; searches enabled patient portal accounts)
  - `POST /api/patient-account-links/verify` (`ADMIN`/`FRONT_DESK`; activates a verified account-to-file link)
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
