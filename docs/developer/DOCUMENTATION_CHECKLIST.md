# Documentation Checklist

Use this checklist before merging any feature or fix.

## Developer Documentation

- Architecture impact documented in `docs/developer/DEVELOPER_MAP.md` if changed.
- Phase status updated in `docs/developer/PHASE_PLAN.md` if milestone moved.
- Test intent or coverage updates reflected in `docs/developer/TESTING_STRATEGY.md`.
- New environment variables added to runtime docs (`README.md` and profile files).

## User Documentation

- User-visible behavior change documented in:
  - `docs/user/USER_GUIDE_EN.md`
  - `docs/user/GUIDE_UTILISATEUR_FR.md`
- Any new endpoint affecting clients is described with examples.
- Validation and error message behavior is reflected in both languages.

## Localization Documentation

- New user-facing message keys added to:
  - `backend/src/main/resources/i18n/messages_en.properties`
  - `backend/src/main/resources/i18n/messages_fr.properties`
- Frontend translation keys updated in:
  - `frontend/src/app/core/services/i18n.service.ts`
- No key exists in only one language file.
- Terms are consistent between English and French docs.
