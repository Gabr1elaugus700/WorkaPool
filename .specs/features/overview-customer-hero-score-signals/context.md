# Overview Customer — Hero Score Signals Context

**Gathered:** 2026-09-21
**Spec:** `.specs/features/overview-customer-hero-score-signals/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Rearranjo visual do hero do detail: contagens de pedidos embutidas no card Score de Saúde (removendo maior/menor margem e o bloco intermediário Pedidos); frequência em dias inteiros; KPI sem repetir frequência e dias desde última compra. Sem mudança de sync/API de `orderCounts`.

---

## Implementation Decisions

### Layout do hero

- Remover `OverviewCustomerHeroOrderCounts` como coluna intermediária do hero.
- Embutir a matriz 3×2 (Totais / Faturados / Perdidos × Desde Jan/2024 / Últimos 60 dias) dentro de `OverviewCustomerHealthScoreMock` (ou sucessor do mesmo card).
- Permitir aumentar largura/`max-w` do card Score para acomodar a matriz legível em `md+`.
- Manter: score mock 92/100, badge, nota “Indicador em desenvolvimento”, Dias desde última compra, Frequência média.

### O que sai do Score

- Remover UI de “Maior margem (pedido ganho)” e “Menor margem vendida”.
- Não exige remover campos do payload `commercialSummary`.

### Frequência

- Arredondar com `Math.round` no formatador compartilhado de frequência de compra.
- Exibir `1 dia` / `N dias` sem fração.
- `null` → “Não informado”.

### KPI Visão Geral

- Remover tiles “Frequência média (dias)” e “Dias desde última compra”.
- Manter demais tiles (Faturamento, Volume, Margem ponderada, etc.).

### Dados

- Reusar `detail.orderCounts` já exposto pela API; absent → zeros via resolve existente.

---

## Deferred Ideas

- Evoluir o score 92/100 de mock para cálculo real.
- Relocar maior/menor margem para outra aba se algum dia forem úteis de novo.

---

## Notes

- Screenshot de referência: hero com matriz no meio + Score com margens; alvo é consolidar matriz no Score e limpar KPI.
- Feature anterior relacionada: `overview-customer-hero-order-counts` (fonte de `orderCounts`).
