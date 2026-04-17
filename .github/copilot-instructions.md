# Copilot Instructions

Use this repository as a secure content platform monorepo.

Important rules:

- Do not expose internal admin operations in public navigation, footer, or public docs.
- Do not commit real credentials or display passwords in the frontend.
- Prefer PocketBase for CMS data and Prisma for PostgreSQL or MySQL integrations.
- Verify changes with npm run build and npm run lint before marking work complete.
- Keep public pages user-facing and internal tools unadvertised.
