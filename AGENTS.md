# AGENTS.md

Onboarding entry point for AI agents in the WorkaPool monorepo. Pointers, not a wiki. **New code goes in `features/`.** Do not grow legacy trees. **Never run a production build** in the agent flow.

## 1. Product

WorkaPool is Pool Técnica's internal operations hub (cargas, order loss, facility OS, metas, users). **Sapiens** is the ERP source of truth — the app must not invent or contradict commercial facts. UI copy is **pt-BR**. JWT roles: `ADMIN`, `USER`, `VENDAS`, `LOGISTICA`, `ALMOX`, `GERENTE_DPTO`.

- Product: [PRODUCT.md](./PRODUCT.md)
- Bounded contexts: [CONTEXT-MAP.md](./CONTEXT-MAP.md)
- Visual system (UI work): [DESIGN.md](./DESIGN.md)

## 2. Stack

Monorepo with two apps. Maps: [docs/CODEBASE_MAP.md](./docs/CODEBASE_MAP.md), [docs/BACKEND.md](./docs/BACKEND.md), [docs/FRONTEND.md](./docs/FRONTEND.md).

| Area | Path | Stack |
| --- | --- | --- |
| API | `backend/` | Express + TypeScript + Prisma/PostgreSQL + Zod; SQL Server/SOAP to Sapiens |
| SPA | `frontend/` | Vite + React 19 + TypeScript; React Query, axios |
| Auth | JWT | Role + `codRep` scoping |

## 3. Local ports (immutable)

Do not change these in source, Dockerfiles, or URL “fixes”. Canonical rule: [.cursor/rules/local-dev-ports.mdc](./.cursor/rules/local-dev-ports.mdc).

| Service | Port | Start |
| --- | --- | --- |
| Frontend | **5858** | `npm run dev` in `frontend/` |
| Backend | **3001** | `npm run dev` in `backend/` |
| Postgres | **5435** | Docker/compose (dev) |

[`frontend/src/lib/apiBase.ts`](./frontend/src/lib/apiBase.ts) keeps the **production** LAN fallback (`:3030`). **Never** change it to `:3001`. Local Vite uses gitignored `frontend/.env` (`VITE_API_BASE_URL=…:3001`). `:3030` is not the local API.

## 4. Where to write code

Put **new** work in `backend/src/features/<domain>/` and `frontend/src/features/<domain>/`.

Legacy (`backend/src/{routes,controllers,services,repositories}`, `frontend/src/{pages,components,services}` except `components/ui`) is **maintain-only**. Do not add new domains there.

Backend ubiquitous language (read before naming):

- [cargo](./backend/src/features/cargo/CONTEXT.md)
- [pedidos](./backend/src/features/pedidos/CONTEXT.md)
- [orderLoss](./backend/src/features/orderLoss/CONTEXT.md)
- [workOrder](./backend/src/features/workOrder/CONTEXT.md)
- [goals](./backend/src/features/goals/CONTEXT.md)
- [users](./backend/src/features/users/CONTEXT.md)

`departamentos` has no `CONTEXT.md` yet. Placement: [.agents/skills/writing-typescript](./.agents/skills/writing-typescript/SKILL.md).

## 5. Mandatory reading order (before coding)

1. This file.
2. [PRODUCT.md](./PRODUCT.md) and [CONTEXT-MAP.md](./CONTEXT-MAP.md).
3. Domain `CONTEXT.md` for the feature you will touch (if it exists).
4. [docs/CODEBASE_MAP.md](./docs/CODEBASE_MAP.md), then [docs/BACKEND.md](./docs/BACKEND.md) and/or [docs/FRONTEND.md](./docs/FRONTEND.md).
5. Spec under [.specs/features/](./.specs/features/) if one exists; API contract-first: [.specs/codebase/OPENAPI_CONTRACT_FIRST.md](./.specs/codebase/OPENAPI_CONTRACT_FIRST.md).
6. [.agents/skills/writing-typescript/SKILL.md](./.agents/skills/writing-typescript/SKILL.md).
7. [.cursor/rules/backend-role.md](./.cursor/rules/backend-role.md) and [.cursor/rules/local-dev-ports.mdc](./.cursor/rules/local-dev-ports.mdc).
8. UI work: [DESIGN.md](./DESIGN.md) and [.cursor/skills/impeccable/SKILL.md](./.cursor/skills/impeccable/SKILL.md).

## 6. Hard rules

- **Sapiens is truth.** Do not invent commercial facts or overwrite ERP meaning.
- Keep domain distinctions: Carga FECHADA ≠ Pedido Fechado; pedido perdido ≠ pedido ≠ ordem de serviço; live **Frete** is a Motivo de Perda, not freight calculation.
- **Route ≠ controller ≠ service.** Routes wire HTTP; controllers adapt I/O; use-cases/services own business logic; repositories own data access.
- Never use TypeScript `any`.
- **Never** run `npm run build`, `vite build`, or any production build in the agent flow. Do not suggest it.
- HTTP responses go through DTOs/mappers — do not leak Prisma or raw ERP shapes.
- Role/`codRep` scoping belongs in the **service/use-case**, not only in the UI.

## 7. Harness map

| Path | What |
| --- | --- |
| [.cursor/rules/](./.cursor/rules/) | [backend-role.md](./.cursor/rules/backend-role.md), [local-dev-ports.mdc](./.cursor/rules/local-dev-ports.mdc), [task-intake.mdc](./.cursor/rules/task-intake.mdc) |
| [.cursor/skills/](./.cursor/skills/) | [tlc-spec-driven](./.cursor/skills/tlc-spec-driven/SKILL.md), [impeccable](./.cursor/skills/impeccable/SKILL.md), [create-github-issue](./.cursor/skills/create-github-issue/SKILL.md) |
| [.agents/skills/](./.agents/skills/) | [writing-typescript](./.agents/skills/writing-typescript/SKILL.md), [tdd](./.agents/skills/tdd/SKILL.md), [code-review](./.agents/skills/code-review/SKILL.md), [diagnosing-bugs](./.agents/skills/diagnosing-bugs/SKILL.md) |
| [.cursor/agents/](./.cursor/agents/) | [task-intake](./.cursor/agents/task-intake.md) — capture ideas/bugs; do not implement |
| [.specs/](./.specs/) | Feature specs under `features/`; [OPENAPI_CONTRACT_FIRST.md](./.specs/codebase/OPENAPI_CONTRACT_FIRST.md) |
| [.github/QUALITY_GATE.md](./.github/QUALITY_GATE.md) | PR CI (lint, tsc, build, tests, coverage, size/test-count gates) |

## 8. Local verification

- Backend: `cd backend && npm test`. Integration: `npm run test:integration` when persistence or HTTP contracts changed.
- Frontend: `cd frontend && npm run lint`. Also `npm test` when you added or changed tests.
- **Do not** run `npm run build` or production Prisma scripts to “verify”.

## 9. Anti-patterns

- Growing legacy `routes/` / `controllers/` / `pages/` / `components/<area>/` instead of `features/`
- Mixing route, controller, and service in one file
- Using `any`, skipping Zod, returning raw DB/ERP rows
- Changing local ports or the `:3030` fallback in `apiBase.ts`
- Collapsing Carga / Pedido / OS / perda into one concept
- Running or suggesting a production build after code changes
- Skipping domain `CONTEXT.md` before naming fields or UI copy
