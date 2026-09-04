# Backend (Spring Boot)

Spring Boot API for Medical Case Tracker.

## Environment Setup (Recommended)

From repository root:

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env` with local values (especially `JWT_SECRET`).

`backend/.env` is intentionally ignored by git and must never be committed.

Recommended local dev values in `.env.example`:

- `DB_URL=jdbc:postgresql://localhost:5432/medicaltracker`
- `DB_USERNAME=medical_user`
- `DB_PASSWORD=medical_password`

Meaning of those values:

- `medicaltracker` is the database name.
- `medical_user` is the PostgreSQL login role used by the backend.
- `postgres` is best used as the admin/bootstrap role, not the app runtime user.

## Required Environment Variables

- `JWT_SECRET` (required in `dev` and `prod`; `test` uses test config)
- `DB_URL` (required in `dev` and `prod`)
- `DB_USERNAME` (required in `dev` and `prod`)
- `DB_PASSWORD` (required in `dev` and `prod`)
- `APP_BOOTSTRAP_ADMIN_ENABLED` (optional, default: `false`)
- `APP_BOOTSTRAP_ADMIN_USERNAME` (required only when bootstrap enabled)
- `APP_BOOTSTRAP_ADMIN_EMAIL` (required only when bootstrap enabled)
- `APP_BOOTSTRAP_ADMIN_PASSWORD` (required only when bootstrap enabled)
- `APP_IMAGE_STORAGE_PATH` (optional, default: `./var/medical-images`)
- `APP_BACKUP_STORAGE_PATH` (optional, default: `./var/backups`)
- `APP_BACKUP_PG_DUMP_COMMAND` (optional, default: `pg_dump`)
- `APP_BACKUP_PSQL_COMMAND` (optional, default: `psql`)

Backup/restore requires PostgreSQL command-line tools:

- `pg_dump` must be available to create backups.
- `psql` must be available to restore backups.
- If they are installed outside the system `PATH`, point `APP_BACKUP_PG_DUMP_COMMAND` and `APP_BACKUP_PSQL_COMMAND` to the correct executables.

## Schema Migrations

The backend uses Flyway for PostgreSQL schema changes in `dev` and `prod`.

Migration files:

- `src/main/resources/db/migration/V1__create_current_schema.sql`
- `src/main/resources/db/migration/V2__adopt_existing_hibernate_schema.sql`

Runtime behavior:

- Flyway runs automatically before Hibernate validation.
- Existing local databases without Flyway history are baselined, then the compatibility migration runs.
- Hibernate uses `ddl-auto=validate` in `dev` and `prod`; it should not silently create or change tables.
- The `test` profile disables Flyway and keeps H2 `create-drop` for fast repeatable tests.

Operational rule:

- Before running a new migration against real clinic data, create and download a backup ZIP from `/admin/backups`.
- Do not edit production/offline clinic tables manually in pgAdmin unless you also document the equivalent migration.

## Local PostgreSQL Bootstrap (Dev)

Use this only for first-time DB setup (or after DB reset/credential change).
If your database is already configured, skip this step.

From repository root:

```bash
PG_SUPERUSER=postgres \
APP_DB_NAME=medicaltracker \
APP_DB_USER=medical_user \
APP_DB_PASSWORD=medical_password \
./backend/scripts/bootstrap-postgres-dev.sh
```

Then keep the same username/password in `backend/.env` and pgAdmin.

## Daily Run

Use the command that matches your current directory.

If you are already inside `backend/`:

```bash
set -a; source .env; set +a
./mvnw spring-boot:run
```

If you are at the repository root:

```bash
set -a; source backend/.env; set +a
cd backend && ./mvnw spring-boot:run
```

Do not mix these paths:

- From the repo root, use `backend/.env`.
- From inside `backend/`, use `.env`.
- Running `source backend/.env` while already inside `backend/` looks for `backend/backend/.env`, which is wrong.

## CI/Deploy Secrets

- Local development: keep secrets in `backend/.env` (gitignored).
- GitHub Actions/deploy: configure repository/environment secrets in GitHub, do not store secrets in repo files.

## Admin Provisioning

- Public registration endpoint (`/api/auth/register`) creates `PATIENT` users only.
- Admin provisioning endpoint (`POST /api/admin/users`) allows admins to create `DOCTOR` and `FRONT_DESK` users.
- Admin assignment endpoint (`PATCH /api/admin/patients/{id}/assignment`) allows admins to assign/reassign doctor and front desk usernames on patients.

## Patient Registration Flow

- Patient creation records the logged-in creator as `registeredByUsername`; this is separate from the current doctor/front desk assignment.
- When a `FRONT_DESK` user creates a patient, the backend sets `assignedFrontDeskUsername` to that receptionist.
- If exactly one enabled doctor exists, the backend auto-assigns that doctor.
- If multiple enabled doctors exist, the patient remains without a doctor assignment until admin review.
- If no enabled doctors exist, the patient remains without a doctor assignment until a doctor exists and is assigned.

## Patient Directory API

- `GET /api/patients/page?page=0&size=25&query=...&status=ACTIVE`: role-scoped patient search and pagination.
- Page size is constrained to `1..100` and results use stable name sorting.
- The original non-paged endpoints remain available for bounded workflow lookups.

## Scheduling API

- `POST /api/appointments/patients/{patientId}`: create appointment for a patient.
- `GET /api/appointments/{id}`: read appointment with assignment-based access check.
- `GET /api/appointments/patients/{patientId}`: list appointments for a patient.
- `GET /api/appointments/upcoming?from=...&to=...`: list scheduled appointments filtered by role assignment and an optional bounded date range.
- `GET /api/appointments/upcoming/page?page=0&size=25&from=...`: paginated upcoming schedule.
- `PUT /api/appointments/{id}`: update appointment details.
- `PATCH /api/appointments/{id}/status`: update appointment status.
- `DELETE /api/appointments/{id}`: delete appointment.

Appointment response and validation rules:

- Responses include `patientId`, `patientNumber`, and `patientName` so clients do not need one patient request per row.
- Create and reschedule operations require a future time.
- A scheduled patient cannot occupy the same exact slot twice.
- Patients assigned to the same doctor cannot occupy the same exact doctor slot.
- The frontend uses status `CANCELLED` for normal cancellation so appointment history is retained.

## Patient Portal API

- `GET /api/patient-portal/dashboard`: read-only dashboard for `PATIENT` accounts.
- Portal access uses a verified `patient_account_links` record between the `users` account and the `patients` file.
- The portal returns patient number/profile summary, assigned doctor/front desk usernames, and upcoming scheduled appointments.
- The portal does not return clinical notes, medical history, cases, images, appointment notes, or audit data.
- Public patient registration creates a login account only; clinic staff must verify and link it before patient file data is exposed.
- Email/phone matching may be used as a staff search aid later, but the backend must only expose portal data through a `VERIFIED` link.

## Patient Account Link API

- `GET /api/patient-account-links/patient?patientNumber=...`: staff lookup for a clinic patient file and current verified link status.
- `GET /api/patient-account-links/accounts?query=...`: staff search for enabled `PATIENT` portal accounts by username/email.
- `POST /api/patient-account-links/verify`: staff action that creates or activates a `VERIFIED` link.
- Access is limited to `ADMIN` and `FRONT_DESK`.
- The current phase enforces one verified portal account per patient file and one verified patient file per portal account.

## Backup and Restore API

Admin route in the frontend:

- `/admin/backups`

Backend endpoints:

- `GET /api/admin/backups/status`: returns backup folder, image folder, required restore confirmation, and latest backup summary.
- `GET /api/admin/backups`: lists backup ZIP files in the configured backup folder.
- `POST /api/admin/backups`: creates a ZIP backup.
- `GET /api/admin/backups/{fileName}`: downloads one backup ZIP.
- `POST /api/admin/backups/restore`: restores from a multipart ZIP upload and requires confirmation value `RESTORE`.

Backup contents:

- `database.sql` generated with `pg_dump`
- `manifest.json`
- `medical-images/**` copied from `APP_IMAGE_STORAGE_PATH`

Restore safety behavior:

- Restore is destructive and replaces current database data plus local image files.
- The backend creates a pre-restore safety backup before applying the uploaded ZIP.
- After restore, `medical_images.path` values are rewritten to the current `APP_IMAGE_STORAGE_PATH`.
- Keep downloaded ZIP backups on external storage; the local backup folder alone is not enough if the clinic computer disk fails.

Bootstrap admin (optional):

- Set `APP_BOOTSTRAP_ADMIN_ENABLED=true` and provide bootstrap admin username/email/password.
- On startup, the app creates the first `ADMIN` only if no admin exists.
- After first startup, set `APP_BOOTSTRAP_ADMIN_ENABLED=false`.

## Build and Test

```bash
cd backend && ./mvnw -q -DskipTests compile
cd backend && ./mvnw -q test
```
