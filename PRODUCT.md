# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal staff at **Pool Técnica** who operate sales, logistics, warehouse, and facility workflows through a single authenticated web app.

Primary day-to-day audiences (by role):

- **VENDAS** — negotiate pedidos, track order loss, follow metas, and review commercial outcomes
- **LOGISTICA** — assemble and close **Cargas** from **Pedidos Fechados**, monitor load integrity, and coordinate shipping readiness
- **ADMIN** — manage users, access, and cross-cutting configuration
- **GERENTE** — oversight across teams (sales and operations visibility)
- **ALMOX** — warehouse/stock-related workflows tied to facility and inventory views

Some modules and views are discontinued; do not treat every legacy route as active product surface without confirming current use.

## Product Purpose

WorkaPool is Pool Técnica's internal operations hub: it layers task-focused workflows on top of **Sapiens** (ERP) so teams can move faster on cargas, commercial follow-up, facility tickets, and sales targets without re-keying or contradicting ERP truth.

Success means:

- **Operational accuracy** — app state and actions stay aligned with Sapiens and established domain terminology
- **Speed** — core jobs (close cargas, record perdas, progress OS, check metas) take fewer steps and less manual coordination than before

## Positioning

WorkaPool is not a generic ERP client. It encodes Pool Técnica's operational language and workflows—**Carga** vs **Pedido Fechado**, **Negociação** vs **Pedido perdido**, **Ordem de Serviço** as a separate concern from commercial orders—and enforces role-scoped access on top of Sapiens as system of record.

## Operating Context

- **Sapiens** is the external ERP for pedidos, clientes, and representantes
- **poolbi** is a separate reporting database (product-group labels); not a domain actor
- Staff work in Portuguese (Brazil) with domain terms defined in bounded-context docs under `backend/src/features/*/CONTEXT.md` and `CONTEXT-MAP.md`
- Typical environment: LAN-hosted deployment (`pooltecnica.no-ip.biz`); local dev uses Vite (`frontend/`, port 5858) and Express API (`backend/`, port 3001)
- Architecture is mid-migration: feature modules (`src/features/*`) coexist with legacy pages/components/services

### Active bounded contexts

- **Pedidos** — shared kernel (ERP pedido as commercial fact); not a standalone product surface
- **Cargo** — assemble truck loads from Pedidos Fechados; weight integrity and close workflow
- **Order Loss** — commercial negotiation tracking and justified perdas (Motivo de Perda)
- **Ordem de Serviço** — facility maintenance tickets, vistorias, and checklists by departamento
- **Metas** — sales targets by representante, product group, and period
- **Identity** — users, roles, and representante linkage (`codRep`)

### Discontinued

- **Frete (cálculo)** — route/truck freight cost estimation is discontinued; in live language **Frete** means only a Motivo de Perda code
- Additional discontinued modules/views exist; confirm before investing in UI for legacy routes (e.g. `/fretes`, inactive dashboards)

## Capabilities and Constraints

- JWT authentication with role-based authorization (`ADMIN`, `USER`, `VENDAS`, `LOGISTICA`, `ALMOX`, `GERENTE_DPTO`)
- Integrations: Sapiens/SQL Server, SOAP, scheduled jobs, Prisma/PostgreSQL for app persistence
- **Sapiens is source of truth** — the app must not contradict ERP data or invent commercial facts
- **Role scoping** defines what each profile sees and can change
- **Internal-only** — not a public or marketing product; no fabricated customers, pricing, or external proof
- Preserve domain distinctions documented in context files (e.g. Carga FECHADA ≠ Pedido Fechado; pedido perdido ≠ ordem de serviço)
- UI copy and labels should stay in **português (BR)** with established terminology

## Brand Commitments

- Product name: **WorkaPool** (avoid "Pool" alone, Sapiens, or poolbi when naming the app)
- Organization: **Pool Técnica** (internal staff audience)
- Existing assets: `frontend/src/assets/logo.svg`, page title "WorkaPool" in `frontend/index.html`
- Voice: practical, operational, domain-precise; mixed Portuguese domain terms with some English in code identifiers

## Evidence on Hand

- Domain language and relationships: `CONTEXT-MAP.md`, `backend/src/features/*/CONTEXT.md`
- Codebase maps: `docs/CODEBASE_MAP.md`, `docs/FRONTEND.md`, `docs/BACKEND.md`
- Runnable UI with established routes (cargo, order loss, OS, users, metas, pedidos, clientes, dashboards)
- No external testimonials, case studies, or marketing claims to reuse
- Do not fabricate ERP data, customer names, benchmarks, or deployment statistics

## Product Principles

1. **ERP truth first** — surface and actions reflect Sapiens; conflicts are bugs, not design choices
2. **Speed on the critical path** — optimize the workflows staff repeat daily (cargas, perdas, OS, metas)
3. **Say the domain word** — use Carga, Pedido Fechado, Negociação, Motivo de Perda, Ordem de Serviço as defined; never collapse distinct concepts
4. **Scope by role** — each screen earns its place for VENDAS, LOGISTICA, ALMOX, GERENTE, or ADMIN; hide or gate what a role cannot use
5. **Internal clarity over polish theater** — Operate mode: scanability, consistency, and task completion outrank decorative expression

## Accessibility & Inclusion

No formal accessibility standard confirmed for this product. Default to readable contrast, keyboard-usable controls, and clear labels in Portuguese; escalate if Pool Técnica adopts a specific requirement.
