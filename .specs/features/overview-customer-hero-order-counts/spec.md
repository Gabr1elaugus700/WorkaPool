# Overview Customer — Contagens de pedidos no hero

## Problem Statement

No detalhe do cliente, o vendedor vê faturamento/volume e um único tile de “Pedidos (desde Jan/2024)” (só faturados), sem contraste rápido entre faturados, perdidos e o total — nem recência (60 dias). A decisão comercial precisa dessas contagens no hero, ao lado da identidade. Os contadores ainda não existem no read model: é preciso materializá-los no sync overnight antes de expor na API e na UI.

## Goals

- [ ] Materializar no sync overnight quatro contadores base (faturados/perdidos × desde Jan/2024 e últimos 60 dias) no snapshot de movimentação comercial recente.
- [ ] Expor no `GET /api/overview/customers/:clienteId` as contagens faturadas, perdidas e totais (totais = faturados + perdidos) nas duas janelas.
- [ ] Mostrar essas seis métricas no hero existente, entre identidade e Score de Saúde.
- [ ] Remover o tile KPI “Pedidos (desde Jan/2024)” da Visão Geral para não duplicar a totalizadora do hero.
- [ ] Reutilizar o pipeline de sync overnight (sem query live no GET).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Substituir contagens de 12 meses na aba Movimentação | Janela e contexto diferentes; fora do pedido |
| Relocar o sublabel “Ticket médio” para outro tile do KPI grid | Sai junto com o tile Pedidos; sem redesign do grid neste slice |
| Query live Senior no GET detail | Mesmo padrão snapshot dos demais KPIs |
| Contagens por grupo ABC | Spec irmã de análise por grupo |
| Lista de pedidos no hero | Só quantidades agregadas |
| Recalcular totais no banco como coluna persistida | Totais derivados no mapper a partir dos 4 bases |
| Remover campos `orderCount*` do contrato/API | Só some a apresentação do tile; snapshot/API commercialSummary permanece |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Totais | `faturados + perdidos` por janela | Confirmado pelo usuário | y |
| Faturados | NF faturada (regra do sync atual) | Consistência com KPI / motion | y |
| Perdidos | `sitped = 5` | Mesma regra da Movimentação | y |
| Janelas | desde `2024-01-01` e rolling 60 dias | Pedido do usuário | y |
| UI | Coluna central do `OverviewCustomerDetailHero` | Wireframe anotado pelo usuário | y |
| Fonte | Snapshot overnight no materializer de recent commercial motion; campos ausentes → `0` | Compatibilidade com snapshots antigos; sem live ERP no GET | y |
| Totais derivados | Calculados no mapper/use-case a partir dos 4 contadores base | Evita divergência de persistência | y |
| Tile KPI Pedidos | Remover da Visão Geral | Usuário: evita overload/informação repetida com o hero | y |
| Ticket médio no KPI | Sai com o tile Pedidos; não relocado | Evita redesenhar o grid neste slice | n |
| Movimentação 12m | Inalterada | Janela diferente do hero (60d / desde 2024) | y |
| Working tree | Feature foi revertida localmente; reimplementar a partir deste spec | Diff atual removeu materializer/API/UI | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Materializar totalizadoras no sync ⭐ MVP

**User Story**: Como pipeline de sync do Overview, quero materializar contagens de pedidos faturados e perdidos (desde Jan/2024 e últimos 60 dias) no snapshot de movimentação comercial recente, para o detail ler números prontos sem consulta live.

**Why P1**: Sem totalizadoras no read model não há contrato nem UI confiáveis; o usuário pediu explicitamente essa etapa.

**Acceptance Criteria**:

1. WHEN the recent-commercial-motion materializer runs THEN the system SHALL compute `invoicedCountSinceJan2024` as the count of distinct invoiced orders with occurrence date on or after `2024-01-01`, using the same invoiced-order rules as the existing 12-month motion counts.
2. WHEN the recent-commercial-motion materializer runs THEN the system SHALL compute `lostCountSinceJan2024` as the count of deduped lost orders with `sitped = 5` and issue date on or after `2024-01-01`.
3. WHEN the recent-commercial-motion materializer runs THEN the system SHALL compute `invoicedCountLast60Days` and `lostCountLast60Days` with a rolling 60-day cutoff from materializer `now` (UTC date boundary), using the same invoiced/lost rules as the 12-month counters.
4. The system SHALL persist the four base count fields on each customer entry of the recent-commercial-motion snapshot.
5. The system SHALL leave `invoicedCountLast12Months` and `lostCountLast12Months` semantics unchanged.
6. IF an order date is before `2024-01-01` THEN the system SHALL exclude it from all four new base count fields.

**Independent Test**: Unit-test the materializer with fixtures covering since-Jan, day-60 inclusive, day-61 exclusive, pre-2024 exclusion, invoiced-only and lost-only customers.

---

### P1: Contagens no contrato do detail ⭐ MVP

**User Story**: Como consumidor da API de detalhe, quero `orderCounts` com faturados, perdidos e totais (desde Jan/2024 e últimos 60 dias) para renderizar o hero sem outro endpoint.

**Why P1**: Sem contrato não há UI.

**Acceptance Criteria**:

1. WHEN the detail endpoint returns a customer THEN the system SHALL include an `orderCounts` object with `invoicedSinceJan2024`, `lostSinceJan2024`, `totalSinceJan2024`, `invoicedLast60Days`, `lostLast60Days`, and `totalLast60Days` as non-negative integers.
2. The system SHALL set `totalSinceJan2024` equal to `invoicedSinceJan2024 + lostSinceJan2024`.
3. The system SHALL set `totalLast60Days` equal to `invoicedLast60Days + lostLast60Days`.
4. WHEN a served snapshot lacks the new base count fields THEN the system SHALL treat each missing base count as `0`.
5. The system SHALL map the four base counts from the overnight recent-commercial-motion snapshot into `orderCounts` (after defaults), without querying Senior on the GET.
6. The system SHALL NOT change `commercialSummary.orderCountSinceJan2024` semantics or the 12-month motion count fields.

**Independent Test**: Unit-test detail mapper totals; fixture snapshot without new fields yields zeros; assert 12m fields unchanged.

---

### P1: Bloco de contagens no hero ⭐ MVP

**User Story**: Como usuário do Overview, quero ver totais, faturados e perdidos (desde Jan/2024 e últimos 60 dias) no card do hero, entre a identidade e o Score de Saúde.

**Why P1**: É o job visual do pedido.

**Acceptance Criteria**:

1. WHEN the customer detail hero renders with `orderCounts` THEN the system SHALL show a counts block between the identity column and the health-score column on `md+` viewports.
2. WHEN the counts block renders THEN the system SHALL display three rows (Totais, Faturados, Perdidos) and two columns (Desde Jan/2024, Últimos 60 dias) with the corresponding numbers.
3. WHEN any count is `0` THEN the system SHALL still display `0` (not hide the cell).
4. IF `orderCounts` is absent on the payload THEN the system SHALL render all six values as `0`.
5. WHEN the overview KPI grid renders THEN the system SHALL NOT show the tile labeled “Pedidos (desde Jan/2024)”.
6. The system SHALL keep the Movimentação 12-month counts unchanged.
7. WHILE viewport is below `md` THEN the system SHALL stack the counts block between identity and health score (not hide it).

**Independent Test**: Render hero with fixture counts; assert labels, six values, and layout order; assert KPI grid no longer matches “Pedidos (desde Jan/2024)”; assert motion 12m consumers unchanged.

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
| HEROOC-01 | P1: Materializar totalizadoras | Tasks | In Tasks |
| HEROOC-02 | P1: Materializar totalizadoras | Tasks | In Tasks |
| HEROOC-03 | P1: Materializar totalizadoras | Tasks | In Tasks |
| HEROOC-04 | P1: Materializar totalizadoras | Tasks | In Tasks |
| HEROOC-05 | P1: Materializar totalizadoras | Tasks | In Tasks |
| HEROOC-06 | P1: Materializar totalizadoras | Tasks | In Tasks |
| HEROOC-07 | P1: Contagens no contrato | Tasks | In Tasks |
| HEROOC-08 | P1: Contagens no contrato | Tasks | In Tasks |
| HEROOC-09 | P1: Contagens no contrato | Tasks | In Tasks |
| HEROOC-10 | P1: Contagens no contrato | Tasks | In Tasks |
| HEROOC-11 | P1: Contagens no contrato | Tasks | In Tasks |
| HEROOC-12 | P1: Contagens no contrato | Tasks | In Tasks |
| HEROOC-13 | P1: Bloco no hero | Tasks | In Tasks |
| HEROOC-14 | P1: Bloco no hero | Tasks | In Tasks |
| HEROOC-15 | P1: Bloco no hero | Tasks | In Tasks |
| HEROOC-16 | P1: Bloco no hero | Tasks | In Tasks |
| HEROOC-17 | P1: Bloco no hero | Tasks | In Tasks |
| HEROOC-18 | P1: Bloco no hero | Tasks | In Tasks |
| HEROOC-19 | P1: Bloco no hero | Tasks | In Tasks |

**Coverage:** 19 total, 19 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Recent-commercial-motion materializer persists four base counts with correct Jan/2024 and 60-day windows.
- [ ] Detail API returns `orderCounts` with six non-negative integers and correct derived totals.
- [ ] Hero shows the 3×2 matrix between identity and health score.
- [ ] KPI grid no longer shows the “Pedidos (desde Jan/2024)” tile.
- [ ] Materializer tests cover 59/60/61-day and Jan/2024 boundaries.
- [ ] Movimentação 12m counts remain unchanged.
