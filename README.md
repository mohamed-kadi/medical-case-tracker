# Medical Case Tracker

Medical Case Tracker is a bilingual clinic operations application for patient intake, scheduling, clinical cases, medical images, administrative workflows, and limited patient self-service.

## What Is Included

- Role-based workspaces for `ADMIN`, `DOCTOR`, `FRONT_DESK`, and `PATIENT`
- Patient directory with server-side search, status filtering, and pagination
- Patient registration, printable patient cards, assignments, and lifecycle management
- Appointment scheduling with patient identity, conflict checks, front-desk check-in, a doctor waiting queue, paginated lists, and an interactive calendar
- Doctor-only medical cases and protected image upload, preview, download, and deletion
- Verified patient-account linking and a privacy-limited patient portal
- Admin user provisioning, audit viewer, assignments, backup, and restore
- English and French UI, API messages, statuses, dates, and accessibility text
- Responsive navigation and mobile-friendly workflows

## Roles at a Glance

| Role | Primary responsibility |
| --- | --- |
| `ADMIN` | Clinic users, patient assignments, audit review, backup and restore |
| `DOCTOR` | Assigned patients, appointments, medical history, cases, and images |
| `FRONT_DESK` | Patient identity/contact intake, cards, portal linking, and appointments |
| `PATIENT` | Read-only access to a verified linked patient summary and upcoming appointments |

`ADMIN` currently means clinic administrator. A future tenant phase may split it into `SYSTEM_ADMIN` and `CLINIC_ADMIN`. See the [RBAC matrix](docs/developer/RBAC_MATRIX.md) for the authoritative access rules.

## Repository Layout

```text
backend/    Spring Boot API, persistence, security, migrations, and tests
frontend/   Angular application and component/service tests
docs/       Developer, operations, and bilingual user documentation
.github/    CI workflows
```

## Technology

- Backend: Java 17, Spring Boot 3.4, Spring Security/JWT, Spring Data JPA, Flyway
- Data: PostgreSQL for development/production and H2 for tests
- Frontend: Angular 19, TypeScript, standalone components, reactive forms
- Testing: JUnit/Mockito/MockMvc and Karma/Jasmine

## Quick Start

### Prerequisites

- Java 17
- PostgreSQL 14+
- Node 20+ and npm 10+
- `pg_dump` and `psql` if backup/restore will be used

### 1. Configure the backend

From the repository root:

```bash
cp backend/.env.example backend/.env
```

Set at least `JWT_SECRET`, `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in `backend/.env`. To create the recommended local database and role:

```bash
PG_SUPERUSER=postgres \
APP_DB_NAME=medicaltracker \
APP_DB_USER=medical_user \
APP_DB_PASSWORD=medical_password \
./backend/scripts/bootstrap-postgres-dev.sh
```

The helper is idempotent and does not erase existing application data. See the [backend guide](backend/README.md) for all environment variables, migrations, bootstrap-admin settings, and backup requirements.

### 2. Start the backend

```bash
set -a; source backend/.env; set +a
cd backend && ./mvnw spring-boot:run
```

The API starts at `http://localhost:8080`.

### 3. Start the frontend

In another terminal at the repository root:

```bash
cd frontend
npm install
npm run start
```

The application starts at `http://localhost:4200`.

If you use the repository-provided Node runtime, run frontend commands with:

```bash
export PATH="$(pwd)/.tools/node/bin:$PATH"
```

## Build and Test

```bash
./backend/mvnw -f backend/pom.xml -q test
PATH="$(pwd)/.tools/node/bin:$PATH" npm --prefix frontend run build -- --configuration development
PATH="$(pwd)/.tools/node/bin:$PATH" npm --prefix frontend run test -- --watch=false --browsers=ChromeHeadlessCI
```

CI runs the backend and frontend checks defined in `.github/workflows/ci.yml`.

## Main Application Routes

| Route | Purpose | Roles |
| --- | --- | --- |
| `/dashboard` | Role-specific operational overview | Internal roles |
| `/patients` | Searchable patient directory and doctor waiting queue | Internal roles |
| `/patients/new` | Patient registration | Doctor, front desk |
| `/patients/:id` | Patient card, history, appointments, and case summary | Authorized internal roles |
| `/patients/:id/edit` | Patient editing and status management | Doctor, front desk |
| `/patients/:id/cases` | Case and medical-image workspace | Doctor |
| `/appointments` | Appointment creation and paginated schedule | Doctor, front desk |
| `/patient-links` | Verify a portal account against a clinic file | Admin, front desk |
| `/admin/users` | Internal user provisioning | Admin |
| `/admin/assignments` | Patient responsibility assignments | Admin |
| `/admin/audit` | Audit-event viewer | Admin |
| `/admin/backups` | Backup and restore | Admin |
| `/patient-portal` | Limited linked-patient dashboard | Patient |

## Key API Areas

- Authentication: `/api/auth/**`
- Patients: `/api/patients/**`, including `/api/patients/page`
- Appointments: `/api/appointments/**`, including bounded `/upcoming`, paginated `/upcoming/page`, and role-scoped `/checked-in`
- Cases and images: `/api/cases/**`, `/api/images/**`
- Patient portal and account linking: `/api/patient-portal/**`, `/api/patient-account-links/**`
- Administration: `/api/admin/**`

Appointment responses include patient ID, patient number, and patient name. New or rescheduled appointments must be in the future and cannot duplicate a scheduled or checked-in slot for the patient or assigned doctor.

## Data and Security Notes

- Browser authentication tokens are stored in `sessionStorage` and are cleared centrally when a session expires.
- Public registration creates a portal login only; it never creates or exposes an official clinic patient file.
- Patient portal access requires an explicit `VERIFIED` account link.
- Front desk and admin patient views redact clinical fields; cases and images remain doctor-only.
- Destructive UI actions require confirmation. Backup restore additionally requires the typed value `RESTORE` and creates a safety backup first.
- Flyway manages development and production schema changes; Hibernate validates rather than mutates those schemas.
- Real `.env` files, credentials, and clinic data must never be committed.

## Documentation

Start with the [documentation hub](docs/README.md):

- [Backend run and operations guide](backend/README.md)
- [Frontend development guide](frontend/README.md)
- [Developer map](docs/developer/DEVELOPER_MAP.md)
- [Phase plan](docs/developer/PHASE_PLAN.md)
- [Testing strategy](docs/developer/TESTING_STRATEGY.md)
- [English user guide](docs/user/USER_GUIDE_EN.md)
- [Guide utilisateur en français](docs/user/GUIDE_UTILISATEUR_FR.md)

## License

MIT. See [LICENSE](LICENSE).
