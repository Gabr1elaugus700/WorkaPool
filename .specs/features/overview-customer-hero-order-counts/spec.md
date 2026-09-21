# Overview Customer — Contagens de pedidos no hero

## Problem Statement

No detalhe do cliente, o vendedor vê faturamento/volume e um único tile de “Pedidos (desde Jan/2024)” (só faturados), sem contraste rápido entre faturados, perdidos e o total — nem recência (60 dias). A decisão comercial precisa dessas contagens no hero, ao lado da identidade.

## Goals

- [ ] Expor no `GET /api/overview/customers/:clienteId` as contagens faturadas, perdidas e totais desde Jan/2024 e nos últimos 60 dias.
- [ ] Mostrar essas seis métricas no hero existente, entre identidade e Score de Saúde.
- [ ] Reutilizar o pipeline de sync overnight (sem query live no GET).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Alterar KPI grid / tile “Pedidos (desde Jan/2024)” | Permanece como está |
| Substituir contagens de 12 meses na aba Movimentação | Fora do pedido |
| Query live Senior no GET detail | Mesmo padrão snapshot dos demais KPIs |
| Contagens por grupo ABC | Spec irmã de análise por grupo |
| Lista de pedidos no hero | Só quantidades agregadas |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Totais | `faturados + perdidos` por janela | Confirmado pelo usuário | y |
| Faturados | NF faturada (regra do sync atual) | Consistência com KPI / motion | y |
| Perdidos | `sitped = 5` | Mesma regra da Movimentação | y |
| Janelas | desde `2024-01-01` e rolling 60 dias | Pedido do usuário | y |
| UI | Coluna central do `OverviewCustomerDetailHero` | Wireframe anotado pelo usuário | y |
| Fonte | Snapshot overnight; campos ausentes → `0` | Compatibilidade com snapshots antigos | y |
| Totais derivados | Calculados no mapper/use-case a partir dos 4 contadores base | Evita divergência de persistência | y |
| KPI 12m / tile Pedidos | Inalterados | Escopo explícito | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Contagens no contrato do detail ⭐ MVP

**User Story**: Como consumidor da API de detalhe, quero `orderCounts` com faturados, perdidos e totais (desde Jan/2024 e últimos 60 dias) para renderizar o hero sem outro endpoint.

**Why P1**: Sem contrato não há UI.

**Acceptance Criteria**:

1. WHEN the detail endpoint returns a customer THEN the system SHALL include an `orderCounts` object with `invoicedSinceJan2024`, `lostSinceJan2024`, `totalSinceJan2024`, `invoicedLast60Days`, `lostLast60Days`, and `totalLast60Days` as non-negative integers.
2. The system SHALL set `totalSinceJan2024` equal to `invoicedSinceJan2024 + lostSinceJan2024`.
3. The system SHALL set `totalLast60Days` equal to `invoicedLast60Days + lostLast60Days`.
4. WHEN a served snapshot lacks the new base count fields THEN the system SHALL treat each missing base count as `0`.
5. The system SHALL derive the four base counts from the overnight recent-commercial-motion materializer (same invoiced/lost rules as existing 12-month motion counts).
6. The system SHALL NOT change `commercialSummary.orderCountSinceJan2024` semantics or the 12-month motion count fields.

**Independent Test**: Unit-test materializer cutoffs + detail mapper totals; fixture snapshot without new fields yields zeros.

---

### P1: Bloco de contagens no hero ⭐ MVP

**User Story**: Como usuário do Overview, quero ver totais, faturados e perdidos (desde Jan/2024 e últimos 60 dias) no card do hero, entre a identidade e o Score de Saúde.

**Why P1**: É o job visual do pedido.

**Acceptance Criteria**:

1. WHEN the customer detail hero renders with `orderCounts` THEN the system SHALL show a counts block between the identity column and the health-score column on `md+` viewports.
2. WHEN the counts block renders THEN the system SHALL display three rows (Totais, Faturados, Perdidos) and two columns (Desde Jan/2024, Últimos 60 dias) with the corresponding numbers.
3. WHEN any count is `0` THEN the system SHALL still display `0` (not hide the cell).
4. IF `orderCounts` is absent on the payload THEN the system SHALL render all six values as `0`.
5. The system SHALL keep the existing KPI grid tile “Pedidos (desde Jan/2024)” and the Movimentação 12-month counts unchanged.
6. WHILE viewport is below `md` THEN the system SHALL stack the counts block between identity and health score (not hide it).

**Independent Test**: Render hero with fixture counts; assert labels, six values, and layout order; assert KPI/motion consumers unchanged.

---

## Edge Cases

- IF the snapshot has invoiced lines but no lost rows THEN the system SHALL show lost counts as `0` and totals equal to invoiced.
- IF an order occurred exactly 60 days before `now` (UTC date boundary used by the materializer) THEN the system SHALL include it in the last-60-days window.
- IF an order occurred 61 days before `now` THEN the system SHALL exclude it from the last-60-days window and still include it in since-Jan/2024 when on/after `2024-01-01`.
- IF an order date is before `2024-01-01` THEN the system SHALL exclude it from all hero `orderCounts` windows (seed cutoff).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| HEROOC-01 | P1: Contagens no contrato | Execute | Pending |
| HEROOC-02 | P1: Contagens no contrato | Execute | Pending |
| HEROOC-03 | P1: Contagens no contrato | Execute | Pending |
| HEROOC-04 | P1: Contagens no contrato | Execute | Pending |
| HEROOC-05 | P1: Contagens no contrato | Execute | Pending |
| HEROOC-06 | P1: Contagens no contrato | Execute | Pending |
| HEROOC-07 | P1: Bloco no hero | Execute | Pending |
| HEROOC-08 | P1: Bloco no hero | Execute | Pending |
| HEROOC-09 | P1: Bloco no hero | Execute | Pending |
| HEROOC-10 | P1: Bloco no hero | Execute | Pending |
| HEROOC-11 | P1: Bloco no hero | Execute | Pending |
| HEROOC-12 | P1: Bloco no hero | Execute | Pending |

**Coverage:** 12 total, 12 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Detail API returns `orderCounts` with six non-negative integers and correct totals.
- [ ] Hero shows the 3×2 matrix between identity and health score.
- [ ] Materializer tests cover 59/60/61-day and Jan/2024 boundaries.
- [ ] KPI tile and Movimentação 12m counts remain unchanged.
