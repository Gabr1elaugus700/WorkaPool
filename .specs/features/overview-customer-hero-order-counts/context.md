# Overview Customer — Contagens no hero — Context

**Gathered:** 2026-09-21
**Spec:** `.specs/features/overview-customer-hero-order-counts/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Contagens agregadas de pedidos (totais / faturados / perdidos) em duas janelas (desde Jan/2024 e últimos 60 dias): **primeiro materializadas no sync overnight**, depois expostas no detail e renderizadas no hero. Não altera KPI grid nem Movimentação 12m.

---

## Implementation Decisions

### Semântica dos buckets

- **Totais** = faturados + perdidos (confirmado).
- **Faturados** = NF faturada (mesma regra do sync / motion atual).
- **Perdidos** = `sitped = 5` (mesma regra da Movimentação).

### Janelas

- Desde `2024-01-01` (UTC).
- Rolling 60 dias a partir do `now` do materializer (boundary UTC inclusive no dia −60).

### UI

- Estender `OverviewCustomerDetailHero` — coluna central entre identidade e Score de Saúde (região vermelha marcada pelo usuário no wireframe).
- Matriz 3×2: linhas Totais / Faturados / Perdidos; colunas Desde Jan/2024 / Últimos 60 dias.
- Zero continua visível (`0`), não some.

### Fonte de dados (etapa obrigatória)

- **Materializar** quatro contadores base no passo de recent commercial motion (`materializeOverviewCustomerRecentCommercialMotion` / sync overnight).
- Não é só campo de UI: sem essa etapa o GET não inventa números.
- Totais derivados no mapper/use-case a partir dos 4 bases (não persistir total separado).
- Snapshots antigos sem os campos novos → tratar bases como `0`.
- Sem query live Senior no GET detail.

### Remoção do tile duplicado

- Remover o tile KPI “Pedidos (desde Jan/2024)” da Visão Geral (`OverviewCustomerKpiGrid`) — evita overload com o bloco do hero.
- Sublabel “Ticket médio” sai com o tile; não relocado neste slice.
- Campos `orderCount*` no `commercialSummary` / API permanecem (só some a apresentação do tile).
- Contagens 12 meses na aba Movimentação inalteradas.

### Agent's Discretion

- Tipografia/densidade do bloco no hero (alinhar a tokens do health-score / DESIGN.md).
- Nome interno dos campos no snapshot (`invoicedCountSinceJan2024` etc.) vs nomes da API (`invoicedSinceJan2024`).

### Declined / Undiscussed Gray Areas → Assumptions

- Fonte = sync overnight (não live) — padrão Overview; registrado no spec.
- Totais derivados no read path — evita drift de persistência.

---

## Specific References

- Wireframe anotado (hero, região vermelha central) — 2026-09-21.
- Usuário: “Não é só criar o campo, adicione essa etapa” (materializar totalizadoras).
- Regras existentes: `materializeOverviewCustomerRecentCommercialMotion.ts`, `OverviewCustomerCommercialMotionSummary`.
- Nota: implementação anterior nesta branch foi revertida no working tree; reexecutar a partir deste spec.

---

## Deferred Ideas

None — discussion stayed within feature scope.
