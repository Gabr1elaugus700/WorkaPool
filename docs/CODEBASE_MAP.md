# WorkaPool Codebase Map

Last updated: 2026-04-13

## Monorepo Layout

This repository is organized around two main applications:
- `backend/`: Express + TypeScript API, Prisma/PostgreSQL, SQL Server integrations
- `frontend/`: React + TypeScript SPA built with Vite

There is also a root `package.json` with a small set of shared tooling dependencies.

## Backend vs Frontend Responsibilities

- Backend (`backend/`)
  - Business logic and API endpoints
  - Authentication and authorization
  - Database persistence (Prisma/PostgreSQL)
  - External system integration (Sapiens/SQL Server, SOAP, scheduler tasks)
  - Swagger API documentation

- Frontend (`frontend/`)
  - User interface and navigation
  - Auth session state from JWT token
  - Feature UIs (cargo, order loss, work order, users, departments)
  - HTTP integration with backend APIs via axios
  - Server-state handling with React Query

## Current Architecture Direction

Both applications show a transition toward feature-oriented organization:
- Backend: `src/features/*` coexists with older route/controller/service/repository layers
- Frontend: `src/features/*` coexists with older `pages/`, `components/`, and `services/`

This means the project is in an incremental refactor stage, not a fully uniform architecture yet.

## Where To Read Next

- Backend details: `docs/BACKEND.md`
- Frontend details: `docs/FRONTEND.md`
