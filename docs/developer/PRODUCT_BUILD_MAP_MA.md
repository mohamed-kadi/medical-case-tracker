# Product Build Map (Morocco)

## Product Direction

Build one platform for private clinics (not three separate apps), with specialty templates:

- Dermatology template (first launch)
- Aesthetic template (phase 2)
- Wound-care template (phase 2)

Core product remains shared: users, patients, cases, images, notes, scheduling, prescriptions, audit/compliance.

## Why This Path

- Faster time to market and lower maintenance than multiple apps.
- Better fit for your existing codebase, which already has patient/case/image foundations.
- Easier regulatory and security management (single architecture, single compliance baseline).

## Roles Model (Target)

- `ADMIN`: clinic setup, staff provisioning, configuration, audit access.
- `DOCTOR`: own/assigned patient care workflows.
- `STAFF`: intake, scheduling, upload support, operational tasks.
- `PATIENT`: future portal only (not part of day-1 internal rollout).

## Build Phases

### Phase 0 - Stabilize Current Foundation (1-2 weeks)

- Keep current backend/frontend and harden startup/developer setup.
- Remove source-controlled secret defaults and enforce env-driven secrets.
- Add local bootstrap script for Postgres database/user.
- Ensure role-safe auth flows and initial admin seed path.

Deliverable:
- Reliable local run (`dev`) + test run (`test`) with clear setup docs.

### Phase 1 - Internal Clinic MVP (4-6 weeks)

- Staff-only workflow (`ADMIN/DOCTOR/STAFF`):
  - Patient management
  - Case timeline
  - Image upload and progression
  - Treatment notes
- Add assignment boundaries (doctor-to-patient/case visibility).
- Add basic activity log on key operations.

Deliverable:
- Deployable internal MVP for pilot clinics.

### Phase 2 - Revenue Features (4-6 weeks)

- Scheduling module (appointments and follow-ups).
- Prescription + medication tracking module.
- Specialty templates (derm first-class; aesthetic/wound-care profiles).
- Reporting exports for clinic operations.

Deliverable:
- Monetizable package for private practices.

### Phase 3 - Compliance and Trust Layer (parallel)

- Data retention and consent workflows.
- Complete audit trail for access and edits.
- Backup/restore policy and disaster recovery runbook.
- CNDP-focused documentation package for onboarding clinics.

Deliverable:
- Compliance-ready operations package.

### Phase 4 - Patient Portal (optional later)

- Limited patient access to own cases/images/follow-up instructions.
- Reminders and secure messaging (if demanded by clinics).

Deliverable:
- Optional add-on product line.

## Adaptation Map (What We Reuse Now)

### Keep and Extend

- `User` + `UserRole`: keep; add controlled provisioning and role-transition policy.
- `Patient`: keep; add ownership/assignment fields and contact preferences.
- `MedicalCase`: keep; add specialty metadata, visit milestones, prescription links.
- `MedicalImage`: keep; add standardized clinical tags and progression markers.
- Existing controllers/services/repositories: keep; refactor into DTO-driven contracts and role-safe service guards.

### Add New Modules

- `Appointment` (scheduling)
- `Prescription` and `Medication`
- `CaseNote` (structured clinical notes)
- `AuditEvent` (compliance logging)
- `DoctorPatientAssignment` (visibility boundaries)
- `SpecialtyTemplate` (configurable forms/fields/checklists)

## Technical Guardrails

- Keep one codebase and one API surface.
- Enforce migrations (Flyway) before production rollout.
- Use DTO contracts for all external APIs.
- Add integration tests for RBAC and cross-user access isolation.
- Keep bilingual behavior (`en`, `fr`) as a non-negotiable requirement.

## Suggested Immediate Sprint

1. Lock down account lifecycle:
- Disable public non-patient role creation.
- Add admin-only user provisioning endpoint.

2. Add assignment boundaries:
- Doctor/staff only see assigned patients/cases.

3. Start scheduling domain:
- Create `Appointment` entity + CRUD endpoints + tests.

4. Add audit skeleton:
- Record create/update/delete events for patient/case/image.

## Success Metrics (Pilot)

- Time to create patient + first case + upload first image.
- Follow-up adherence rate (scheduled vs attended).
- Average case resolution time.
- Active users per clinic (`DOCTOR` + `STAFF`).
- Churn/retention after first 60 days.
