# Frontend Codebase Map

Last updated: 2026-04-13

## Overview

The frontend is a React + TypeScript SPA in `frontend/`, built with Vite. It uses route-level protection, React Query for server-state handling, and a mix of older shared `components/` plus newer `features/*` modules.

Core entrypoints:
- `src/main.tsx`: app bootstrap, React Query provider, root route mount
- `src/routes/index.tsx`: full route table and auth wrapping
- `src/auth/AuthContext.tsx`: token state and decoded JWT user context
- `src/auth/PrivateRoute.tsx`: route guard for authenticated pages

## Tech Stack

- Framework: React 19
- Build tool: Vite 6
- Language: TypeScript
- Routing: `react-router-dom`
- Data fetching/state: `@tanstack/react-query` + `axios`
- Forms/validation: `react-hook-form`, `zod`, `@hookform/resolvers`
- UI/styling:
  - Tailwind CSS
  - Radix UI primitives
  - Custom UI components under `src/components/ui`
  - Utility libraries (`clsx`, `class-variance-authority`, `tailwind-merge`)
- Charts and interactions: `recharts`, dnd-kit/react-dnd

## Directory Map

Top-level frontend layout:
- `frontend/src/main.tsx`, `frontend/src/App.tsx`
- `frontend/src/routes/` (router setup)
- `frontend/src/auth/` (auth context, login, route guard)
- `frontend/src/features/`
  - `cargo/`
  - `orderLoss/`
  - `workOrder/`
  - `users/`
  - `departamentos/`
- `frontend/src/pages/` (page-level views, mostly legacy/coarse modules)
- `frontend/src/components/` (reusable and legacy domain components)
- `frontend/src/services/` (legacy API hooks/services; partially superseded by `features/*/services`)
- `frontend/src/lib/` (`apiBase.ts`, utility helpers)
- `frontend/src/styles/` and `frontend/src/app/` (global styling)
- `frontend/src/types/` and `frontend/src/utils/`

## Routing Map

Defined in `src/routes/index.tsx`:
- Public:
  - `/login`
- Protected (via `PrivateRoute`):
  - `/`
  - `/order-loss`, `/my-orders`
  - `/Os`, `/vistoria`
  - `/users`
  - `/metas/*`
  - `/fretes`
  - `/clientes`, `/pedidos`, `/cargas`
  - `/vendasPerdidas`
  - `/dashboard`, `/dashboardTest`

## API Integration Pattern

- `src/lib/apiBase.ts` creates a shared axios instance
- Base URL logic:
  - Uses host-based override for `pooltecnica.no-ip.biz`
  - Falls back to `VITE_API_BASE_URL` then a LAN default
- Dev-only request/response interceptors log requests for debugging
- Feature modules increasingly centralize calls under `features/*/services`

## Auth Flow

- Token persisted in `localStorage`
- On app load, `AuthProvider` reads and decodes JWT (`jwt-decode`)
- `PrivateRoute` redirects unauthenticated users to `/login`
- Context exposes `token`, decoded `user`, `login`, `logout`, and `loading`

## Conventions Observed

- Incremental migration toward feature-first modules under `src/features/*`
- Still-active legacy modules under `src/components`, `src/pages`, and `src/services`
- Naming is generally `camelCase` for files with `PascalCase` for React component files
- Mixed Portuguese and English naming in domains and UI labels
- Alias imports (`@/...`) are used in many modules

## Build and Run

Scripts in `frontend/package.json`:
- `npm run dev`: start Vite dev server
- `npm run build`: type-check/build and Vite bundle
- `npm run lint`: run ESLint
- `npm run preview`: preview production build

## Risks and Cleanup Opportunities

- Coexistence of feature modules and legacy services/components can create duplication
- Route/path naming has inconsistent casing (e.g. `/Os`)
- Some feature docs mention temporary compatibility layers; deprecation cleanup is pending
- Frontend fallback API host is network-specific, so environment config discipline is important across deployments

## Integration Contract Reference

- For cargo and orders integration details (auth, routes, filters, validation expectations), use:
  - `docs/FRONTEND_CARGO_PEDIDOS_API.md`
