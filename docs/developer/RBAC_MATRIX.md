# RBAC Matrix (V1)

This matrix is the source of truth for current role behavior in the clinic-first release.

## Role Capability Matrix

| Capability | ADMIN | DOCTOR | FRONT_DESK | PATIENT |
| --- | --- | --- | --- | --- |
| Login (`/api/auth/login`) | Yes | Yes | Yes | Yes |
| Public register (`/api/auth/register`) | No (patient-only endpoint) | No (patient-only endpoint) | No (patient-only endpoint) | Yes |
| Access internal dashboard (`/dashboard`) | Yes | Yes | Yes | No |
| Access patient portal (`/patient-portal`) | No | No | No | Yes |
| Create internal users (`/api/admin/users`) | Yes | No | No | No |
| Assign doctor/front desk to patient (`/api/admin/patients/{id}/assignment`) | Yes | No | No | No |
| View patients (`GET /api/patients/**`) | Yes (all patients, redacted clinical fields) | Yes (assigned only) | Yes (all patients, redacted clinical fields) | No |
| Create/update patient (`POST/PUT/PATCH/DELETE /api/patients/**`) | No | Yes | Yes | No |
| Manage cases (`/api/cases/**`) | No | Yes | No | No |
| Manage images (`/api/images/**`) | No | Yes | No | No |
| Manage appointments (`/api/appointments/**`) | No | Yes | Yes | No |

## Patient Registration Assignment Rules

| Scenario | Registered by | Front desk assignment | Doctor assignment |
| --- | --- | --- | --- |
| `FRONT_DESK` creates patient and one enabled doctor exists | Authenticated receptionist | Authenticated receptionist | Auto-assigned to the only enabled doctor |
| `FRONT_DESK` creates patient and multiple enabled doctors exist | Authenticated receptionist | Authenticated receptionist | Blank until admin review |
| `FRONT_DESK` creates patient and zero enabled doctors exist | Authenticated receptionist | Authenticated receptionist | Blank until a doctor exists and is assigned |

## Dashboard Intent

- `ADMIN` dashboard: management only (team provisioning + assignment operations).
- `DOCTOR` dashboard: clinical operations (patients, cases, appointments).
- `FRONT_DESK` dashboard: intake and scheduling support (patients, appointments, patient number/card), with clinical fields hidden.
- `PATIENT` dashboard: not enabled in V1; redirected to placeholder portal.

## Enforcement Mapping

- Backend endpoint authorization: `backend/src/main/java/com/doctorapp/medicaltracker/security/SecurityConfig.java`
- Backend route-role verification tests: `backend/src/test/java/com/doctorapp/medicaltracker/security/SecurityConfigIntegrationTest.java`
- Frontend route guards: `frontend/src/app/core/guards`
  - `adminGuard`: admin-only routes
  - `clinicalGuard`: doctor/front-desk patient and appointment routes
  - `doctorGuard`: doctor-only clinical case routes
  - `internalGuard`: internal workspace entry
