# RBAC Matrix (V1)

This matrix is the source of truth for current role behavior in the clinic-first release.

## Role Capability Matrix

| Capability | ADMIN | DOCTOR | STAFF | PATIENT |
| --- | --- | --- | --- | --- |
| Login (`/api/auth/login`) | Yes | Yes | Yes | Yes |
| Public register (`/api/auth/register`) | No (patient-only endpoint) | No (patient-only endpoint) | No (patient-only endpoint) | Yes |
| Access internal dashboard (`/dashboard`) | Yes | Yes | Yes | No |
| Access patient portal (`/patient-portal`) | No | No | No | Yes |
| Create internal users (`/api/admin/users`) | Yes | No | No | No |
| Assign doctor/staff to patient (`/api/admin/patients/{id}/assignment`) | Yes | No | No | No |
| View patients (`GET /api/patients/**`) | Yes (all patients) | Yes (assigned only) | Yes (assigned only) | No |
| Create/update patient (`POST/PUT/PATCH/DELETE /api/patients/**`) | No | Yes | Yes | No |
| Manage cases (`/api/cases/**`) | No | Yes | Yes | No |
| Manage images (`/api/images/**`) | No | Yes | Yes | No |
| Manage appointments (`/api/appointments/**`) | No | Yes | Yes | No |

## Dashboard Intent

- `ADMIN` dashboard: management only (team provisioning + assignment operations).
- `DOCTOR` dashboard: clinical operations (patients, cases, appointments).
- `STAFF` dashboard: operational support (patients, cases, appointments) within assignment scope.
- `PATIENT` dashboard: not enabled in V1; redirected to placeholder portal.

## Enforcement Mapping

- Backend endpoint authorization: `backend/src/main/java/com/doctorapp/medicaltracker/security/SecurityConfig.java`
- Backend route-role verification tests: `backend/src/test/java/com/doctorapp/medicaltracker/security/SecurityConfigIntegrationTest.java`
- Frontend route guards: `frontend/src/app/core/guards`
  - `adminGuard`: admin-only routes
  - `clinicalGuard`: doctor/staff-only routes
  - `internalGuard`: internal workspace entry
