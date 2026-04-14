# Frontend Contract Guide: Cargo e Pedidos

Last updated: 2026-04-13

## Purpose

This document defines the backend contract currently expected by frontend screens that depend on cargo and order-loss flows.

## Authentication

- All endpoints below require `Authorization: Bearer <token>`
- Access is now enforced on backend by role, not only by frontend visibility rules

## Cargo Endpoints Used by Frontend

Base path: `/api/cargo`

- `GET /listar-cargas`
  - Query (optional): `situacao`
- `POST /`
  - Create cargo
- `PUT /update-carga/:id`
  - Update cargo fields
- `PATCH /:codCar/situacao`
  - Update cargo status
  - `codCar` must be numeric
- `POST /close-carga`
  - Body requires `codCar`
- `GET /pedidos-fechados`
- `GET /pedidos-fechados/:codRep`
- `PUT /update-pedido/:numPed`
  - Body: `codCar`, `posCar`
- `GET /:codCar/pedidos`
  - Query (optional): `codRep`
- `GET /cargas-fechadas`

## Orders (Order Loss) Endpoints Used by Frontend

Base path: `/api/orders`

- `GET /lost-sapiens`
  - Query (optional): `codRep`, `startDate`, `endDate`
  - Date format: `DD-MM-YYYY`
  - If both dates are provided, `startDate <= endDate`
- `POST /`
- `GET /`
- `GET /:id`
- `GET /seller/:codRep`
- `PATCH /:id/status`
- `POST /loss-reason`

## Relevant Backend Validations

- `PATCH /api/cargo/:codCar/situacao` returns `400` when `codCar` is not numeric
- `GET /api/orders/lost-sapiens` returns `400` when date format is invalid or interval is inverted
- `POST /api/orders/loss-reason`
  - `description` minimum length is 10 chars (after trim)

## Frontend implementation (service layer)

- HTTP for these domains goes through [frontend/src/lib/apiFetch.ts](frontend/src/lib/apiFetch.ts) and [frontend/src/lib/authHeaders.ts](frontend/src/lib/authHeaders.ts) (Bearer from `localStorage` key `token`).
- Cargo: [frontend/src/features/cargo/services/cargoService.ts](frontend/src/features/cargo/services/cargoService.ts) — views/hooks must not call `fetch` to `/api/cargo` directly.
- Order loss: [frontend/src/features/orderLoss/services/ordersServices.ts](frontend/src/features/orderLoss/services/ordersServices.ts) — same rule for `/api/orders`.
- Shared UI for loading/error: [frontend/src/features/orderLoss/components/OrderLossAsyncLayout.tsx](frontend/src/features/orderLoss/components/OrderLossAsyncLayout.tsx).

## Integration Notes for Frontend

- Keep seller filters (`codRep`) aligned with token context for VENDAS users
- Do not assume frontend role gating is sufficient; backend now returns `403` for unauthorized roles
- Prefer using this file as source of truth over older feature READMEs when conflicts are found
