# Backend (Spring Boot)

Spring Boot API for Medical Case Tracker.

## Environment Setup (Recommended)

From repository root:

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env` with local values (especially `JWT_SECRET`).

`backend/.env` is intentionally ignored by git and must never be committed.

Default DB values in `.env.example`:

- `DB_URL=jdbc:postgresql://localhost:5432/medicaltracker`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=postgres`

## Required Environment Variables

- `JWT_SECRET` (required in `dev` and `prod`; `test` uses test config)
- `DB_URL` (required in `dev` and `prod`)
- `DB_USERNAME` (required in `dev` and `prod`)
- `DB_PASSWORD` (required in `dev` and `prod`)
- `APP_BOOTSTRAP_ADMIN_ENABLED` (optional, default: `false`)
- `APP_BOOTSTRAP_ADMIN_USERNAME` (required only when bootstrap enabled)
- `APP_BOOTSTRAP_ADMIN_EMAIL` (required only when bootstrap enabled)
- `APP_BOOTSTRAP_ADMIN_PASSWORD` (required only when bootstrap enabled)

## Local PostgreSQL Bootstrap (Dev)

Use this only for first-time DB setup (or after DB reset/credential change).
If your database is already configured, skip this step.

From repository root:

```bash
PG_SUPERUSER=postgres \
APP_DB_NAME=medicaltracker \
APP_DB_USER=postgres \
APP_DB_PASSWORD=postgres \
./backend/scripts/bootstrap-postgres-dev.sh
```

Then keep the same username/password in `backend/.env` and pgAdmin.

## Daily Run

From `backend/` directory:

```bash
set -a; source .env; set +a
./mvnw spring-boot:run
```

From repository root (equivalent):

```bash
set -a; source backend/.env; set +a
cd backend && ./mvnw spring-boot:run
```

## CI/Deploy Secrets

- Local development: keep secrets in `backend/.env` (gitignored).
- GitHub Actions/deploy: configure repository/environment secrets in GitHub, do not store secrets in repo files.

## Admin Provisioning

- Public registration endpoint (`/api/auth/register`) creates `PATIENT` users only.
- Admin provisioning endpoint (`POST /api/admin/users`) allows admins to create `DOCTOR` and `STAFF` users.
- Admin assignment endpoint (`PATCH /api/admin/patients/{id}/assignment`) allows admins to assign/reassign doctor and staff usernames on patients.

## Scheduling API (Phase 1)

- `POST /api/appointments/patients/{patientId}`: create appointment for a patient.
- `GET /api/appointments/{id}`: read appointment with assignment-based access check.
- `GET /api/appointments/patients/{patientId}`: list appointments for a patient.
- `GET /api/appointments/upcoming`: list upcoming appointments filtered by role assignment.
- `PUT /api/appointments/{id}`: update appointment details.
- `PATCH /api/appointments/{id}/status`: update appointment status.
- `DELETE /api/appointments/{id}`: delete appointment.

Bootstrap admin (optional):

- Set `APP_BOOTSTRAP_ADMIN_ENABLED=true` and provide bootstrap admin username/email/password.
- On startup, the app creates the first `ADMIN` only if no admin exists.
- After first startup, set `APP_BOOTSTRAP_ADMIN_ENABLED=false`.

## Build and Test

```bash
cd backend && ./mvnw -q -DskipTests compile
cd backend && ./mvnw -q test
```
