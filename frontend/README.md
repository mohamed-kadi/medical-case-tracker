# Frontend (Angular)

Angular frontend for Medical Case Tracker.

## Current Feature Scope

- Public login and patient-account registration
- Role-specific dashboards for admin, doctor, and front desk users
- Searchable, paginated patient directory with dedicated create/edit pages; the doctor view prioritizes a checked-in waiting queue and keeps the directory collapsed initially
- Patient workspace with printable card, history, appointment summary, and case summary
- Search-first appointment scheduler with patient deep links, standard reason choices, optional patient-reported intake checklist, front-desk check-in, and a collapsible paginated schedule
- Interactive upcoming-appointment calendar with colored dates and patient details
- Doctor-only case workspace with compact patient identity, horizontal case selection, atomic detail/status saves, structured prescription drafting/history/printing, and medical images
- Admin team, assignment, audit, and backup/restore pages
- Verified account-linking workflow and limited read-only patient portal
- Responsive navigation drawer and mobile appointment cards
- HTTP interceptors:
  - `Authorization: Bearer <token>`
  - `Accept-Language: en|fr`
  - centralized expired-session logout and redirect
- English/French UI, status, date, feedback, and accessibility localization
- Shared localized-date/status/reason pipes, accessible in-app confirmation dialog, and feedback component

## Prerequisites

- Node 20+
- npm 10+
- Backend API running on `http://localhost:8080`

If using the local repo Node runtime, prefix commands with:

```bash
export PATH="$(pwd)/.tools/node/bin:$PATH"
```

## Run Locally

From repository root:

```bash
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm install
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run start
```

Open `http://localhost:4200/`.

## Build

```bash
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run build -- --configuration development
```

Build output: `frontend/dist/frontend`

## Unit Tests

```bash
PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run test -- --watch=false --browsers=ChromeHeadlessCI
```

## Structure

- App shell and routes: `src/app/app.component.*`, `src/app/app.routes.ts`
- Core auth/lang services: `src/app/core/services`
- Interceptors and guard: `src/app/core/interceptors`, `src/app/core/guards`
- Feature pages: `src/app/features`
- Shared components, pipes, and confirmation behavior: `src/app/shared`
- Environment settings: `src/environments`

## Localization

- Supported languages: English (`en`) and French (`fr`)
- Translation dictionary: `src/app/core/services/i18n.service.ts`
- Language state service: `src/app/core/services/language.service.ts`
