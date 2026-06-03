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
