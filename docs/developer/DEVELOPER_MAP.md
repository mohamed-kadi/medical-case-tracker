# Developer Map

## Project Purpose

Medical Case Tracker is an enterprise application for patient management, case tracking, and medical image handling with JWT security and bilingual support.

## Current Architecture

- Backend API layer: `backend/src/main/java/com/doctorapp/medicaltracker/controller`
- Backend service layer: `backend/src/main/java/com/doctorapp/medicaltracker/service`
- Domain model: `backend/src/main/java/com/doctorapp/medicaltracker/model`
- Data access: `backend/src/main/java/com/doctorapp/medicaltracker/repository`
- Security: `backend/src/main/java/com/doctorapp/medicaltracker/security`
- Backend exception handling: `backend/src/main/java/com/doctorapp/medicaltracker/exception`
- Backend configuration: `backend/src/main/resources/application*.properties`
- Backend i18n: `backend/src/main/resources/i18n/messages_*.properties`
- Frontend application: `frontend/src/app`
- Frontend environment config: `frontend/src/environments`
- Frontend tests: `frontend/src/**/*.spec.ts`
- Backend tests: `backend/src/test/java`, `backend/src/test/resources`

## Frontend Module Map

- App shell and routes: `frontend/src/app/app.component.*`, `frontend/src/app/app.routes.ts`
- Auth feature pages: `frontend/src/app/features/auth`
- Dashboard page: `frontend/src/app/features/dashboard`
- Security and HTTP flow: `frontend/src/app/core/interceptors`, `frontend/src/app/core/guards`
- Auth/token services: `frontend/src/app/core/services/auth.service.ts`, `frontend/src/app/core/services/token-storage.service.ts`
- UI localization: `frontend/src/app/core/services/language.service.ts`, `frontend/src/app/core/services/i18n.service.ts`
- Shared language selector: `frontend/src/app/shared/language-switcher.component.ts`

## Quality Anchors

- Backend auth/web tests: `backend/src/test/java/com/doctorapp/medicaltracker/controller/AuthControllerTest.java`
- Backend security integration tests: `backend/src/test/java/com/doctorapp/medicaltracker/security/SecurityConfigIntegrationTest.java`
- Backend i18n bundle parity test: `backend/src/test/java/com/doctorapp/medicaltracker/config/LocalizationBundleConsistencyTest.java`
- Frontend service tests: `frontend/src/app/core/services/*.spec.ts`
- Frontend interceptor tests: `frontend/src/app/core/interceptors/*.spec.ts`

## Branching and Delivery Flow

1. Create a feature branch from `main`.
2. Add or update tests with every code change.
3. Update docs in `docs/` in the same branch.
4. Run local checks:
   - `cd backend && ./mvnw -q -DskipTests compile`
   - `cd backend && ./mvnw -q test`
   - `PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run build -- --configuration development`
   - `PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run test -- --watch=false --browsers=ChromeHeadlessCI`
5. Open PR with:
   - functional summary
   - risk list
   - test evidence
   - docs updated list

## Frontend Direction (Enterprise Track)

- Framework: Angular 19 + TypeScript
- Workspace tooling: Angular CLI now, Nx adoption in later scaling phase
- UI system: shared design tokens first, component library second
- State management: service/state signals now, ComponentStore/NgRx when workflows expand
- API contracts: typed DTO client layer, OpenAPI generation when contracts stabilize
- i18n: project-level `en` and `fr` support is mandatory
- Testing: Karma/Jasmine now, Playwright for end-to-end in next phase

## Responsibility Map

- Backend team: API, business logic, data integrity, auth/security, migrations
- Frontend team: workflows, RBAC-aware UI, accessibility, localization UX
- QA team: regression, localization checks, auth/data protection tests
- DevOps team: CI/CD, secrets management, observability, deployment policy
