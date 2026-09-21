# Overview Customer — Análise 5×5 por grupo (frontend)

## Problem Statement

A API da análise 5×5 por grupo (spec irmã) não chega ao vendedor se a UI do Overview não tiver seletor de grupo e os dois cards. Hoje o detalhe do cliente não mostra ganhos/perdidos por grupo, nem trata falha do Sapiens distinta de lista vazia.

## Goals

- [ ] No detalhe do cliente (`/overview/customers/:clienteId`), seção com chips ABC por grupo e dois cards lado a lado (ganhos | perdidos).
- [ ] Copy, identificadores e estados (vazio / erro / loading) conforme o contrato travado.
- [ ] 403 reutiliza o access-denied do Overview; a UI não inventa outro gate de carteira.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Sync, SQL Senior, join `orderLoss`, grain de pedido | Spec `.specs/features/overview-customer-grupo-analise/spec.md` |
| Página / rota própria de análise | Fica no Overview |
| Vendedor e revenue/share nos cards | Fora da v1 |
| Substituir ABC de SKU ou tabela de produtos comprados | Seção nova |
| HTTP direto em componente de UI | Hooks/services da feature |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Onde | Seção no detalhe do cliente já existente | PRD + wireframe | y |
| Layout | Chips no topo; card ganhos à esquerda (verde); perdidos à direita (vermelho) | Wireframe 2026-09-20 | y |
| Auth na UI | Sem gate extra: se o detalhe/análise responder `OVERVIEW_CUSTOMER_FORBIDDEN`, reutilizar `OverviewCustomerAccessDeniedState` | Mesma tela; enforcement é no use-case da API | y |
| Roles | Quem já abre o Overview vê a seção; `ADMIN` / `GERENTE_DPTO` / `VENDAS` com `codRep` do cliente | Igual backend | y |
| Chip default | Primeiro chip (maior share) selecionado; dispara o fetch da análise | Spec backend | n |
| Lazy | Análise só após haver grupo selecionado | Evita request sem filtro | y |
| Stale chip | Resposta do grupo anterior não pinta o card do grupo atual | Context locked | n |
| HTTP | Hooks/services em `frontend/src/features/overviewCustomer/` | Layer boundaries | y |
| Copy vazia | `Nenhum pedido encontrado.` por card | PRD | y |
| Copy motivo | `Sem justificativa registrada.` no card vermelho | PRD | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Seção no Overview com chips ⭐ MVP

**User Story**: Como usuário que já vê o detalhe do cliente, quero chips dos top 5 grupos ABC e selecionar um para filtrar os cards abaixo.

**Why P1**: Sem chips a análise não tem filtro.

**Acceptance Criteria**:

1. WHEN the customer overview detail renders for an authorized user THEN the system SHALL show the group-analysis section on that page and SHALL NOT navigate to a new route.
2. WHEN the group chips load THEN the system SHALL render at most 5 chips using group labels (including `OUTROS PRODUTOS` when present), not SKU names.
3. WHEN at least one chip is available THEN the system SHALL select the highest-share chip on first paint.
4. WHEN the user selects a chip THEN the system SHALL use that `grupoCodigo` as the filter for both cards and SHALL request analysis for that code only.
5. IF the chip list is empty THEN the system SHALL hide or empty-state the two cards and SHALL NOT call analysis without a group.
6. The system SHALL keep the existing SKU ABC card and purchased-products table unchanged.

**Independent Test**: Open a fixture customer detail; assert ≤5 group chips, default selection, and analysis request uses that `grupoCodigo`.

---

### P1: Cards ganhos e perdidos ⭐ MVP

**User Story**: Como usuário, quero ver lado a lado até 5 ganhos e 5 perdidos do grupo, com número, data, valor, quantidade, margem e motivo nos perdidos.

**Why P1**: É o job da tela.

**Acceptance Criteria**:

1. WHEN the section is visible THEN the system SHALL place two side-by-side cards: ganhos on the left with green treatment, perdidos on the right with red treatment.
2. WHEN ganhos rows are present THEN the system SHALL display at most 5 rows and SHALL show `numnfv` as the visible document number (not `numped`).
3. WHEN perdidos rows are present THEN the system SHALL display at most 5 rows and SHALL show `numped` as the visible document number.
4. WHEN a row is shown THEN the system SHALL display date, final value, quantity, unit price, and margin; perdido rows SHALL also display `motivo`.
5. WHEN a card receives an empty list without error THEN the system SHALL show `Nenhum pedido encontrado.` in that card only.
6. WHEN a perdido `motivo` is the unmatched sentinel THEN the system SHALL show `Sem justificativa registrada.`
7. The system SHALL NOT show salesperson name, `codRep`, city, or revenue share on these cards.

**Independent Test**: Fixture analysis payload; assert layout, visible ids, fields, empty copy per card.

---

### P1: Acesso negado (mesmo do Overview) ⭐ MVP

**User Story**: Como vendedor de outra carteira, quero o mesmo estado de acesso negado do Overview, sem uma tela nova de análise.

**Why P1**: Permissão já está na API; a UI não pode parecer que a análise é pública.

**Acceptance Criteria**:

1. WHEN the overview detail (or group-analysis request) returns `403` / `OVERVIEW_CUSTOMER_FORBIDDEN` THEN the system SHALL render the existing Overview access-denied state and SHALL NOT render chips or cards with another customer's data.
2. WHILE the user is `ADMIN` or `GERENTE_DPTO` and the detail loaded THEN the system SHALL show the group-analysis section for that customer.
3. WHILE the user is `VENDAS` with `codRep` equal to the customer's `primaryCodRep` and the detail loaded THEN the system SHALL show the group-analysis section.
4. The frontend SHALL NOT implement a second permission matrix; it SHALL rely on the API codes from the backend spec.

**Independent Test**: Reuse Overview 403 fixture; analysis section is not visible; access-denied is.

---

### P2: Loading e falha independente dos cards

**User Story**: Como usuário, quero ganhos estáveis se os perdidos falharem, e um retry só no card vermelho.

**Why P2**: Sapiens pode cair; empty ≠ erro.

**Acceptance Criteria**:

1. WHEN analysis is in flight for the selected chip THEN the system SHALL show a loading state on the cards (or the card still waiting) without clearing the other card's last good data for that same chip.
2. IF perdidos fail and ganhos succeed THEN the system SHALL keep the ganhos card populated and SHALL show a destructive error plus retry on the perdidos card.
3. IF perdidos fail THEN the system SHALL NOT show `Nenhum pedido encontrado.` on the perdidos card.
4. WHEN the user retries perdidos THEN the system SHALL request lost-side data again for the currently selected group and SHALL leave ganhos unchanged.
5. IF a response arrives for a chip that is no longer selected THEN the system SHALL NOT apply that payload to the visible cards.

**Independent Test**: Mock ganhos 200 + perdidos error; assert copy, retry, and stale-response ignore.

---

## Edge Cases

- IF the group-list request fails THEN the system SHALL show a section-level error (not the empty-chip success path) and SHALL NOT call analysis.
- WHEN the viewport is narrow THEN the system SHALL stack the two cards (ganhos above perdidos) without dropping fields.
- IF `clienteId` in the route is invalid THEN the system SHALL keep the existing Overview invalid-code state and SHALL NOT fetch analysis.

---

## Implicit-requirement dimensions

| Dimension | Resolution |
| --------- | ---------- |
| Input validation | `clienteId` já validado pela view; sem grupo → sem GET análise |
| Failure / partial-failure | Cards independentes; retry só em perdidos |
| Idempotency / retry | Retry dispara o mesmo GET do grupo atual |
| Auth boundaries | Sem matrix na UI; 403 → access-denied existente |
| Concurrency | Ignora resposta stale de outro chip |
| Data lifecycle | N/A because the UI does not persist analysis |
| Observability | N/A because no new telemetry in this slice |
| External-dependency failure | Superfície: erro do card vermelho |
| State-transition integrity | N/A because read-only selection state |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| OCAUI-01 | P1: Seção no Overview com chips | Execute | Verified |
| OCAUI-02 | P1: Cards ganhos e perdidos | Execute | Verified |
| OCAUI-03 | P1: Acesso negado | Execute | Verified |
| OCAUI-04 | P2: Loading e falha independente | Execute | Verified |

**ID format:** `OCAUI-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Detalhe autorizado mostra chips de grupo + dois cards; NF nos ganhos, `numped` nos perdidos.
- [ ] 403 do Overview não vaza dados da análise.
- [ ] Empty e falha de perdidos são visuais distintos; ganhos não somem no erro do Senior.
