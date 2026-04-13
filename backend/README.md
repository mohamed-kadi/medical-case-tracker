# Backend (Spring Boot)

Spring Boot API for Medical Case Tracker.

## Run

From repository root:

```bash
cd backend
export JWT_SECRET="$(openssl rand -base64 64)"
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
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

## Build and Test

```bash
cd backend && ./mvnw -q -DskipTests compile
cd backend && ./mvnw -q test
```
