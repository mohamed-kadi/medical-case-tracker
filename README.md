# Medical Case Tracker

Enterprise-oriented platform for patient records, medical cases, and medical image workflows.

## Repository Structure

- `backend/` - Spring Boot API (Maven project root)
- `frontend/` - Angular application
- `docs/` - developer and user documentation

## Current Scope

- Spring Boot backend API with JWT authentication and role-based access controls
- Angular frontend shell (login, register, protected dashboard)
- English/French localization across backend responses and frontend UI
- Developer and user documentation maps in `docs/`
- Frontend-first delivery while Flyway migrations are intentionally deferred

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

1. Start backend API (dev profile):

```bash
export JWT_SECRET="$(openssl rand -base64 64)"
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE medicaltracker OWNER postgres;" # run once if missing
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

2. Start frontend (from repository root):

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

- `dev` profile: local PostgreSQL defaults from env or fallback values (`postgres` / `postgres`)
- `test` profile: in-memory H2 for repeatable tests
- `prod` profile: strict externalized DB configuration

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

## License

MIT. See `LICENSE`.
