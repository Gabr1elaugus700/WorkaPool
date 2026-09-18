# WorkaPool Codebase Map

Last updated: 2026-09-18

Onboarding for agents starts at [AGENTS.md](../AGENTS.md). This file is the monorepo map: where code lives, which trees are active, and where **not** to add new work.

## Architectural direction

**Feature-first.** Put new product work in:

- `backend/src/features/<domain>/`
- `frontend/src/features/<domain>/`

Do **not** grow legacy trees (`backend/src/{routes,controllers,services,repositories}`, `frontend/src/{pages,components,services}` except `components/ui`). Maintain legacy only. The repo is mid-migration: feature modules coexist with older layers. That is not permission to add a new domain outside `features/`.

Placement details: [.agents/skills/writing-typescript](../.agents/skills/writing-typescript/SKILL.md). Ubiquitous language: [CONTEXT-MAP.md](../CONTEXT-MAP.md) and each domain `CONTEXT.md`.

## Monorepo layout

Two apps plus root agent/product docs. Root `package.json` is shared tooling only (not an npm workspace).

| Path | Role |
| --- | --- |
| `backend/` | Express + TypeScript API, Prisma/PostgreSQL, Sapiens (SQL Server / SOAP) |
| `frontend/` | React 19 + TypeScript SPA (Vite) |
| [AGENTS.md](../AGENTS.md) | Agent entry: stack, ports, where to write code, hard rules |
| [PRODUCT.md](../PRODUCT.md) | Product purpose, roles, active vs discontinued surfaces |
| [CONTEXT-MAP.md](../CONTEXT-MAP.md) | Bounded contexts and relationships |
| [DESIGN.md](../DESIGN.md) | Visual system (UI work) |
| `.specs/` | Feature specs and OpenAPI contract-first conventions |
| `.cursor/rules/` | Always-on agent rules (ports, backend role, task intake) |

Local ports are immutable: frontend **5858**, backend **3001**, Postgres **5435**. Canonical rule: [.cursor/rules/local-dev-ports.mdc](../.cursor/rules/local-dev-ports.mdc). Do not change them in source. [`frontend/src/lib/apiBase.ts`](../frontend/src/lib/apiBase.ts) keeps the production LAN fallback (`:3030`); never retarget it to `:3001`.

## Backend vs frontend responsibilities

- Backend (`backend/`)
  - Business logic and HTTP API
  - JWT auth and role / `codRep` scoping (in the use-case/service, not only in the UI)
  - App persistence (Prisma/PostgreSQL)
  - Sapiens integration (SQL Server, SOAP) — ERP is source of truth
  - OpenAPI/Swagger UI at `/api/docs` (contract-first; see [.specs/codebase/OPENAPI_CONTRACT_FIRST.md](../.specs/codebase/OPENAPI_CONTRACT_FIRST.md))
  - Schedulers (watchdog exists under `src/schedulers/`; start is currently commented in `server.ts`)

- Frontend (`frontend/`)
  - Authenticated SPA, navigation, pt-BR UI copy
  - JWT session (`auth/`)
  - Feature UIs under `src/features/*`
  - HTTP via axios / `apiFetch` against the backend
  - Server state with React Query

## Active domains vs legacy / discontinued

Bounded contexts (product language) live on disk as backend feature folders. Frontend has a matching `features/` folder only where a UI module already exists.

| Domain | Backend `features/` | Frontend `features/` | Notes |
| --- | --- | --- | --- |
| Pedidos | `pedidos/` ([CONTEXT.md](../backend/src/features/pedidos/CONTEXT.md)) | — | Shared kernel; **no** `/api/pedidos`. Cargo and Order Loss consume it. |
| Cargo | `cargo/` ([CONTEXT.md](../backend/src/features/cargo/CONTEXT.md)) | `cargo/` | Assemble/close cargas from Pedidos Fechados. |
| Order Loss | `orderLoss/` ([CONTEXT.md](../backend/src/features/orderLoss/CONTEXT.md)) | `orderLoss/` | Negotiation + Motivo de Perda. |
| Ordem de Serviço | `workOrder/` ([CONTEXT.md](../backend/src/features/workOrder/CONTEXT.md)) | `workOrder/` | Facility OS, vistorias, checklists. |
| Metas | `goals/` ([CONTEXT.md](../backend/src/features/goals/CONTEXT.md)) | — | API under `/api/goals`. UI still on legacy `pages/MetasPage` + `components/metas`. New metas UI belongs in `features/`, not in `components/metas`. |
| Identity | `users/` ([CONTEXT.md](../backend/src/features/users/CONTEXT.md)) | `users/` | Auth, users, roles, `codRep`. |
| Departamentos | `departamentos/` (no `CONTEXT.md` yet) | `departamentos/` | Org units for OS/users. Supporting module, not a standalone product surface. |

**Discontinued (do not grow):**

- **Frete (cálculo)** — route/truck freight cost estimation. Live language: **Frete** is only a Motivo de Perda code. Legacy API `/api/fretes`, `/api/caminhoes`, `/api/parametrosFretes` and UI `/fretes` still exist; treat as maintain-only.
- Legacy commercial/reporting routes (faturamento, ranking, estoque, clientes inativos, dashboards) — confirm with [PRODUCT.md](../PRODUCT.md) before investing. Do not treat every mounted route as an active product surface.

**Legacy roots (maintain only):**

- Backend: `backend/src/controllers`, `routes`, `services`, `repositories`
- Frontend: `frontend/src/pages` (thin wrappers or older screens), `components/<area>/` (except `components/ui`), `services/`

## How to navigate

1. Read [AGENTS.md](../AGENTS.md), then [PRODUCT.md](../PRODUCT.md) and [CONTEXT-MAP.md](../CONTEXT-MAP.md).
2. Open the domain `CONTEXT.md` before naming fields or UI copy.
3. Implement under the matching `features/<domain>/`. Match that domain’s existing folder style (`http/` vs flat `controllers`/`routes`).
4. If the change is a spec’d feature, read `.specs/features/<name>/` first. New HTTP contracts: [.specs/codebase/OPENAPI_CONTRACT_FIRST.md](../.specs/codebase/OPENAPI_CONTRACT_FIRST.md).
5. Never run a production build (`npm run build` / `vite build`) to “verify”. Backend: `npm test` (and `npm run test:integration` when HTTP/persistence contracts change). Frontend: `npm run lint` (and `npm test` when tests changed).

## Where to read next

- Backend map: [BACKEND.md](./BACKEND.md)
- Frontend map: [FRONTEND.md](./FRONTEND.md)
- Cargo/orders HTTP contract used by the SPA: [FRONTEND_CARGO_PEDIDOS_API.md](./FRONTEND_CARGO_PEDIDOS_API.md)
- Product and language: [PRODUCT.md](../PRODUCT.md), [CONTEXT-MAP.md](../CONTEXT-MAP.md)
- Agent harness: [AGENTS.md](../AGENTS.md), [.cursor/rules/](../.cursor/rules/), [.specs/](../.specs/)
- TypeScript placement: [.agents/skills/writing-typescript/SKILL.md](../.agents/skills/writing-typescript/SKILL.md)
