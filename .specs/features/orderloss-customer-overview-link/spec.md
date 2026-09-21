# Order Loss → Overview Customer Link

## Problem Statement

Em Pedidos Perdidos (`OrderLossView`) e Meus Pedidos (`SellerOrdersView`) o cliente aparece só pelo nome (`FANTASIA`). O código Sapiens (`CODCLI`) existe na origem, mas não chega à UI. O Overview Customer já oferece detalhe em `/overview/customers/:clienteId` e o fluxo Overview → Order Loss (`?customerCode=`), mas o caminho inverso não existe.

## Goals

- [ ] Nome do cliente com `customerCode` válido vira link para o detalhe Overview.
- [ ] Banner de filtro `?customerCode=` em Order Loss também linka o `#code`.
- [ ] Helper compartilhado `buildOverviewCustomerDetailHref` espelha o helper outbound já existente.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| API / backend | Só navegação frontend |
| Role gates novos no router | `PrivateRoute` + Overview Detail já tratam 403 |
| Kanban / `OrderCard` legado | Não montado por essas views |
| Chip `#code` na tabela densa | Visual só no nome (e no banner) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Superfícies | `SellersList`, `SellerOrdersList`, `OrderDetailsModal`, banner de filtro | Todos os lugares que mostram o cliente nessas views | y |
| Visual | Avatar permanece; só o texto do nome (e `#code` do banner) é link | Alinha ao portfolio sem poluir a tabela | y |
| Navegação | Mesma aba via `<Link>` | Mesmo padrão do portfolio | y |
| Sem código | Texto estático sem link | Pedidos justificados sem match Sapiens | y |
| Acesso | Link sempre com código; 403 no destino | Enforcement no Overview Detail | y |

**Open questions:** none - all resolved above.

---

## User Stories

### P1: Link do cliente para Overview ⭐ MVP

**User Story**: Como usuário em Pedidos Perdidos ou Meus Pedidos, quero clicar no cliente listado e abrir a análise Overview desse código, para ir da perda à visão 360° sem procurar o cliente na carteira.

**Why P1**: Fecha o caminho inverso Overview ↔ Order Loss.

**Acceptance Criteria**:

1. WHEN um pedido em Order Loss / Meus Pedidos tiver `customerCode` válido THEN the system SHALL renderizar o nome do cliente como link para `/overview/customers/{customerCode}`.
2. WHEN o usuário ativar esse link THEN the system SHALL navegar para o detalhe Overview desse código na mesma aba.
3. IF o pedido não tiver `customerCode` válido THEN the system SHALL exibir o nome do cliente sem link.
4. WHEN o banner de filtro `?customerCode=` estiver visível em Order Loss THEN the system SHALL linkar `#code` para o mesmo detalhe Overview.
5. The system SHALL expor um helper `buildOverviewCustomerDetailHref(customerCode)` que retorna `/overview/customers/{customerCode}`.

**Independent Test**: Fixture com `CODCLI=4821` e `FANTASIA`; assert `href="/overview/customers/4821"` no nome; fixture sem código; assert nome sem `href`.

---

## Edge Cases

- IF `customerCode` for ausente ou inválido (`<= 0`, não inteiro) THEN the system SHALL NOT render a link.
- WHEN o nome for o fallback `"Cliente"` sem código Sapiens THEN the system SHALL keep plain text.

---

## Implicit-requirement dimensions

| Dimension | Resolution |
| --------- | ---------- |
| Input validation | Só linka com `customerCode` positivo inteiro |
| Failure / partial-failure | N/A because navigation only; destination owns errors |
| Idempotency / retry | N/A because no writes |
| Auth boundaries | Sem gate extra; Overview Detail trata 403 |
| Concurrency | N/A because no async mutation |
| Data lifecycle | N/A because no persistence |
| Observability | N/A because no new telemetry |
| External-dependency failure | N/A because no new API calls |
| State-transition integrity | N/A because read-only navigation |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ORDOV-01 | P1: Link do cliente | Execute | Verified |
| ORDOV-02 | P1: Link do cliente | Execute | Verified |
| ORDOV-03 | P1: Link do cliente | Execute | Verified |
| ORDOV-04 | P1: Link do cliente | Execute | Verified |
| ORDOV-05 | P1: Link do cliente | Execute | Verified |

**ID format:** `ORDOV-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 5 total, 5 mapped to execute steps, 0 unmapped

---

## Success Criteria

- [ ] Nome do cliente com código válido linka para `/overview/customers/{code}` nas listas e no modal.
- [ ] Banner de filtro linka `#code` para o mesmo destino.
- [ ] Sem código → texto estático.
- [ ] Helper `buildOverviewCustomerDetailHref` coberto por teste.
