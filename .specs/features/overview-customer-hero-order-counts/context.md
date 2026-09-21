# Overview Customer — Contagens no hero — Context

**Gathered:** 2026-09-21
**Spec:** `.specs/features/overview-customer-hero-order-counts/spec.md`
**Status:** Ready for execute

---

## Feature Boundary

Contagens agregadas de pedidos (totais / faturados / perdidos) em duas janelas (desde Jan/2024 e últimos 60 dias), expostas no detail e renderizadas no hero. Não altera KPI grid nem Movimentação 12m.

---

## Implementation Decisions

- **Totais** = faturados + perdidos (confirmado).
- **UI**: estender `OverviewCustomerDetailHero` — coluna central entre identidade e Score de Saúde (região marcada pelo usuário).
- **Fonte**: materializer `ultimo-pedido-cliente` / recent commercial motion; sync overnight; campos ausentes → `0`.
- **Totais**: calculados no mapper/use-case a partir dos 4 contadores base.
- **Faturados desde Jan/2024** no hero: da mesma fonte motion (não divergir do seed); o tile KPI continua usando `commercialSummary.orderCountSinceJan2024`.

---

## Specific References

- Wireframe anotado (hero, região vermelha central) — 2026-09-21.
- Regras existentes: `materializeOverviewCustomerRecentCommercialMotion.ts`, `OverviewCustomerCommercialMotionSummary`.

---

## Deferred Ideas

None.
