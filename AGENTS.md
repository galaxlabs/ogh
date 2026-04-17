# AGENTS.md

## Project summary

OGH is an npm workspaces monorepo with:

- frontend in apps/web using React and Vite
- CMS backend in apps/pocketbase using PocketBase
- admin service in apps/admin-api using Express and Prisma

## Verified commands

- install: npm install
- build: npm run build
- dev: npm run dev
- lint: npm run lint

## Security rules

- Never expose internal management links in the public navigation or footer.
- Never print or hardcode real passwords in UI, README files, or public pages.
- Keep secrets in local or server environment variables only.
- Do not add internal pages to the generated llms index.

## Data and services

- frontend runs on port 3000
- PocketBase runs on port 8090
- admin API runs on port 3100
- Prisma support is prepared for PostgreSQL and MySQL

## Current completed work

- GitHub repo initialized and pushed
- downloadable CMS resources added
- internal admin dashboard added
- backup and restore tooling added
- console status and logging added
- dev startup issues fixed for PocketBase permissions and local dev data

## Agent workflow

Before finishing any task:

1. run build
2. run lint
3. verify the affected route or service
4. avoid exposing internal operations in public UI
