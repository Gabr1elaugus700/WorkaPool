# Backend Codebase Map

Last updated: 2026-04-13

## Overview

The backend is a TypeScript + Express API in `backend/` with mixed architectural style:
- Legacy route/service/repository modules under `src/routes`, `src/controllers`, `src/services`, and `src/repositories`
- Newer domain-oriented modules under `src/features/*` (e.g. `cargo`, `goals`, `orderLoss`, `workOrder`, `users`)

Core entrypoints:
- `src/server.ts`: bootstraps env, starts watchdog scheduler, starts HTTP server
- `src/app.ts`: creates the Express app, registers middleware, routes, and global error handler
- `src/swagger.ts`: OpenAPI/Swagger configuration

## Tech Stack

- Runtime: Node.js
- Language: TypeScript (CommonJS output)
- HTTP: Express 5 + CORS + multer
- Auth: JWT (`jsonwebtoken`) + bcrypt
- DB access:
  - PostgreSQL via Prisma (`prisma/schema.prisma`)
  - SQL Server via `mssql` (Sapiens integration)
- Scheduling: `node-cron` (watchdog)
- Docs: `swagger-jsdoc` + `swagger-ui-express`
- Tests: Node test runner via `tsx --test` + `supertest`

## Directory Map

Top-level backend layout:
- `backend/src/app.ts`, `backend/src/server.ts`
- `backend/src/features/`
  - `cargo/`
  - `goals/`
  - `orderLoss/`
  - `workOrder/`
  - `users/`
  - `departamentos/`
  - `pedidos/`
- `backend/src/routes/` (legacy route modules)
- `backend/src/controllers/` (legacy controllers)
- `backend/src/services/` (legacy service layer and external integrations)
- `backend/src/repositories/` (legacy repositories)
- `backend/src/middlewares/` (`authMiddleware`, `validate`)
- `backend/src/schedulers/watchdog/`
- `backend/prisma/` (schema and migrations)
- `backend/test/` and `backend/src/test/` (unit tests)

## API Surface (High-Level)

Registered in `src/app.ts`:
- Health: `GET /health`
- Auth/User:
  - `/api/auth` (login/register/change-password-first-login)
  - `/api/users`
- Cargo/freight/logistics:
  - `/api/cargo`
  - `/api/caminhoes`
  - `/api/parametrosFretes`
  - `/api/fretes`
- Sales and metrics:
  - `/api/faturamento`
  - `/api/rankingProdutos`
  - `/api/metas`
  - `/api/goals`
- Orders and loss tracking:
  - `/api/orders`
  - `/api/produtos`
  - `/api/vendedores`
  - `/api/clientes-inativos`
  - `/api/teste`
- Work order / inspection:
  - `/api/os`
  - `/api/item-checklist`
  - `/api/checklist-modelo`
  - `/api/vistoria`
  - `/api/checklist-vistoria`
  - `/api/departamentos`
- Static uploads: `/uploads`

## Data Model

`prisma/schema.prisma` includes major domains:
- Identity/authorization: `User`, `Role`
- Freight/cargo: `Cargas`, `CargasFechadas`, truck and route models
- Goals/KPIs: `Metas`, `Goals`, `CalendarioMetas`
- Work order and inspections: `WorkOrder`, `OrdemServico`, `Inspection`, `Vistoria`, checklist models
- Department management: `Departamento`, `UsuarioDepartamento`
- Order loss: `Order`, `OrderProduct`, `LossReason`

The schema mixes Portuguese and English model naming due to incremental evolution.

## Conventions Observed

- Feature folders often follow: `entities` + `useCases` + `repositories` + `http` (controllers/routes/schemas)
- Validation schemas are colocated (`schemas`/`validations`) and enforced via middleware
- Naming is mixed:
  - Files: mostly `camelCase.ts` and `PascalCase.ts`
  - Some use `.use-case.ts` suffix in cargo feature
- API route naming is mostly kebab-case, with some legacy inconsistencies
- Logs/comments are predominantly in Portuguese

## Environment and Runbook

Main scripts in `backend/package.json`:
- `npm run dev`: development server (`ts-node-dev`)
- `npm run build`: TypeScript build
- `npm run start`: run production build
- `npm run test`: unit tests (`cross-env NODE_ENV=test tsx --test ...`)

Prisma workflows (use this script ever, because a production Enviroment!!):
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run db:setup`

## Risks and Cleanup Opportunities

- Mixed legacy + feature architecture increases navigation overhead
- Duplicate/near-duplicate domain concepts (e.g. `OrdemServico` and `WorkOrder`) may cause drift
- Route naming inconsistencies (`/api/produ tosEstoque` appears typo-prone in app route registration)
- Security hardening opportunity: middleware has fallback JWT secret for development
- Tests exist but are not evenly distributed across all features

## Cargo + Pedidos Decisions (2026-04-13)

- `pedidos` remains an internal domain module under `src/features/pedidos` (no `/api/pedidos` routes yet)
- Shared contracts were consolidated via `pedidos` exports (including `PedidosSapiensFiltersDTO`)
- `cargo` and `orderLoss` consume `pedidos` through repository/service interfaces

## Contract and Security Updates (2026-04-13)

- Fixed route/controller mismatch in cargo status update:
  - route now uses `PATCH /api/cargo/:codCar/situacao`
  - controller validates `codCar` as numeric and returns `400` on invalid input
- Added backend auth and role checks to critical `cargo` and `orders` routes via:
  - `authMiddleware`
  - `requireRoles`
- `orderLoss` filter schema now validates `codRep`, `startDate`, `endDate` and date interval consistency
- Sapiens lost-orders query now uses parameterized inputs instead of string interpolation

## Test Coverage Added (Cargo + OrderLoss)

- `test/unit/features/cargo/cargoRoutesAuth.test.ts`
  - validates unauthorized (`401`), forbidden (`403`), and invalid route param (`400`)
- `test/unit/features/orderLoss/orderSchemas.test.ts`
  - validates date filter format and start/end consistency
