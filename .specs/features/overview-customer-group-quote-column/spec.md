# Overview Customer — Coluna de cotações por grupo

## Problem Statement

A análise comercial por grupo mostra ganhos e perdidos em dois cards lado a lado, no máximo cinco linhas cada, somando os itens do mesmo pedido e limitados ao cliente aberto. Ganhos ainda vêm de um recorte salvo, não da janela recente. Quem analisa o grupo precisa ver, numa coluna só, cada item do grupo dentro do seu pedido, nas últimas duas semanas, em todas as cotações da empresa — o vendedor só as dele, gestor e admin também as dos outros.

## Goals

- [ ] Substituir o grid de dois cards por uma coluna única, ordenada pela data de emissão, com uma linha por item do grupo (sem agregar o pedido).
- [ ] Buscar essa lista ao vivo no Sapiens, para o grupo escolhido, nas últimas duas semanas, de todos os clientes.
- [ ] Vendedor vê só os próprios pedidos. Gestor e admin veem todos; pedido de outro vendedor fica apagado, com badge de resultado e badge azul de vendedor.
- [ ] O bloco que desenha a coluna recebe só a lista de linhas, para poder ser montado depois fora da ficha do cliente.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Página nova de análise de produto | Reuso do bloco fica preparado; a rota não entra agora |
| Busca ou filtro por código de produto na tela | O filtro visual continua o chip de grupo ABC |
| Mostrar nome do cliente, nota fiscal ou código do produto na linha | O identificador visível é o número do pedido; o vendedor entra no badge |
| Manter o recorte salvo de ganhos ou o teto de 5 linhas | A coluna passa a ser a lista viva da janela |
| Agregar itens do mesmo pedido | Cada item do grupo é uma linha, com os números daquele item |
| Alterar a origem dos chips de grupo ABC | Continuam os grupos do cliente aberto |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Filtro visual | Chip de grupo ABC do cliente aberto | O usuário corrigiu: a busca na tela é sempre por grupo de produto | y |
| Grão da linha | Um item do grupo dentro de um pedido, sem somar outros itens | Pedido explícito: nunca agregar itens nem percentuais do pedido | y |
| Identificador visível | Só o número do pedido | Pedido explícito; nota fiscal não é o título | y |
| Verde | Item de nota faturada, mesmas regras de nota faturada já usadas nos ganhos (`sitnfv = 2`, transação de venda faturada, quantidade faturada maior que a devolvida) | O usuário confirmou a opção da nota faturada | y |
| Vermelho | Item de pedido com `sitped = 5` | Mesma cotação sem fechamento de hoje | y |
| Data da linha verde | Data de emissão da nota | É a data de emissão já usada no card de ganhos | y |
| Data da linha vermelha | Data de emissão do pedido | É a data de emissão já usada no card de perdidos | y |
| Janela | Do dia corrente menos 14 dias até o dia corrente, inclusive, no calendário `America/Sao_Paulo` | “Duas últimas semanas”; em 2026-09-21 entram emissões de 2026-09-07 a 2026-09-21 | y |
| Universo | Todas as cotações da empresa daquele grupo, sem filtrar pelo cliente aberto | Pedido original: análise da empresa para o grupo | y |
| Quem vê o quê | `VENDAS` recebe só linhas do próprio `codRep`. `ADMIN` e `GERENTE_DPTO` recebem todas. O corte é no caso de uso | Papel não pode depender só da tela; o badge de outro vendedor só existe se a API entregar essas linhas a quem pode vê-las | y |
| Pedido próprio | Linha na cor cheia, sem badge de resultado e sem badge de vendedor | O contraste apagado foi pedido para os outros vendedores | y |
| Pedido de outro vendedor | Linha apagada, badge verde “Ganha” ou vermelho “Perdida”, badge azul `{codRep} {nome}` | O usuário descreveu os dois badges e o tom apagado | y |
| Nome do vendedor | `User.name` do WorkaPool cujo `codRep` é o do pedido. Vários usuários no mesmo `codRep`: o nome não vazio que vier primeiro em ordem alfabética sem diferenciar maiúsculas, e em empate o menor `id`. Sem usuário ou nome vazio: badge só com o `codRep` | O apelido do Sapiens não é a fonte pedida | y |
| Dono da linha | `ownedByViewer` é verdadeiro só quando o `codRep` da linha é igual ao do usuário logado e esse `codRep` é maior que 0 | Admin sem representante não tem pedido “próprio” | n |
| Falha do Sapiens | A coluna inteira falha. Não há lista parcial nem volta para o recorte salvo | Uma metade faltando pareceria a lista completa da quinzena | n |
| Falha ao ler usuários | A lista de cotações ainda volta; `sellerName` nulo e o badge azul mostra só o `codRep` | O nome é complemento; a cotação não depende dele | n |
| Motivo da perda | Texto já gravado em order loss; se não houver, “Sem justificativa registrada.” | Mantém o card vermelho atual, agora por item | n |
| Números da linha | Valor, quantidade em kg, preço unitário e margem daquele item | São os números dos cards atuais, sem somar o pedido | n |
| Ordenação | Data de emissão decrescente, depois número do pedido decrescente, depois código do produto crescente | Desempate estável sem exibir o código | n |
| Participação de receita do grupo | Não aparece na coluna | O chip já identifica o grupo; o card antigo usava a participação no subtítulo | n |
| Acesso do vendedor à ficha | Continua exigindo que ele seja o representante principal do cliente aberto | A lista é da empresa, mas a seção segue na ficha desse cliente | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Lista viva por item do grupo ⭐ MVP

**User Story**: Como usuário autorizado da ficha, quero a análise do grupo ABC como uma lista de itens das últimas duas semanas, de toda a empresa, para comparar cotações sem somar o pedido.

**Why P1**: Sem essa lista a coluna e o recorte por papel não têm o que mostrar.

**Acceptance Criteria**:

1. WHEN an authorized caller requests group quotes for a product group THEN the system SHALL return one row per source item whose product belongs to that group and whose emission date is inside the 14-day window, and SHALL NOT sum rows that share an order number.
2. WHEN the window is evaluated on calendar date 2026-09-21 in `America/Sao_Paulo` THEN the system SHALL include emission date `2026-09-07` and SHALL exclude emission date `2026-09-06`.
3. WHEN an item is an invoiced note line under the current invoiced-note rules THEN the system SHALL set `outcome` to `ganha` and `issuedAt` from the invoice issue date.
4. WHEN an item is an order line with `sitped = 5` THEN the system SHALL set `outcome` to `perdida` and `issuedAt` from the order issue date.
5. The system SHALL NOT filter returned rows by the open customer's code.
6. The system SHALL return, for each row, that item's own `orderNumber`, `issuedAt`, `outcome`, `lineAmount`, `quantityKg`, `unitPrice`, `marginPercent`, `codRep`, `sellerName`, `ownedByViewer`, and `lossReason`.
7. The system SHALL order rows by `issuedAt` descending, then `orderNumber` descending, then product code ascending.
8. WHEN a lost row has no recorded loss reason THEN the system SHALL set `lossReason` to `Sem justificativa registrada.`
9. WHEN a won row is returned THEN the system SHALL set `lossReason` to null.
10. WHEN no row matches the group and window THEN the system SHALL return HTTP 200 and an empty row list.
11. IF the live Sapiens read fails THEN the system SHALL respond HTTP 503 with code `OVERVIEW_CUSTOMER_GROUP_QUOTES_UNAVAILABLE` and SHALL NOT return a partial row list.
12. IF the WorkaPool user lookup fails THEN the system SHALL still return the quote rows with `sellerName` null.
13. WHEN more than one WorkaPool user has the row `codRep` and at least one has a non-empty name THEN the system SHALL set `sellerName` to the name that is first by case-insensitive alphabetical order and, on a tie, by smallest user id.
14. WHEN no WorkaPool user has that `codRep`, or every matching name is empty THEN the system SHALL set `sellerName` to null.

**Independent Test**: Fixture de itens faturados e `sitped = 5` do mesmo pedido e de clientes diferentes, com datas no limite da janela; a resposta lista cada item com os próprios números, na ordem definida, sem código do cliente aberto.

---

### P1: Visibilidade por papel ⭐ MVP

**User Story**: Como vendedor, quero ver só os meus pedidos desse grupo; como gestor ou admin, quero ver também os dos outros vendedores.

**Why P1**: A lista da empresa inteira sem esse corte expõe cotação de outro representante ao vendedor.

**Acceptance Criteria**:

1. WHEN the caller role is `VENDAS` and the caller's `codRep` is not the open customer's primary representative THEN the system SHALL respond HTTP 403 with code `OVERVIEW_CUSTOMER_FORBIDDEN`.
2. WHEN the caller role is `VENDAS` and the caller is the open customer's primary representative THEN the system SHALL return only rows whose `codRep` equals the caller `codRep`, each with `ownedByViewer` true.
3. WHEN the caller role is `ADMIN` or `GERENTE_DPTO` THEN the system SHALL return rows from every seller in the window.
4. WHEN the caller role is `ADMIN` or `GERENTE_DPTO` and the row `codRep` equals the caller `codRep` and that `codRep` is greater than 0 THEN the system SHALL set `ownedByViewer` true.
5. WHEN the caller role is `ADMIN` or `GERENTE_DPTO` and the row `codRep` differs from the caller `codRep`, or the caller `codRep` is 0 THEN the system SHALL set `ownedByViewer` false.
6. IF the caller role is not `ADMIN`, `GERENTE_DPTO`, or `VENDAS` THEN the system SHALL respond HTTP 403 with code `OVERVIEW_CUSTOMER_FORBIDDEN`.
7. The system SHALL apply the seller filter in the use case that builds the row list.

**Independent Test**: O mesmo conjunto de linhas, chamado como `VENDAS` do cliente e como `GERENTE_DPTO`, devolve subconjunto próprio versus lista completa com `ownedByViewer` correto.

---

### P1: Coluna única na ficha ⭐ MVP

**User Story**: Como usuário da ficha, quero ver essa lista numa coluna só, verde para ganho e vermelho para perdido, com o pedido de outro vendedor apagado e identificado.

**Why P1**: É a tela que substitui os dois cards.

**Acceptance Criteria**:

1. WHEN a product group is selected in the commercial-analysis section THEN the system SHALL render one quote column and SHALL NOT render the two-card gains/losses grid.
2. WHEN a row has `ownedByViewer` true and `outcome` `ganha` THEN the system SHALL render a saturated green row with the order number, emission date, line amount, quantity in kg, unit price, and margin, and SHALL NOT render an outcome badge or a seller badge.
3. WHEN a row has `ownedByViewer` true and `outcome` `perdida` THEN the system SHALL render a saturated red row with the same item figures plus the loss reason, and SHALL NOT render an outcome badge or a seller badge.
4. WHEN a row has `ownedByViewer` false and `outcome` `ganha` THEN the system SHALL render a muted row, a saturated green badge labeled `Ganha`, and a blue badge.
5. WHEN a row has `ownedByViewer` false and `outcome` `perdida` THEN the system SHALL render a muted row, a saturated red badge labeled `Perdida`, the loss reason, and a blue badge.
6. WHEN a blue badge renders and `sellerName` is non-empty THEN the system SHALL label it `{codRep} {sellerName}` separated by a single space.
7. WHEN a blue badge renders and `sellerName` is null THEN the system SHALL label it with the `codRep` only.
8. The system SHALL NOT display an invoice number, a product code, or a customer name on the row.
9. WHEN two rows share an order number THEN the system SHALL render two rows, each with its own amount, quantity, unit price, and margin.
10. WHEN the row list is empty THEN the system SHALL show `Nenhuma cotação deste grupo nas últimas 2 semanas.`
11. IF the quote request fails THEN the system SHALL show an error with retry and SHALL NOT show the empty-window message.
12. The quote column component SHALL render from the row list alone, without the customer's revenue share or the ABC chip state.

**Independent Test**: Render da coluna com uma linha própria ganha, uma própria perdida e uma de outro vendedor em cada resultado; o grid de dois cards não aparece; linhas do mesmo pedido não somam.

---

## Edge Cases

- IF an invoiced item and a lost item share an order number THEN the system SHALL return both rows, each with its own outcome and amounts.
- IF the caller `codRep` is 0 THEN the system SHALL set `ownedByViewer` false on every row returned to `ADMIN` or `GERENTE_DPTO`.
- IF a group code matches no item in the window THEN the system SHALL return an empty list and the column SHALL show the empty-window message.
- IF the emission date equals the window start THEN the system SHALL include the row.
- IF the emission date is the day before the window start THEN the system SHALL exclude the row.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| GRPQ-01 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-02 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-03 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-04 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-05 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-06 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-07 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-08 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-09 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-10 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-11 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-12 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-13 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-14 | P1: Lista viva por item do grupo | Design | Pending |
| GRPQ-15 | P1: Visibilidade por papel | Design | Pending |
| GRPQ-16 | P1: Visibilidade por papel | Design | Pending |
| GRPQ-17 | P1: Visibilidade por papel | Design | Pending |
| GRPQ-18 | P1: Visibilidade por papel | Design | Pending |
| GRPQ-19 | P1: Visibilidade por papel | Design | Pending |
| GRPQ-20 | P1: Visibilidade por papel | Design | Pending |
| GRPQ-21 | P1: Visibilidade por papel | Design | Pending |
| GRPQ-22 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-23 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-24 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-25 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-26 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-27 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-28 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-29 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-30 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-31 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-32 | P1: Coluna única na ficha | Design | Pending |
| GRPQ-33 | P1: Coluna única na ficha | Design | Pending |

**Coverage:** 33 total, 0 mapped to tasks, 33 unmapped.

---

## Success Criteria

- [ ] Com um grupo selecionado, a ficha mostra uma coluna só, do mais recente para o mais antigo, sem os dois cards.
- [ ] Dois itens do mesmo pedido aparecem em duas linhas, cada uma com o próprio valor e a própria margem.
- [ ] Um vendedor não recebe, na resposta, pedido de outro `codRep`.
- [ ] Gestor e admin veem o pedido de outro vendedor apagado, com badge “Ganha” ou “Perdida” e badge azul `codRep` mais nome do usuário.
- [ ] Fora da janela de 14 dias a linha não entra; no primeiro e no último dia da janela, entra.
