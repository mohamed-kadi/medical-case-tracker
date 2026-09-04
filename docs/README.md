# Documentation Hub

This folder is the single entry point for product, engineering, testing, and user-facing documentation. The root [README](../README.md) is intentionally concise; detailed operational and workflow guidance lives here.

Current planning baseline:

- Spec v1 is internal-clinic first.
- In current code/docs, `ADMIN` means clinic admin.
- Future phase introduces explicit `SYSTEM_ADMIN` and `CLINIC_ADMIN`.

## Developer Docs

- [Developer Map](./developer/DEVELOPER_MAP.md)
- [Product Build Map (Morocco)](./developer/PRODUCT_BUILD_MAP_MA.md)
- [Phase Plan](./developer/PHASE_PLAN.md)
- [RBAC Matrix (V1)](./developer/RBAC_MATRIX.md)
- [Testing Strategy](./developer/TESTING_STRATEGY.md)
- [Documentation Checklist](./developer/DOCUMENTATION_CHECKLIST.md)
- [Backend Run Guide](../backend/README.md)
- [Frontend Run Guide](../frontend/README.md)

## User Docs

- [User Guide (English)](./user/USER_GUIDE_EN.md)
- [Guide Utilisateur (Francais)](./user/GUIDE_UTILISATEUR_FR.md)
- [Support Map](./user/SUPPORT_MAP.md)

## Language Policy

- English and French are the supported project languages.
- Frontend UI is available in English and French.
- Backend API responses can be localized using the `Accept-Language` header.
- User-facing docs are maintained in both languages.

## Documentation Ownership

- `README.md`: product summary, quick start, key routes, and links only.
- `backend/README.md`: backend configuration, database, API, backup, and operations.
- `frontend/README.md`: frontend features, commands, structure, and localization.
- `docs/developer/`: architecture, access control, delivery phases, and testing.
- `docs/user/`: role-based workflows and support guidance.
