# Overview Customer — Análise 5×5 por grupo

## Problem Statement

No Overview do cliente não dá para comparar, por **grupo de produto**, os pedidos ganhos e perdidos mais recentes — com `numped`, valor, quantidade, margem e, nos perdidos, a justificativa.

Ganhos hoje estão no snapshot `produtos-comprados` só como agregado por SKU (o extract já tem `numped` e a materialização descarta). Perdidos (`sitped = 5`) e o motivo (`orderLoss`) não se juntam na UI por grupo. A curva ABC da tela é por SKU; este slice precisa de ABC **por grupo**.

## Goals

- [ ] No detalhe do cliente, o usuário seleciona um dos top 5 grupos ABC e vê até 5 ganhos e até 5 perdidos daquele grupo, agregados por pedido.
- [ ] Ganhos vêm do read model do Overview (passo novo no sync); perdidos vêm do Sapiens on-demand + join `orderLoss`.
- [ ] Permissão: `ADMIN` e `GERENTE_DPTO` qualquer cliente; `codRep` (`VENDAS`) só se for o `primaryCodRep` desse cliente. Empty e falha de ERP não se confundem.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Sync noturno de perdidos | PRD: perdidos on-demand no Sapiens |
| Pivot 5×5 pré-montado no sync | Montagem é na leitura / UI |
| Filtro canônico só por `DESGRP` | Filtro é `CODGRP` |
| Vendedor e revenue/share na UI v1 | Travado fora no grilling |
| Análise em página própria | Fica no Overview |
| Apresentação UI (chips, cards, copy, retry) | Spec irmã `.specs/features/overview-customer-grupo-analise-ui/spec.md` |
| Substituir snapshot/tabela de produtos por SKU | Passo novo; `produtos-comprados` permanece |
| Consulta Senior ao vivo para ganhos | Contraria o Overview (read model) e dessincroniza a ABC |
| Listar todos os grupos do cliente | Só top 5 ABC por grupo |
| Expandir SKU / chip por produto | Tudo neste slice é por grupo |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Ganhos | Novo passo no sync noturno; grain cliente+grupo+pedido; API lê snapshot | Extract de produtos já tem linha/`numped`; live ERP em ganhos quebra consistência com ABC e o PRD do Overview | y |
| Perdidos | Sapiens on-demand + join `orderLoss` por `numped` | PRD locked | y |
| Dimensão | Chips e filtros por `CODGRP`; ABC recalculada por grupo | Usuário: “tudo nesse slice é por grupo” | y |
| OUTROS | Bucket `OUTROS` / label `OUTROS PRODUTOS` para SKU sem `produto_grupo_map`; chip só se estiver no top 5 | PRD + chips limitados a 5 | y |
| Chip default | Maior share de faturamento | Primeiro da ABC | n |
| Agregado do pedido no grupo | Soma volume/qtd/valor; `preuni` média ponderada pelo volume; margem ponderada pelo valor (regra Overview) | Um pedido, itens do grupo; usuário espera valor/margem iguais | n |
| Pedido multi-grupo | Entra no TOP 5 de cada grupo só com itens daquele grupo | Filtro é o chip | n |
| Falha Sapiens | Cards independentes; ganhos ok; perdidos erro + retry; não usar empty copy | Usuário confirmou a recomendação | y |
| Corte ganhos | Mesmo do Overview (`2024-01-01` + regras de NF faturada) | Mesma verdade comercial dos produtos/ABC | n |
| Corte perdidos | Nenhum; só TOP 5 por `DATEMI` DESC | PRD locked | y |
| Auth | `ADMIN` e `GERENTE_DPTO` acessam qualquer cliente; quem tem `codRep` no token (`VENDAS`) só se `codRep` = `primaryCodRep` do cliente | Pedido explícito 2026-09-20; igual Overview | y |
| Rate limit extra | N/A — mesma API autenticada do Overview | Sem superfície pública nova | n |
| Publish do sync | Passo novo é required; falha → retry ≤3, não publica snapshot novo | Igual demais steps do Overview | n |
| Concurrency de chips | Resposta do chip anterior não substitui o chip atual | Evita flicker de dados errados | n |
| Idempotência sync | Full refresh do passo; reexecutar substitui o recorte de ganhos-por-grupo | Padrão Overview | n |
| Lifecycle | Sem TTL próprio; vale o served snapshot | Sem tabela de expiração | n |
| Identificador na UI (ganhos) | Exibir `numnfv`; persistir também `numped` | Ganhos vêm de NF faturada; usuário pediu o número da NF na tela; `numped` permanece para join/agrupamento | y |
| Identificador na UI (perdidos) | Exibir `numped` (não há NF) | `sitped = 5` não gera `numnfv` | y |
| Várias NF no mesmo pedido+grupo | Exibir o `numnfv` da emissão mais recente do agregado | Grain continua `numped`; NF é rótulo | n |
| SQL perdidos | Query do usuário (e120ped/ipd + grppro) parametrizada; ver seção canônica | Colada em 2026-09-20; literais de exploração removidos | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Chips ABC por grupo ⭐ MVP

**User Story**: Como usuário do Overview, quero ver até 5 grupos da curva ABC do cliente como chips e selecionar um, para filtrar a análise 5×5 abaixo.

**Why P1**: Sem o seletor por grupo a análise não tem âncora.

**Acceptance Criteria**:

1. WHEN the overview detail loads the group-analysis section THEN the system SHALL show at most 5 chips, one per group, ordered by revenue share descending, computed by summing invoiced revenue since the Overview cutoff after mapping each SKU via `produto_grupo_map`.
2. WHEN a purchased SKU has no row in `produto_grupo_map` THEN the system SHALL bucket its revenue into the group labeled `OUTROS PRODUTOS`.
3. WHEN `OUTROS PRODUTOS` is not among the top 5 groups by revenue share THEN the system SHALL omit that chip.
4. WHEN the section first renders with at least one chip THEN the system SHALL select the highest-share chip.
5. WHEN the user selects a chip THEN the system SHALL treat that `CODGRP` (or the OUTROS sentinel) as the filter for both cards below.
6. The system SHALL NOT present SKU-level chips in this section.

**Independent Test**: Fixture customer with known product revenues and map rows; assert chip codes, labels, order, default selection, and OUTROS only when ranked top 5.

---

### P1: TOP 5 ganhos do grupo (snapshot) ⭐ MVP

**User Story**: Como usuário do Overview, quero os 5 pedidos ganhos mais recentes do grupo selecionado, com `numped` e campos de linha agregados, para comparar o que de fato faturou.

**Why P1**: Sem ganhos com `numped` o 5×5 não existe.

**Acceptance Criteria**:

1. WHEN the nightly Overview sync runs THEN the system SHALL persist a new required step that materializes, per customer, invoiced orders at grain `(customerCode, grupoCodigo, numped)` without replacing the SKU `produtos-comprados` snapshot.
2. The ganhos materialization SHALL use the same commercial filters as Overview purchased products: invoiced NF `sitnfv = 2`, `venfat = 'S'`, `qtdfat > qtddev`, `numped > 0`, `datemi >= 2024-01-01`, volume rule for product `101072`.
3. WHEN aggregating lines of the same `numped` inside one group THEN the system SHALL emit one row: sum volume, sum quantity, sum final value; `preuni` as volume-weighted average; margin as revenue-weighted percent.
4. WHEN the user has a selected group THEN the system SHALL return at most 5 ganhos for that group ordered by invoice/emission date descending.
5. WHEN a ganho row is returned THEN the system SHALL include `numnfv` (display id), `numped` (join/grain), `datemi`, `vlrfinal`, `qtdped` (or equivalent quantity), `preuni`, and `margem`.
6. WHEN the selected group has no ganho rows THEN the system SHALL return an empty `ganhos` array (UI empty copy lives in the frontend spec).
7. The system SHALL serve ganhos from the Overview served snapshot (Postgres), not from a live Senior query on the user request.

**Independent Test**: Seed line-level invoiced extract + map; after materialize, request analysis for a group and assert TOP 5 dates, `numped`, summed volume, and no Senior call on that path.

---

### P1: TOP 5 perdidos do grupo (Sapiens + orderLoss) ⭐ MVP

**User Story**: Como usuário do Overview, quero os 5 pedidos perdidos mais recentes do grupo, com motivo do WorkaPool quando existir, para ver o que saiu e por quê.

**Why P1**: É a outra metade do 5×5; motivo não vive no ERP.

**Acceptance Criteria**:

1. WHEN analysis is requested for a group THEN the system SHALL query Sapiens for lost orders (`sitped = 5`) filtered by `CODCLI` and `CODGRP` (OUTROS = products with no grppro/map), ordered by `DATEMI` descending, with no date cutoff.
2. WHEN Sapiens returns multiple item lines for the same `numped` in that group THEN the system SHALL aggregate them to one pedido row using the same sum/weight rules as ganhos.
3. The system SHALL return at most 5 aggregated perdido rows and SHALL include `numped`, `datemi`, `vlrfinal`, `qtdped`, `preuni`, `margem`, and `motivo`.
4. WHEN a perdido `numped` matches `Order.orderNumber` with a `LossReason` THEN the system SHALL set `motivo` from that reason (code/description as already exposed by orderLoss).
5. WHEN a perdido `numped` has no local `orderLoss` match THEN the system SHALL set `motivo` to `Sem justificativa registrada.`
6. WHEN Sapiens returns no lost orders for that group THEN the system SHALL return an empty `perdidos` array without an error flag.
7. WHEN the lost-orders Senior query runs THEN the system SHALL use the canonical SQL in this spec (same joins and selected commercial columns), with `@codCli` / `@codGrp` parameters, `sitped = '5'`, no `BETWEEN` date window, and no `ipd.codpro` filter.

**Independent Test**: Double Sapiens TOP 5 + fixture `orderLoss` for one `numped` only; assert five rows max, join copy, and empty copy when the double returns [].

---

### P1: Permissão da análise (API) ⭐ MVP

**User Story**: Como o sistema, quero aplicar na análise 5×5 a mesma regra do Overview: Admin e Gerente de departamento veem qualquer cliente; `codRep` só vê o cliente se for o representante daquele cliente.

**Why P1**: Sem o mesmo gate, o GET vazaria carteira.

**Acceptance Criteria**:

1. WHEN the caller role is `ADMIN` THEN the system SHALL allow group-list and group-analysis for any `clienteId` present in the served snapshot, regardless of token `codRep`.
2. WHEN the caller role is `GERENTE_DPTO` THEN the system SHALL allow group-list and group-analysis for any `clienteId` present in the served snapshot, regardless of token `codRep`.
3. WHEN the caller role is `VENDAS` and token `codRep` equals the customer's `primaryCodRep` THEN the system SHALL allow group-list and group-analysis for that customer.
4. IF the caller role is `VENDAS` and token `codRep` is not the customer's `primaryCodRep` THEN the system SHALL respond `403` with code `OVERVIEW_CUSTOMER_FORBIDDEN`.
5. IF the caller role is not `ADMIN`, `GERENTE_DPTO`, or `VENDAS` THEN the system SHALL respond `403` with code `OVERVIEW_CUSTOMER_FORBIDDEN`.
6. IF `clienteId` is not in the served snapshot THEN the system SHALL respond `404` with code `OVERVIEW_CUSTOMER_NOT_FOUND`.
7. The system SHALL enforce this matrix in the use-case (not only in the UI).

**Independent Test**: Same fixtures as Overview detail: ADMIN/GERENTE any customer 200; VENDAS matching `codRep` 200; VENDAS other customer 403; USER/ALMOX/LOGISTICA 403.

---

### P2: Falha parcial do Sapiens

**User Story**: Como usuário, quero continuar vendo os ganhos se o ERP falhar nos perdidos, para não perder o lado que já está no WorkaPool.

**Why P2**: Senior pode timeout; empty e erro não podem ser o mesmo.

**Acceptance Criteria**:

1. IF the Sapiens lost-orders query fails THEN the system SHALL still return ganhos from the snapshot for the selected group.
2. IF the Sapiens lost-orders query fails THEN the system SHALL expose a distinct perdidos failure (error flag or equivalent), and SHALL NOT return an empty `perdidos` array as a successful empty result.
3. The system SHALL NOT use the copy `Nenhum pedido encontrado.` in the API error payload to mean Sapiens failure.

**Independent Test**: Force Sapiens failure after snapshot seed; response still has ganhos; perdidos marked failed, not `[]` success.

---

## Canonical Senior SQL (perdidos)

Source query supplied 2026-09-20. Same tables/joins/columns. Adaptations locked below — do not ship the exploration literals.

| In the pasted SQL | In this slice |
| ----------------- | ------------- |
| `ped.datemi BETWEEN '01-06-2026' AND '01-07-2026'` | **Removed.** No cutoff; newest first, then TOP 5 after aggregate |
| `cli.codcli = ''` | `@codCli` from the overview customer |
| `ipd.codpro = ''` | **Removed.** Filter is `grp.codgrp = @codGrp`; OUTROS = `grp.codgrp IS NULL` |
| Line grain (`ipd.*`) | Fetch lines, then aggregate to `numped` in the use-case (sum/weight), then take 5 |
| `CODREP` / `APEREP` / `FANTASIA` / `CIDADE` | May be selected; **not shown** in UI v1 |

```sql
SELECT
    ped.datemi AS [DATA],
    ped.numped AS [NUMPED],
    ped.sitped AS [SITUACAO],
    ped.codven AS [CODREP],
    rep.aperep AS [APEREP],
    ped.codcli AS [CODCLI],
    cli.apecli AS [FANTASIA],
    CONCAT(cli.cidcli, ' - ', cli.sigufs) AS [CIDADE],
    ISNULL(grp.desgrp, 'OUTROS PRODUTOS') AS [PRODUTO],
    grp.codgrp AS [CODGRP],
    ipd.qtdped AS [QTDPED],
    ipd.preuni AS [PREUNI],
    ipd.usu_vlrfin AS [VLRFINAL],
    ipd.usu_mgmluc AS [MARGEM_LUCRO]
FROM e120ped ped
INNER JOIN e120ipd ipd
    ON ipd.codemp = ped.codemp
   AND ipd.codfil = ped.codfil
   AND ipd.numped = ped.numped
INNER JOIN e090rep rep
    ON rep.codrep = ped.codven
INNER JOIN e085cli cli
    ON cli.codcli = ped.codcli
LEFT JOIN poolbi.dbo.grppro grp
    ON grp.codpro = ipd.codpro
WHERE ped.sitped = '5'
  AND ped.codcli = @codCli
  AND (
        (@codGrp <> 'OUTROS' AND grp.codgrp = @codGrp)
     OR (@codGrp = 'OUTROS' AND grp.codgrp IS NULL)
      )
ORDER BY ped.datemi DESC;
```

After this result set: aggregate by `NUMPED`, then keep 5. Join `orderLoss` on `NUMPED`. Copy if no match: `Sem justificativa registrada.`

---

## Edge Cases

- IF the group-analysis sync step fails after 3 retries THEN the system SHALL not publish a new served snapshot and SHALL keep the previous successful snapshot (Overview pipeline rule).
- IF the served snapshot has no group-ganhos step yet (first deploy before a successful publish) THEN the system SHALL show an unavailable/empty section state, not a Sapiens call for ganhos.
- IF `grupoCodigo` on the request is missing or not a non-empty code/sentinel THEN the system SHALL respond `400`.
- WHEN two lines of the same `numped` share the selected group THEN the system SHALL count them as one pedido toward the TOP 5.
- WHEN the same `numped` has lines in group A and group B THEN the system SHALL allow that `numped` in both groups' lists with only that group's totals.
- IF Senior is slow THEN the system SHALL not block rendering of chips or the ganhos card.

---

## Implicit-requirement dimensions

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | `clienteId` existente; `grupoCodigo` obrigatório; TOP 5; chips ≤ 5 |
| Failure / partial-failure | Cards independentes; passo de sync required com retain do snapshot anterior |
| Idempotency / retry | Sync full refresh; perdidos retry só no card |
| Auth boundaries & rate limits | Mesma matriz Overview; rate limit extra N/A |
| Concurrency / ordering | Resposta stale do chip anterior não pinta o chip atual |
| Data lifecycle / expiry | Sem TTL; corte 2024 só em ganhos |
| Observability | Passo novo no run/step log do Overview; falha Sapiens não é empty |
| External-dependency failure | Sapiens só em perdidos; ganhos isolados |
| State-transition integrity | N/A because this slice is read-only (no new write states) |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| OCA-01 | P1: Chips ABC por grupo | Design | Pending |
| OCA-02 | P1: Chips ABC por grupo | Design | Pending |
| OCA-03 | P1: TOP 5 ganhos | Design | Pending |
| OCA-04 | P1: TOP 5 ganhos | Design | Pending |
| OCA-05 | P1: TOP 5 perdidos | Execute | Verified |
| OCA-06 | P1: TOP 5 perdidos | Execute | Verified |
| OCA-07 | P1: Permissão da análise (API) | Design | Pending |
| OCA-08 | P2: Falha parcial Sapiens | Execute | Verified |

**ID format:** `OCA-NN` (Overview Customer Análise)

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 8 total, 0 mapped to tasks, 8 unmapped

---

## Success Criteria

- [ ] Usuário autoriza o detalhe, vê ≤5 chips de grupo, seleciona um e recebe ≤5 ganhos (com `numped`) e ≤5 perdidos (com `motivo` ou copy fixo).
- [ ] Ganhos não disparam SQL Server no clique; perdidos sim.
- [ ] Empty (`Nenhum pedido encontrado.`) e falha de Sapiens são estados distintos.
- [ ] `produtos-comprados` (SKU) continua igual; ABC de SKU existente na tela não é substituída por este slice.
