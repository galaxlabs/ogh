# OGH Monorepo

A publish-ready monorepo for a content-driven web platform using a WordPress-like downloadable CMS style:

- React + Vite frontend in `apps/web`
- PocketBase backend in `apps/pocketbase`
- npm workspaces at the root

## Quick start

1. Install dependencies:
   npm install
2. Create your local environment file:
   cp .env.example .env
3. Run the development environment:
   npm run dev
4. Build the frontend:
   npm run build

## Project structure

- `apps/web` — user-facing website
- `apps/pocketbase` — backend, auth, content storage, and admin data

## Notes for GitHub

This repository is prepared for GitHub with:

- a root `.gitignore`
- workspace-based package management
- a basic setup guide in this README

## Suggested first push

git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
