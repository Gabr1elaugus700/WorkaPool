# Backend Codebase Map

Last updated: 2026-09-18

## Overview

TypeScript + Express API in `backend/`. **New work goes in `src/features/<domain>/`.** Root `src/{routes,controllers,services,repositories}` is **legacy, maintain-only** — do not add new domains there. Aligns with [AGENTS.md](../AGENTS.md).

Core entrypoints:

- `src/server.ts` — loads env, listens (`process.env.PORT`; local canonical **3001**, see [.cursor/rules/local-dev-ports.mdc](../.cursor/rules/local-dev-ports.mdc)). Watchdog start is currently commented out.
- `src/app.ts` — Express app: CORS, JSON, Swagger, route mount, `/health`, `/uploads`, global error handler
- `src/swagger.ts` — re-exports `setupSwagger` from `src/docs/swagger.ts`
- `src/docs/` — contract-first OpenAPI (`openapi/`, `paths/`, `schemas/`)

`src/index.ts` is not the HTTP bootstrap.

## Architectural direction

Feature-first, incremental migration. Each domain already under `features/` owns new endpoints, use-cases, and persistence for that domain. Cross-cutting code stays in `middlewares/`, `config/`, `utils/`, `schedulers/`.

Read the domain [CONTEXT.md](../CONTEXT-MAP.md) before naming. `departamentos` has no `CONTEXT.md` yet.

Placement: [.agents/skills/writing-typescript](../.agents/skills/writing-typescript/SKILL.md). HTTP contracts: [.specs/codebase/OPENAPI_CONTRACT_FIRST.md](../.specs/codebase/OPENAPI_CONTRACT_FIRST.md).

Hard rules (do not contradict [AGENTS.md](../AGENTS.md)):

- Route ≠ controller ≠ service. Routes wire HTTP; controllers adapt I/O; use-cases/services own logic; repositories own data access.
- No TypeScript `any`. Validate with Zod. Map to DTOs — do not leak Prisma or raw ERP shapes.
- Role / `codRep` scoping belongs in the use-case/service, not only in the UI.
- Sapiens is source of truth. Carga FECHADA ≠ Pedido Fechado; pedido perdido ≠ pedido ≠ ordem de serviço. Live **Frete** is a Motivo de Perda, not freight calculation.
- Never run `npm run build` or production Prisma scripts to verify agent work.

## Tech stack

- Runtime: Node.js (CommonJS)
- Language: TypeScript
- HTTP: Express 5 + CORS + multer
- Auth: JWT (`jsonwebtoken`) + bcrypt
- Validation: Zod
- DB:
  - PostgreSQL via Prisma (`prisma/schema.dev.prisma` for local/test, `prisma/schema.prisma` for production)
  - SQL Server via `mssql` (`src/database/sqlServer.ts`) for Sapiens
- SOAP: `soap` (ERP integrations)
- Scheduling: `node-cron` (`src/schedulers/watchdog/`)
- Docs: `swagger-ui-express` + in-repo OpenAPI builder (`src/docs/openapi/`). Not swagger-jsdoc.
- Tests: Node test runner via `tsx --test` + `supertest` (`backend/test/unit`, `backend/test/integration`)

## Feature modules (`src/features/`)

On disk today:

| Domain | Folder | CONTEXT.md | Layout | HTTP |
| --- | --- | --- | --- | --- |
| Cargo | `cargo/` | yes | `entities`, `useCases`, `repositories`, `services`, `http/{controllers,routes,schemas}` | `/api/cargo` |
| Pedidos | `pedidos/` | yes | shared kernel: `entities`, `contracts`, `mappers`, `queries`, `repositories`, `services`, `types` (`index.ts` barrel already exists — do not expand it for new files) | **none** — consumed by cargo and orderLoss |
| Order Loss | `orderLoss/` | yes | `entities`, `useCases`, `repositories`, `http/{controllers,routes,schemas}` | `/api/orders` |
| Metas | `goals/` | yes | `entities`, `useCases`, `repositories`, `mappers`, `http/{controllers,routes,schemas}` | `/api/goals` |
| Identity | `users/` | yes | flat `controllers`, `routes`, `schemas`, `services`, `repositories`, plus `contracts/` (OpenAPI) | `/api/auth`, `/api/users` |
| Ordem de Serviço | `workOrder/` | yes | flat `controllers`, `routes`, `services`, `repositories`, `entities`, `types`, `validations` | `/api/os`, `/api/item-checklist`, `/api/checklist-modelo`, `/api/vistoria`, `/api/checklist-vistoria` |
| Departamentos | `departamentos/` | **no** | flat `controllers`, `routes`, `schemas`, `services`, `repositories` | `/api/departamentos` |

Match the folder style already used by that feature (`http/` vs flat). New domain actions go in that feature’s `useCases/` (or `services/` if the feature has not adopted use-cases).

## Legacy (`src/controllers`, `routes`, `services`, `repositories`)

Still mounted from `app.ts`. **Maintain only.** Do not add new domains or endpoints here when a feature folder already owns the concept (e.g. do not grow root `metas*` — extend `features/goals`).

| Area | Typical files | Mount in `app.ts` |
| --- | --- | --- |
| Sapiens commercial / stock | produtos, vendedores, faturamento (`totalFatVendedor`), ranking, estoque, clientes inativos, teste conexão | `/api/produtos`, `/api/vendedores`, `/api/faturamento`, `/api/rankingProdutos`, `/api/produtosEstoque`, `/api/clientes-inativos`, `/api/teste` |
| Metas (older Prisma path) | `metasController` / `metasRoutes` / `metasService` / `metasRepository` | `/api/metas` (parallel to `/api/goals`) |
| Frete cálculo (discontinued) | caminhoes, parametrosFretes, fretes, rotas / googleRoutes | `/api/caminhoes`, `/api/parametrosFretes`, `/api/fretes` |

Other backend roots (not feature, not the legacy quartet):

- `src/middlewares/` — `authMiddleware`, `validate`
- `src/config/` — `env.ts`, `prisma.ts`
- `src/utils/` — `AppError`, date/helpers
- `src/schedulers/watchdog/`
- `src/database/sqlServer.ts`
- `src/docs/` — OpenAPI
- `src/generated/` — generated client artifacts
- `prisma/` — schemas and migrations
- `test/` — unit + integration (preferred). Leftover: `src/test/unit/routes/goalsRoutes.test.ts`

## API surface (high-level)

Registered in `src/app.ts`:

- Health: `GET /health`
- Docs: Swagger UI `/api/docs`
- Identity: `/api/auth`, `/api/users`
- Cargo: `/api/cargo`
- Order Loss: `/api/orders`
- Metas: `/api/goals` (feature) and `/api/metas` (legacy)
- OS / inspections: `/api/os`, `/api/item-checklist`, `/api/checklist-modelo`, `/api/vistoria`, `/api/checklist-vistoria`, `/api/departamentos`
- Legacy Sapiens/reporting: `/api/teste`, `/api/faturamento`, `/api/rankingProdutos`, `/api/produtos`, `/api/vendedores`, `/api/clientes-inativos`, `/api/produtosEstoque`
- Discontinued frete cálculo: `/api/caminhoes`, `/api/parametrosFretes`, `/api/fretes`
- Static: `/uploads`

Path-level detail for cargo/orders used by the SPA: [FRONTEND_CARGO_PEDIDOS_API.md](./FRONTEND_CARGO_PEDIDOS_API.md). Broader list: [backend/docs/API_ROUTES.md](../backend/docs/API_ROUTES.md) (verify against `app.ts` if they drift).

## Data model

`prisma/schema.prisma` (and the dev twin `schema.dev.prisma`) mix Portuguese and English names. Major models:

- Identity: `User` (+ Role enum)
- Cargo: `Cargas`, `CargasFechadas`, `HistoricoPesoPedidos`, truck/route leftovers (`Trucks`, `Caminhao`, `Rota_base`, `CaminhaoRota`, `ParametrosGlobaisViagem`, `SolicitacaoRota`)
- Metas: `Metas`, `Goals`, `CalendarioMetas`
- OS / inspections: `OrdemServico` and `WorkOrder` (duplicate-era pair), images, `Inspection` / `Vistoria`, checklist model pairs, `Departamento`, `UsuarioDepartamento`
- Order Loss: `Order`, `OrderProduct`, `LossReason`

Duplicate concepts (`OrdemServico`/`WorkOrder`, `Metas`/`Goals`, dual checklist tables) are migration residue — do not invent a third name.

## Conventions observed

- Preferred feature shape: `entities` + `useCases` + `repositories` + `http` (controllers/routes/schemas). `cargo`, `orderLoss`, and `goals` follow this. `users`, `workOrder`, and `departamentos` still use flat `controllers`/`routes` inside the feature.
- Zod schemas colocated; `validate` middleware on routes.
- OpenAPI: Zod is the source of truth; do not paste `@openapi` JSDoc into routes/controllers. Feature `contracts/` + `src/docs/paths/` re-export into the spec.
- File names: mostly `camelCase.ts` / `PascalCase.ts`; cargo use-cases use `.use-case.ts`.
- API paths: mostly kebab-case, with legacy camelCase leftovers (`/api/produtosEstoque`, `/api/rankingProdutos`).
- Logs and many comments: Portuguese.

Still true from the 2026-04 cargo/order-loss work (do not regress):

- `pedidos` is internal only (no `/api/pedidos`). Shared filters include `PedidosSapiensFiltersDTO`.
- Cargo status update is `PATCH /api/cargo/:codCar/situacao` (`codCar` numeric → 400 if invalid).
- Critical cargo and orders routes use `authMiddleware` + `requireRoles`.
- Order Loss filter schema validates `codRep`, `startDate`, `endDate`.
- Sapiens lost-order queries use parameterized inputs.

## Environment and runbook

Scripts in `backend/package.json`:

- `npm run dev` — `ts-node-dev` on `src/server.ts`
- `npm test` — unit tests
- `npm run test:integration` — when persistence or HTTP contracts changed
- `npm run test:all` / `npm run test:coverage` / `npm run test:watch`

Prisma (local/dev schemas only in agent flow):

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run db:setup`

Do **not** run `npm run build`, `deploy`, or `*:prod` Prisma scripts to verify. Production schema and migrate scripts exist for operators, not for the agent loop.

## Tests (current layout)

- `test/unit/features/cargo/`
- `test/unit/features/orderLoss/`
- `test/unit/features/pedidos/`
- `test/unit/schedulers/watchdog/`
- `test/integration/features/cargo/`
- Leftover under `src/test/` (goals routes)

Coverage is uneven; add tests next to the feature you change (`test/unit/features/<domain>/`).

## Risks (navigation, not a backlog)

- Mixed feature + legacy trees — default to `features/` when unsure.
- Parallel metas APIs (`/api/metas` vs `/api/goals`) and dual OS models.
- Discontinued frete modules still mounted.
- CORS allowlist and JWT fallback secrets are environment-sensitive; do not “fix” local ports or `apiBase` production fallback from this map.

## Where to read next

- Monorepo map: [CODEBASE_MAP.md](./CODEBASE_MAP.md)
- Frontend map: [FRONTEND.md](./FRONTEND.md)
- Product / language: [PRODUCT.md](../PRODUCT.md), [CONTEXT-MAP.md](../CONTEXT-MAP.md)
- Agent entry: [AGENTS.md](../AGENTS.md)
- Backend role rule: [.cursor/rules/backend-role.md](../.cursor/rules/backend-role.md)
- Specs: [.specs/features/](../.specs/features/), [.specs/codebase/OPENAPI_CONTRACT_FIRST.md](../.specs/codebase/OPENAPI_CONTRACT_FIRST.md)
- Domain language: [cargo](../backend/src/features/cargo/CONTEXT.md), [pedidos](../backend/src/features/pedidos/CONTEXT.md), [orderLoss](../backend/src/features/orderLoss/CONTEXT.md), [workOrder](../backend/src/features/workOrder/CONTEXT.md), [goals](../backend/src/features/goals/CONTEXT.md), [users](../backend/src/features/users/CONTEXT.md)
