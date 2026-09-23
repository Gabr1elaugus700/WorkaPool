# Overview Customer — Sinais do Score + frequência inteira

## Problem Statement

No detail do cliente, o card Score de Saúde 360° ainda mostra maior/menor margem (pouco úteis) enquanto as contagens de pedidos ficam num bloco intermediário separado. Frequência média aparece com decimais (`1,29 dias`) e o KPI da Visão Geral repete frequência e dias desde a última compra já visíveis no Score.

## Goals

- [ ] Contagens de pedidos (faturados / perdidos / totais × desde Jan/2024 e últimos 60 dias) vivem dentro do card Score de Saúde; o bloco intermediário “Pedidos” some do hero.
- [ ] Frequência média de compra no detail exibe apenas dias inteiros (arredondamento ao mais próximo).
- [ ] KPI da Visão Geral não repete Frequência média nem Dias desde última compra.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Recalcular ou persistir `orderCounts` / sync overnight | Já entregue em overview-customer-hero-order-counts |
| Alterar fórmula do score 92/100 ou badge “Saudável” | Continua mock / em desenvolvimento |
| Remover margens do contrato de API (`commercialSummary`) | Só UI do Score; campos podem permanecer no payload |
| Footer do hero (vendedor, cadastro, 1ª/última/próx. compra) | Mantido |
| Alterar `CommercialSummaryCard` legado fora do detail atual | Fora do hero/KPI desta tela |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Bloco intermediário HeroOrderCounts | Remover do hero | Evita duplicar as contagens no Score | y |
| Layout das contagens no Score | Embutir matriz 3×2 no mesmo componente; card pode alargar | Usuário aprovou embutir e aumentar tamanho se preciso | y |
| Arredondamento de frequência | `Math.round` (meio para cima no padrão JS) | “pra cima ou pra baixo” = vizinho mais próximo; dias concretos | y |
| Escopo do arredondamento | Todo formatador de frequência usado no detail do overview customer (Score + qualquer surface que use o mesmo helper) | Uma regra, sem vírgula em lugar nenhum da tela | y |
| Labels da matriz no Score | Manter Totais / Faturados / Perdidos × Desde Jan/2024 / Últimos 60 dias | Mesma linguagem do bloco removido | y |
| `orderCounts` ausente | Exibir zeros (mesmo resolve do hero counts) | Consistente com HEROOC | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Contagens dentro do Score de Saúde ⭐ MVP

**User Story**: Como vendedor/gerente no detail do cliente, quero ver faturados, perdidos e totais (desde Jan/2024 e últimos 60 dias) no card Score de Saúde, sem o bloco intermediário de Pedidos, para um hero mais limpo.

**Why P1**: Remove indicadores de margem pouco usados e consolida o sinal comercial no card principal.

**Acceptance Criteria**:

1. WHEN the customer detail hero renders THEN the system SHALL NOT render the standalone `OverviewCustomerHeroOrderCounts` block between identity and the health-score card.
2. WHEN the health-score card renders with `orderCounts` THEN the system SHALL show a 3×2 matrix with rows Totais, Faturados, and Perdidos and columns Desde Jan/2024 and Últimos 60 dias, using the six non-negative integers from `orderCounts`.
3. WHEN the health-score card renders THEN the system SHALL NOT show “Maior margem (pedido ganho)” or “Menor margem vendida”.
4. The health-score card SHALL continue to show Score de Saúde 360° (score mock, badge, nota “Indicador em desenvolvimento”), “Dias desde última compra”, and “Frequência média”.
5. IF `orderCounts` is absent on the payload THEN the system SHALL render all six matrix values as `0`.
6. The system SHALL allow the health-score card to grow in width/layout so the embedded matrix remains readable on `md+` viewports.

**Independent Test**: Open a detail with known `orderCounts`; confirm matrix inside Score, no middle Pedidos block, no margin labels; absent payload shows zeros.

---

### P1: Frequência em dias inteiros ⭐ MVP

**User Story**: Como usuário do detail, quero ver frequência média só em dias inteiros para refletir dias concretos de compra.

**Why P1**: Decimais (`1,29 dias`) não fazem sentido operacional.

**Acceptance Criteria**:

1. WHEN `purchaseFrequencyDays` is a finite number THEN the system SHALL display frequency using `Math.round` of that value as a whole number of days (pt-BR singular/plural: `1 dia` / `N dias`).
2. WHEN `purchaseFrequencyDays` is `null` THEN the system SHALL display “Não informado”.
3. The system SHALL apply the same whole-day frequency formatting wherever the shared purchase-frequency formatter is used on the overview-customer detail surfaces covered by this feature.

**Independent Test**: Feed `1.29` → see `1 dia`; feed `1.5` → see `2 dias`; `null` → “Não informado”.

---

### P1: KPI sem repetição de frequência / dias ⭐ MVP

**User Story**: Como usuário na Visão Geral, quero que o grid de KPI não repita frequência média e dias desde a última compra já mostrados no Score.

**Why P1**: Remove ruído visual e overload.

**Acceptance Criteria**:

1. WHEN the Visão Geral KPI grid renders THEN the system SHALL NOT render a tile labeled “Frequência média (dias)”.
2. WHEN the Visão Geral KPI grid renders THEN the system SHALL NOT render a tile labeled “Dias desde última compra”.
3. The system SHALL leave remaining KPI tiles (Faturamento, Volume, Margem ponderada, and any other tiles still in scope after prior Pedidos removal) unchanged in meaning.

**Independent Test**: KPI markup has no those two labels; Faturamento/Volume/Margem still present.

---

## Edge Cases

- IF `orderCounts` is missing THEN the system SHALL show six zeros in the Score matrix (no throw).
- IF `purchaseFrequencyDays` is negative THEN the system SHALL still round with `Math.round` and display the resulting integer day label (no special clamp required beyond existing null handling).
- WHEN viewport is below `md` THEN the system SHALL keep identity, Score (with matrix), and footer stacked without reintroducing the middle Pedidos-only column.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| HSSIG-01 | P1: Contagens no Score | Specify | Pending |
| HSSIG-02 | P1: Contagens no Score | Specify | Pending |
| HSSIG-03 | P1: Contagens no Score | Specify | Pending |
| HSSIG-04 | P1: Contagens no Score | Specify | Pending |
| HSSIG-05 | P1: Contagens no Score | Specify | Pending |
| HSSIG-06 | P1: Contagens no Score | Specify | Pending |
| HSSIG-07 | P1: Frequência inteira | Specify | Pending |
| HSSIG-08 | P1: Frequência inteira | Specify | Pending |
| HSSIG-09 | P1: Frequência inteira | Specify | Pending |
| HSSIG-10 | P1: KPI sem repetição | Specify | Pending |
| HSSIG-11 | P1: KPI sem repetição | Specify | Pending |
| HSSIG-12 | P1: KPI sem repetição | Specify | Pending |

**ID format:** `HSSIG-NN` (Hero Score Signals)

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 12 total, 0 mapped to tasks, 12 unmapped

---

## Success Criteria

- [ ] Hero: identity | Score (com matriz de pedidos) | sem bloco Pedidos intermediário; sem maior/menor margem no Score.
- [ ] Frequência média nunca mostra casas decimais no detail.
- [ ] KPI Visão Geral sem tiles de Frequência média e Dias desde última compra.
