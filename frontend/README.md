# Frontend (Angular)

Angular frontend for Medical Case Tracker.

## Current Feature Scope

- Public auth pages:
  - `/login`
  - `/register`
- Protected page:
  - `/dashboard` (JWT required)
- HTTP interceptors:
  - `Authorization: Bearer <token>`
  - `Accept-Language: en|fr`
- Language switcher with persisted preference
- English/French UI dictionary

## Prerequisites

- Node 20+
- npm 10+
- Backend API running on `http://localhost:8080`

If using the local repo Node runtime, prefix commands with:

```bash
PATH="$(pwd)/.tools/node/bin:$PATH"
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
- Shared components: `src/app/shared`
- Environment settings: `src/environments`

## Localization

- Supported languages: English (`en`) and French (`fr`)
- Translation dictionary: `src/app/core/services/i18n.service.ts`
- Language state service: `src/app/core/services/language.service.ts`
