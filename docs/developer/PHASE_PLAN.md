# Phase Plan

## Phase 1 - Frontend Enterprise Foundation

Status: In progress

- Angular workspace scaffolded in `frontend/`
- Auth shell implemented (`/login`, `/register`, `/dashboard`)
- Route protection enabled for dashboard
- JWT and `Accept-Language` interceptors integrated
- English/French UI dictionary and language switcher implemented

## Phase 2 - Test and Contract Foundation

Status: In progress

- Establish stable test runtime (`test` profile with H2)
- Maintain backend controller/service tests for auth and business flows
- Maintain frontend unit tests for auth and language services
- Define API contract hardening path (DTOs, input/output separation)
- Keep bilingual i18n behavior validated (`en`, `fr`)

## Phase 3 - Security and Config Baseline

Status: In progress

- Harden endpoint authorization and role mapping
- Remove hardcoded secrets from source-controlled defaults (`JWT_SECRET` now env-driven in `dev`/`prod`)
- Enforce upload and identity safety controls
- Keep profile-based runtime configuration explicit

## Phase 4 - Data and Migration Reliability

Status: Deferred (frontend-first delivery)

- Introduce Flyway baseline after domain model freeze
- Define explicit indexes and constraints for growth paths
- Remove reliance on `ddl-auto=update` in production lifecycle
- Add sample seed strategy once data ownership rules are confirmed

## Phase 5 - Observability and Release Governance

Status: Planned

- Add metrics and health probes
- Add structured logs and trace identifiers
- Enforce CI quality gates for tests and docs
- Build release runbooks and incident response guidance
