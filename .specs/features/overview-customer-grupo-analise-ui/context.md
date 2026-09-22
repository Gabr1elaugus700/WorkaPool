# Overview Customer — Análise 5×5 (frontend) — Context

**Gathered:** 2026-09-20
**Spec:** `.specs/features/overview-customer-grupo-analise-ui/spec.md`
**Backend spec:** `.specs/features/overview-customer-grupo-analise/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Só apresentação e orquestração de fetch no detalhe do cliente. Regras de sync, SQL, join e HTTP status/códigos ficam na spec de backend.

---

## Implementation Decisions

- Seção nova no `OverviewCustomerDetailView` (não rota nova).
- Chips ABC por grupo + dois cards (verde | vermelho).
- Fetch via hook/service da feature `overviewCustomer`.
- 403 → `OverviewCustomerAccessDeniedState` existente.
- Auth matrix não é reimplementada no frontend.

---

## Specific References

- Wireframe 2026-09-20 (chips + dois cards).
- Copy PRD: `Nenhum pedido encontrado.` / `Sem justificativa registrada.`

---

## Deferred Ideas

None beyond the backend spec out-of-scope list.
