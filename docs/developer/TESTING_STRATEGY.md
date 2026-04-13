# Testing Strategy

## Goals

- Every functional change must include tests.
- Critical patient, case, image, and auth paths must always be covered.
- Test failures block merge.

## Test Layers

1. Unit tests
   - Scope: backend service logic, validators, utility methods
   - Tools: JUnit 5, Mockito
2. Web slice tests
   - Scope: controller request/response behavior, validation, status codes
   - Tools: `@WebMvcTest`, MockMvc
3. Frontend unit tests
   - Scope: auth service behavior, language selection behavior, app shell wiring
   - Tools: Karma, Jasmine, Angular TestBed
4. Integration tests
   - Scope: repository + security + application context wiring
   - Tools: `@SpringBootTest`, test profile, H2 or Testcontainers
5. End-to-end tests (frontend expansion phase)
   - Scope: full user workflow and localization
   - Tools: Playwright

## Mandatory Coverage Areas

- Auth login/register:
  - validation errors
  - role restrictions
  - localized responses
- Frontend auth flow:
  - login page form validation
  - register page form validation
  - token persistence and logout behavior
- Frontend language flow:
  - `en`/`fr` switch behavior
  - `Accept-Language` header propagation
- Localization resource integrity:
  - backend `messages_en.properties` and `messages_fr.properties` key parity
- Patient service:
  - happy path
  - not found path
  - conflict path
- Image service:
  - upload validation
  - path safety
  - deleted image access restrictions
- Security:
  - public endpoints
  - protected endpoint role access
  - interceptor header behavior (`Authorization`, `Accept-Language`)

## Runtime Profiles

- `dev`: PostgreSQL local development
- `test`: H2 in-memory for repeatable CI/local tests
- `prod`: externalized configuration only

## CI Test Command Set

- `cd backend && ./mvnw -q -DskipTests compile`
- `cd backend && ./mvnw -q test`
- `PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run build -- --configuration development`
- `PATH="$(pwd)/.tools/node/bin:$PATH" && cd frontend && npm run test -- --watch=false --browsers=ChromeHeadlessCI`
- GitHub Actions workflow: `.github/workflows/ci.yml`

## Current Automated Checks (Implemented)

- Backend:
  - `AuthControllerTest` (`@WebMvcTest`) for auth validation, role restrictions, localized responses
  - `SecurityConfigIntegrationTest` (`@SpringBootTest`) for route access rules by role
  - `LocalizationBundleConsistencyTest` for `en/fr` message-key synchronization
  - `PatientServiceImplTest` for service behavior and conflict paths
- Frontend:
  - `auth.service.spec.ts` for login/register/token behavior
  - `i18n.service.spec.ts` for translation behavior and dictionary key parity
  - `language.service.spec.ts` for language persistence
  - `auth.interceptor.spec.ts` for `Authorization` header rules
  - `language.interceptor.spec.ts` for `Accept-Language` propagation

## Definition of Done (Testing)

- New code path has a test.
- Existing tests remain green.
- Edge case and error path are asserted.
- Docs update references test behavior where needed.
