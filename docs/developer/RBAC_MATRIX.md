# RBAC Matrix (V1)

This matrix is the source of truth for current role behavior in the clinic-first release.

## Role Capability Matrix

| Capability | ADMIN | DOCTOR | FRONT_DESK | PATIENT |
| --- | --- | --- | --- | --- |
| Login (`/api/auth/login`) | Yes | Yes | Yes | Yes |
| Public register (`/api/auth/register`) | No (patient-only endpoint) | No (patient-only endpoint) | No (patient-only endpoint) | Yes |
| Access internal dashboard (`/dashboard`) | Yes | Yes | Yes | No |
| Access patient portal (`/patient-portal`) | No | No | No | Yes |
| View own portal dashboard (`GET /api/patient-portal/dashboard`) | No | No | No | Yes |
| Verify patient portal account link (`/patient-links`, `/api/patient-account-links/**`) | Yes | No | Yes | No |
| Create internal users (`/api/admin/users`) | Yes | No | No | No |
| Assign doctor/front desk to patient (`/api/admin/patients/{id}/assignment`) | Yes | No | No | No |
| View patients (`GET /api/patients/**`) | Yes (all patients, redacted clinical fields) | Yes (assigned only) | Yes (all patients, redacted clinical fields) | No |
| Create/update patient (`POST/PUT/PATCH/DELETE /api/patients/**`) | No | Yes | Yes | No |
| Manage cases (`/api/cases/**`) | No | Yes | No | No |
| Manage prescriptions (`/api/prescriptions/**`) | No | Yes | No | No |
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
- `DOCTOR` dashboard: clinical operations (patients, cases, prescriptions, appointments).
- `FRONT_DESK` dashboard: intake and scheduling support (patients, appointments, patient number/card), with clinical fields hidden.
- `PATIENT` dashboard: read-only portal for verified linked patient file summary, patient number, assigned contacts, and upcoming appointments.

## Patient Portal Privacy Rules

- Patient accounts and patient files are separate records.
- `patient_account_links` is the explicit bridge from `users` to `patients`.
- Only `VERIFIED` links expose patient data in the portal.
- `PENDING` and `REVOKED` links must not expose patient file data.
- The portal is read-only.
- The portal does not expose clinical notes, medical history, cases, prescriptions, images, appointment notes, or internal audit data.
- If no verified link exists, the portal shows an unlinked-account state instead of exposing any patient data.
- Public patient registration creates a portal login only. It must not create a second official clinic patient file.
- Email/phone matches are search hints for staff review, not authorization rules.

## Offline-To-Online Bridge

| Step | Owner | Result |
| --- | --- | --- |
| Offline patient intake | `FRONT_DESK` | Official `patients` file is created and patient number/card is issued. |
| Optional online account creation | `PATIENT` | A `users` account exists, but it is not linked to a clinic file yet. |
| Clinic verification | `FRONT_DESK` or `ADMIN` | Staff confirms identity using patient number/card and local clinic checks. |
| Link activation | `FRONT_DESK` or `ADMIN` via `/patient-links` | `patient_account_links.status` becomes `VERIFIED`. |
| Portal access | `PATIENT` | Patient can see limited read-only dashboard for that linked file only. |

## Enforcement Mapping

- Backend endpoint authorization: `backend/src/main/java/com/doctorapp/medicaltracker/security/SecurityConfig.java`
- Backend route-role verification tests: `backend/src/test/java/com/doctorapp/medicaltracker/security/SecurityConfigIntegrationTest.java`
- Frontend route guards: `frontend/src/app/core/guards`
  - `adminGuard`: admin-only routes
  - `clinicalGuard`: doctor/front-desk patient and appointment routes
  - `doctorGuard`: doctor-only clinical case routes
  - `internalGuard`: internal workspace entry
