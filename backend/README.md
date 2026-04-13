# Backend (Spring Boot)

Spring Boot API for Medical Case Tracker.

## Environment Setup (Recommended)

From repository root:

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env` with local values (especially `JWT_SECRET`).

`backend/.env` is intentionally ignored by git and must never be committed.

## Run

From repository root:

```bash
set -a; source backend/.env; set +a
cd backend && ./mvnw spring-boot:run
```

## Required Environment Variables

- `JWT_SECRET` (required in `dev` and `prod`; `test` uses test config)
- `DB_URL` (optional in `dev`, default: `jdbc:postgresql://localhost:5432/medicaltracker`)
- `DB_USERNAME` (optional in `dev`, default: `postgres`)
- `DB_PASSWORD` (optional in `dev`, default: `postgres`)

## Local PostgreSQL Bootstrap (Dev)

If `medicaltracker` does not exist:

```bash
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE medicaltracker OWNER postgres;"
```

## CI/Deploy Secrets

- Local development: keep secrets in `backend/.env` (gitignored).
- GitHub Actions/deploy: configure repository/environment secrets in GitHub, do not store secrets in repo files.

## Build and Test

```bash
cd backend && ./mvnw -q -DskipTests compile
cd backend && ./mvnw -q test
```
