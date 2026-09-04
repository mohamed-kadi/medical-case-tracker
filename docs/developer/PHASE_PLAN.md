# Phase Plan (Spec v1)

Aligned with:

- `docs/developer/PRODUCT_BUILD_MAP_MA.md`
- `docs/developer/DEVELOPER_MAP.md`

## Planning Rules

- Keep one platform and one codebase.
- Ship internal clinic value first, then expand.
- Do not rename roles in code without migration + tests + documentation in the same PR.

## Role Contract by Phase

Current implemented contract:

- `ADMIN` = clinic-level admin (not platform super-admin)
- `DOCTOR`, `FRONT_DESK` = internal clinical users
- `PATIENT` = limited read-only portal role

Target contract (future phase):

- `SYSTEM_ADMIN` for platform operations
- `CLINIC_ADMIN` for clinic-local administration
- Preserve `DOCTOR`, `FRONT_DESK`, `PATIENT`

## Phase 0 - Foundation Hardening

Status: Completed (except optional setup runbook polish)

- `.env` template and local secrets policy
- env-driven JWT secret
- admin provisioning endpoint
- optional first-admin bootstrap
- PostgreSQL dev bootstrap helper script
- Flyway baseline migrations with Hibernate validation in dev/prod
- CI for backend/frontend build and tests

Exit criteria:

- New machine can run backend/frontend and tests with docs only.

## Phase 1 - Internal Clinic MVP

Status: Feature-complete for the current pilot baseline; validation and pilot feedback remain

- RBAC-safe internal workflow for `ADMIN`/`DOCTOR`/`FRONT_DESK`
- Patient CRUD with assignment visibility boundaries
- Case and image flows with service-layer access checks
- Safe appointment creation, paginated schedules, and interactive dashboard calendar
- Basic audit events for key write operations
- UX hardening: role-focused dashboards, non-duplicated ownership, responsive navigation, localized dates/statuses, and shared UI behavior
- Initial admin backup/restore workflow for local/offline deployments

Completed execution inside Phase 1:

1. Freeze and test role boundaries (`docs/developer/RBAC_MATRIX.md`, security integration tests).
2. Keep admin dashboard management-only (team + assignment) and clinical dashboard action-oriented.
3. Complete frontend case/image workflow screens on top of existing secured backend APIs.
4. Add audit logging coverage for patient/case/image/appointment mutations.
   - Current: patient/case/image/appointment service audit events implemented and unit-tested.
   - Current: admin audit endpoint + frontend audit viewer implemented.
5. Add appointment identity/conflict safeguards and scalable patient/appointment list endpoints.
6. Protect destructive UI actions and centralize session-expiration behavior.

Remaining closure work:

- Run pilot-clinic acceptance testing on representative desktop and mobile devices.
- Add Playwright coverage for the highest-risk cross-page workflows.
- Define audit retention/export policy and compliance-level reporting.

Exit criteria:

- Pilot clinic can run daily workflows without PATIENT portal dependency; current patient portal remains read-only and optional.

## Phase 1.5 - Access Model Split + Tenant Foundation

Status: Planned (next after Phase 1 closure)

- Introduce explicit `SYSTEM_ADMIN` vs `CLINIC_ADMIN`
- Add tenant model foundations (`tenant_id`, tenant-aware queries, tenant-safe auth claims)
- Backward-compatible migration path from current `ADMIN`
- Update frontend role routing for the split roles

Exit criteria:

- Same product runs as single-tenant or multi-tenant without code fork.

## Phase 2 - Revenue Modules

Status: Planned

- Scheduling enhancements (duration-aware overlap rules, follow-up workflows, reminders)
- Prescription + medication tracking
- Structured clinical notes and specialty template packs
- Operational exports/reporting

Exit criteria:

- Commercial package usable by private clinics beyond core tracking.

## Phase 3 - Compliance + Operability

Status: Planned (can run in parallel with Phase 2; initial admin backup/restore tooling exists)

- Complete audit trail coverage
- Consent/retention policy flows
- Harden backup/restore policy with disaster recovery drills, retention rules, and deployment-specific runbooks
- CNDP-aligned documentation package

Exit criteria:

- Compliance and operational readiness for broader deployment.

## Phase 4 - Patient Portal (Optional Add-On)

Status: Deferred until business validation

- Patient self-access to own data only
- Follow-up reminders, secure communication
- Explicit clinic opt-in control

Exit criteria:

- Portal can be enabled per clinic without affecting internal workflows.
