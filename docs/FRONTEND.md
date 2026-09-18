# Frontend Codebase Map

Last updated: 2026-09-18

## Overview

React + TypeScript SPA in `frontend/`, built with Vite. **New UI and feature logic go in `src/features/<feature>/`.** `src/pages/`, `src/components/<area>/` (except `components/ui`), and `src/services/` are **legacy, maintain-only**. Aligns with [AGENTS.md](../AGENTS.md).

Core entrypoints:

- `src/main.tsx` — bootstrap, React Query provider, mounts `AppRoutes`
- `src/routes/index.tsx` — route table and `PrivateRoute` wrapping
- `src/auth/AuthContext.tsx` — JWT in `localStorage`, decoded user
- `src/auth/PrivateRoute.tsx` — redirect to `/login` when unauthenticated
- `src/layout/DefaultLayout.tsx` — app chrome / nav (role-gated `ButtonLink`s)

`src/App.tsx` also renders `AppRoutes` but is **not** the Vite entry (`main.tsx` mounts routes directly).

## Architectural direction

Feature-first, incremental migration. Views/pages under a feature orchestrate; `features/<feature>/components/` present. Do not grow a route wrapper in `src/pages/` into a new product UI dump, and do not add new domain screens under `components/cargas`, `components/metas`, etc.

Placement: [.agents/skills/writing-typescript](../.agents/skills/writing-typescript/SKILL.md). Product language: [PRODUCT.md](../PRODUCT.md), [CONTEXT-MAP.md](../CONTEXT-MAP.md). UI system: [DESIGN.md](../DESIGN.md).

Hard rules (do not contradict [AGENTS.md](../AGENTS.md)):

- New screen flow → `features/<feature>/views/` or existing `pages/` inside that feature; extract UI into `features/<feature>/components/`.
- `components/ui/` is shared primitives (treat as vendor). Do not dump product UI there.
- No TypeScript `any`. UI copy is **pt-BR** with domain words from `CONTEXT.md`.
- Do not change Vite port **5858** or retarget [`src/lib/apiBase.ts`](../frontend/src/lib/apiBase.ts) production fallback (`:3030`) to local `:3001`. Local Vite uses gitignored `frontend/.env` (`VITE_API_BASE_URL=…:3001`).
- Never run `npm run build` / `vite build` in the agent flow.

## Tech stack

- Framework: React 19
- Build: Vite 6 (dev server port **5858**)
- Language: TypeScript
- Routing: `react-router-dom`
- Data: `@tanstack/react-query` + `axios`
- Forms: `react-hook-form`, `zod`, `@hookform/resolvers`
- UI: Tailwind CSS, Radix primitives, `src/components/ui`, `clsx` / `class-variance-authority` / `tailwind-merge`
- Charts / DnD: `recharts`, dnd-kit, react-dnd
- Toasts: `sonner`

## Feature modules (`src/features/`)

On disk today (no `features/goals` and no `features/pedidos` — those live on the backend; metas UI is still legacy):

| Feature | Folder | Role | Routed from |
| --- | --- | --- | --- |
| Cargo | `cargo/` | Controle de cargas (`pages/ControleDeCargas.tsx` + components/hooks/services) | `/cargas` via thin `src/pages/CargasPage.tsx` |
| Order Loss | `orderLoss/` | `views/OrderLossView`, `SellerOrdersView` | `/order-loss`, `/my-orders` |
| Ordem de Serviço | `workOrder/` | `views/osView`, `vistoriaView` | `/Os`, `/vistoria` |
| Identity | `users/` | `views/usersView` | `/users` |
| Departamentos | `departamentos/` | Supporting models/services/UI used by users and workOrder | **no** top-level route |

Typical inner layout (varies per feature — match the existing one):

- `views/` or `pages/` — route-level orchestration
- `components/` — feature UI pieces
- `hooks/`, `services/`, `types/`, `utils/`
- some modules also have `models/`, `viewmodels/` (`users`, `departamentos`, `workOrder`)

There is no frontend `CONTEXT.md`; use the backend domain files for language.

## Legacy UI (`pages/`, `components/<area>/`, `services/`)

**Maintain only.** Prefer `features/` when creating new pieces.

`src/pages/` (route-level or leftover):

| File | Used in router? | Notes |
| --- | --- | --- |
| `CargasPage.tsx` | yes (`/cargas`) | Thin wrapper around `features/cargo` |
| `MetasPage.tsx` | yes (`/metas/*`) | Legacy metas UI; new metas work → `features/` (create `features/goals` or equivalent), not `components/metas` |
| `FretesPage.tsx` | yes (`/fretes`) | Discontinued frete **cálculo** — do not grow |
| `Home.tsx` | yes (`/`) | Home + estoque widget |
| `Clientes.tsx`, `Pedidos.tsx` | yes | Older commercial screens |
| `ClientesInativos.tsx` | yes (`/vendasPerdidas`) | Confirm current product use before investing |
| `dashboard.tsx`, `dashboardVendas.tsx` | yes (`/dashboardTest`, `/dashboard`) | Confirm before investing |
| `CargasFechadasPage.tsx`, `OrdemPage.tsx` | **no** | Leftovers (`OrdemPage` is mock data; live OS is `features/workOrder`) |

`src/components/`:

- `ui/` — design-system primitives (OK to use; do not reorganize)
- Legacy area UI: `cargas`, `metas`, `caminhoes`, `estoque`, `inativos`, `charts`, `navBar`

`src/services/` — older API hooks (cargas, fretes, estoque, vendedores, …). Cargo/order-loss/users/OS calls increasingly live under `features/*/services`. Do not add a new domain client here.

Other shared roots (not “a feature”, not the legacy dump):

- `src/auth/`, `src/layout/`, `src/routes/`
- `src/lib/` — `apiBase.ts`, `apiFetch.ts`, `authHeaders.ts`, `utils.ts`
- `src/hooks/`, `src/types/`, `src/utils/`, `src/validators/`
- `src/styles/`, `src/app/`, `src/theme/`, `src/assets/`

## Routing map

Defined in `src/routes/index.tsx`. Navbar links live in `DefaultLayout` and are role-gated; not every registered route is promoted in the nav.

Public:

- `/login`

Protected (`PrivateRoute`):

| Path | Implementation |
| --- | --- |
| `/` | `pages/Home` |
| `/order-loss` | `features/orderLoss` `OrderLossView` |
| `/my-orders` | `features/orderLoss` `SellerOrdersView` |
| `/cargas` | `pages/CargasPage` → `features/cargo` |
| `/Os` | `features/workOrder` `osView` |
| `/vistoria` | `features/workOrder` `vistoriaView` |
| `/users` | `features/users` `usersView` |
| `/metas/*` | `pages/MetasPage` (legacy) |
| `/fretes` | `pages/FretesPage` (discontinued cálculo) |
| `/clientes` | `pages/Clientes` |
| `/pedidos` | `pages/Pedidos` |
| `/vendasPerdidas` | `pages/ClientesInativos` |
| `/dashboard`, `/dashboardTest` | legacy dashboards |

Casing inconsistency: the router registers `/Os`; `DefaultLayout` links to `/os`. Do not “fix” casually without checking both the route table and the nav.

`/users` is registered but the users `ButtonLink` in the desktop nav is currently commented out.

## API integration pattern

- [`src/lib/apiBase.ts`](../frontend/src/lib/apiBase.ts) — shared axios instance
  - Production build: same-origin `""` (nginx proxies `/api`)
  - Dev: `VITE_API_BASE_URL`, else LAN fallback `http://192.168.0.32:3030` (**not** local `:3001`)
- Dev interceptors log requests
- Feature modules centralize calls under `features/*/services`
- Cargo + order-loss contract expected by the SPA: [FRONTEND_CARGO_PEDIDOS_API.md](./FRONTEND_CARGO_PEDIDOS_API.md)

If local UI hits `Cannot GET /api/...`, the Vite app is talking to the production fallback (`:3030`), not backend `:3001`. Fix via `frontend/.env`, not by editing `apiBase.ts`.

## Auth flow

- Token in `localStorage`
- `AuthProvider` decodes JWT (`jwt-decode`)
- `PrivateRoute` sends anonymous users to `/login`
- Context: `token`, decoded `user` (role, `codRep`, departamentos), `login`, `logout`, `loading`
- Nav uses `allowedRoles` on `ButtonLink`; backend must still enforce role/`codRep` in the use-case

## Conventions observed

- Incremental move to `src/features/*`; leftover barrels (`features/cargo/index.ts`, `features/orderLoss/index.ts`) — do not add new barrels; import the owning file.
- Mixed pt-BR / English identifiers; UI labels in Portuguese.
- Alias `@/` → `src/`.
- Views orchestrate; feature components present (see `orderLoss/views` + `components`, cargo `pages` + `components`).

## Build and run

Scripts in `frontend/package.json`:

- `npm run dev` — Vite on **5858**
- `npm run lint` — ESLint (default frontend verification)
- `npm test` / `npm run test:coverage` — when tests changed
- `npm run preview` — operators only

Do **not** run `npm run build` in the agent flow.

## Risks (navigation, not a backlog)

- Feature modules + legacy pages/services can duplicate the same domain (cargas, metas, OS).
- Discontinued `/fretes` still in ADMIN nav.
- Inactive or unconfirmed routes (`/dashboard*`, `/vendasPerdidas`, `/clientes`, `/pedidos`) — confirm with [PRODUCT.md](../PRODUCT.md) before building on them.
- Route casing (`/Os` vs `/os`).

## Where to read next

- Monorepo map: [CODEBASE_MAP.md](./CODEBASE_MAP.md)
- Backend map: [BACKEND.md](./BACKEND.md)
- Cargo/orders contract: [FRONTEND_CARGO_PEDIDOS_API.md](./FRONTEND_CARGO_PEDIDOS_API.md)
- Product / language: [PRODUCT.md](../PRODUCT.md), [CONTEXT-MAP.md](../CONTEXT-MAP.md)
- Agent entry: [AGENTS.md](../AGENTS.md)
- Ports: [.cursor/rules/local-dev-ports.mdc](../.cursor/rules/local-dev-ports.mdc)
- Specs: [.specs/features/](../.specs/features/)
- UI skill: [.cursor/skills/impeccable/SKILL.md](../.cursor/skills/impeccable/SKILL.md)
- Domain language (backend): [cargo](../backend/src/features/cargo/CONTEXT.md), [orderLoss](../backend/src/features/orderLoss/CONTEXT.md), [workOrder](../backend/src/features/workOrder/CONTEXT.md), [users](../backend/src/features/users/CONTEXT.md), [goals](../backend/src/features/goals/CONTEXT.md), [pedidos](../backend/src/features/pedidos/CONTEXT.md)
