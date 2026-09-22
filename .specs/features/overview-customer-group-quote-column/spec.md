# Overview Customer — Coluna de cotações por produto

## Problem Statement

A análise comercial por grupo mostra ganhos e perdidos em dois cards lado a lado, somando os itens do pedido. Quem está na ficha precisa ver, numa coluna só, os itens do produto escolhido neste cliente. Admin e gestor podem revelar outros clientes do mesmo produto. A leitura no Sapiens é a do grupo na janela de 12 dias; o backend calcula as datas, filtra cliente e produto, guarda o resultado e a tela mostra carregamento enquanto essa leitura acontece.

## Goals

- [ ] No grupo ABC escolhido, a pessoa seleciona um `codPro` e a coluna lista só os itens desse produto neste cliente.
- [ ] A leitura no Sapiens traz os itens do grupo com `sitped` 9 ou 5, sem calcular a janela no SQL. O backend corta os 12 dias e filtra cliente e produto.
- [ ] A mesma leitura do grupo é reutilizada ao trocar de produto ou revelar outros clientes. A tela mostra carregamento na primeira busca.
- [ ] Vendedor não revela outros clientes. Admin e gestor têm o botão de revelar, com linhas apagadas e badges.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Página nova de análise de produto | O bloco fica reutilizável; a rota não entra agora |
| Busca livre de produto fora do grupo | O chip de grupo continua; o produto sai da leitura desse grupo |
| Revelar outros clientes para `VENDAS` | Só admin e gestor |
| Agregar itens do mesmo pedido | Cada item é uma linha |
| Nota fiscal (`e140nfv`) como origem do ganho | O SQL alvo lê `e120ped` / `e120ipd` |
| `GETDATE` ou `DATEADD` na janela do SQL | As datas são parâmetros calculados no backend |
| Segunda ida ao Sapiens ao voltar no mesmo grupo no mesmo dia | O cache do grupo atende cliente, produto e revelar |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Leitura | Uma consulta do grupo, todos os clientes e produtos do grupo, `sitped IN (9, 5)`, item de `e120ipd` | SQL alvo, sem filtro de cliente nem de `codPro` | y |
| Verde | `sitped = 9`, data de emissão do pedido (`ped.datemi`) | O SQL coloca 9 ao lado de 5; 5 já é a cotação perdida | y |
| Vermelho | `sitped = 5`, data de emissão do pedido | SQL alvo | y |
| Janela | Backend calcula, no calendário `America/Sao_Paulo`, início = hoje menos 12 dias e fim exclusivo = amanhã. Em 2026-09-21 entram emissões de 2026-09-09 a 2026-09-21 | O usuário pediu 12 dias para trás, fora do SQL | y |
| Parâmetros | `@grpPro`, `@dataInicio`, `@dataFimExclusiva`. O texto SQL não chama `GETDATE` nem `DATEADD` | O cálculo da janela é do backend | y |
| Recorte padrão | Sobre o resultado em cache: cliente aberto + `codPro` selecionado | Opção já confirmada | y |
| Revelar | `ADMIN` e `GERENTE_DPTO` incluem, do mesmo cache, outros clientes do mesmo `codPro` | Opção já confirmada; não é outra consulta | y |
| Vendedor | Não recebe outros clientes e não vê o botão | Opção já confirmada | y |
| Cache | Chave = código do grupo + data de início da janela. Vale até mudar o dia em `America/Sao_Paulo`. Trocar produto, cliente ou revelar não abre outra consulta Sapiens | Ida e volta em produto do cliente consome o banco uma vez | y |
| Carregamento | Enquanto a primeira leitura do grupo não voltou, a seção mostra estado de carregamento e não a mensagem de vazio | Evita parecer que não há pedidos enquanto o Sapiens responde | y |
| Seletor de produto | `codPro` distintos do cliente aberto dentro dessa leitura, nome `ipd.cplipd`. O menor código começa selecionado | Não há segunda consulta para histórico fora da janela | y |
| Nome no badge | `User.name` pelo `codRep`. Vários usuários: nome não vazio em ordem alfabética sem diferenciar maiúsculas; empate no menor `id`. Sem usuário: `aperep` do SQL. Sem os dois: só o `codRep` | O nome do WorkaPool continua o pedido; `aperep` cobre a falta | y |
| Campos da linha | Os do SQL alvo, do próprio item: situação, pedido, datas, quantidades, preços, margem, IPI, ICMS, custo, frete, transportadora e frete incluso | São as colunas selecionadas | y |
| Cliente na linha revelada | Nome fantasia (`apecli`) só quando a linha é de outro cliente | A linha do cliente aberto não repete o cliente | y |
| Falha do Sapiens | HTTP 503 `OVERVIEW_CUSTOMER_GROUP_QUOTES_UNAVAILABLE`, sem lista parcial e sem cache dessa falha | Metade da lista pareceria o grupo inteiro | n |
| Falha ao ler usuários | As linhas ainda voltam; o badge usa `aperep` ou só o `codRep` | O nome é complemento | n |
| Motivo da perda | Em `sitped = 5`, texto de order loss ou `Sem justificativa registrada.` A busca é no WorkaPool, pelos pedidos já lidos, sem nova ida ao Sapiens | O card vermelho já mostra o motivo; o SQL alvo não traz essa coluna | n |
| Ordenação | `ped.datemi` decrescente, `numped` decrescente, `codpro` crescente | Desempate estável | n |
| Segundo clique | Oculta as linhas de outros clientes, ainda pelo cache | Revelar é estado de filtro | n |
| Acesso do vendedor à ficha | Continua exigindo o representante principal do cliente aberto | A seção segue na ficha | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Uma leitura do grupo, produto no cliente ⭐ MVP

**User Story**: Como usuário da ficha, quero escolher um produto do grupo e ver o carregamento uma vez, sem o Sapiens ser consultado de novo a cada produto.

**Why P1**: A consulta é do grupo; cliente e produto são filtro em cima do cache.

**Acceptance Criteria**:

1. WHEN a product group is selected and the group is not cached for the current window THEN the system SHALL query Sapiens once for that group and SHALL show a loading state until that read finishes.
2. WHILE that read is in flight THEN the system SHALL NOT show `Nenhum produto deste grupo para este cliente.` and SHALL NOT show `Nenhuma cotação deste produto nos últimos 12 dias.`
3. WHEN the read finishes THEN the system SHALL list the distinct products of the open customer in that result, each with `codpro` and `cplipd`, and SHALL NOT query Sapiens again to build that list.
4. WHEN that product list is non-empty and the user has not chosen a product THEN the system SHALL select the lowest product code in ascending order.
5. WHEN the user selects another product of the same group on the same São Paulo calendar date THEN the system SHALL filter the cached lines and SHALL NOT query Sapiens again.
6. WHEN the cached lines have no product for the open customer THEN the system SHALL show `Nenhum produto deste grupo para este cliente.`
7. WHEN the same group is requested again on the same São Paulo calendar date THEN the system SHALL reuse the cached lines and SHALL NOT query Sapiens again.
8. WHEN the São Paulo calendar date changes THEN the system SHALL treat the previous cache entry as missed and SHALL query Sapiens again with the new window.

**Independent Test**: Duas trocas de produto no mesmo grupo contam uma chamada ao Sapiens; a segunda, no dia seguinte, conta outra. Durante a primeira chamada a tela está em carregamento.

---

### P1: Itens do produto neste cliente ⭐ MVP

**User Story**: Como usuário autorizado, quero só os itens daquele `codPro` naquele cliente, nas datas que o backend calculou, uma linha por item.

**Why P1**: É a coluna antes de revelar.

**Acceptance Criteria**:

1. WHEN the backend builds the window for São Paulo calendar date 2026-09-21 THEN the system SHALL set the inclusive start to `2026-09-09` and the exclusive end to `2026-09-22`.
2. The Sapiens statement SHALL filter `ped.datemi >= @dataInicio` and `ped.datemi < @dataFimExclusiva` and SHALL NOT contain `GETDATE` or `DATEADD`.
3. The Sapiens statement SHALL keep `grp.codgrp = @grpPro` and `ped.sitped IN (9, 5)` and SHALL NOT filter by customer code or product code.
4. WHEN an item line has `sitped = 9` and `ped.datemi` inside the window THEN the system SHALL set `outcome` to `ganha` and `issuedAt` from `ped.datemi`.
5. WHEN an item line has `sitped = 5` and `ped.datemi` inside the window THEN the system SHALL set `outcome` to `perdida` and `issuedAt` from `ped.datemi`.
6. WHEN quotes are requested for the open customer and a product code THEN the system SHALL return one cached item line per `e120ipd` row of that product and customer, and SHALL NOT sum rows that share an order number.
7. The system SHALL include only rows whose customer is the open customer and whose product code is the selected product code when reveal is off.
8. The system SHALL return, from that item, `orderNumber`, `issuedAt`, `outcome`, `situation`, `productCode`, `productName`, `quantity`, `unitPrice`, `lineAmount`, `marginPercent`, `ipiAmount`, `icmsAmount`, `icmsPercent`, `costPrice`, `freightAmount`, `carrierCode`, `freightIncluded`, `codRep`, `sellerName`, `lossReason`, and `otherCustomer` false.
9. The system SHALL order rows by `issuedAt` descending, then `orderNumber` descending, then product code ascending.
10. WHEN a lost row has no recorded loss reason THEN the system SHALL set `lossReason` to `Sem justificativa registrada.`
11. WHEN a won row is returned THEN the system SHALL set `lossReason` to null.
12. WHEN loss reasons are resolved THEN the system SHALL read them from WorkaPool for the order numbers already returned and SHALL NOT query Sapiens for them.
13. WHEN no row matches the customer and product THEN the system SHALL return HTTP 200 and an empty row list.
14. IF the live Sapiens read fails THEN the system SHALL respond HTTP 503 with code `OVERVIEW_CUSTOMER_GROUP_QUOTES_UNAVAILABLE`, SHALL NOT cache that failure, and SHALL NOT return a partial row list.
15. IF the WorkaPool user lookup fails THEN the system SHALL still return the quote rows with `sellerName` null.
16. WHEN more than one WorkaPool user has the row `codRep` and at least one has a non-empty name THEN the system SHALL set `sellerName` to the name that is first by case-insensitive alphabetical order and, on a tie, by smallest user id.
17. WHEN no WorkaPool user has that `codRep`, or every matching name is empty THEN the system SHALL set `sellerName` to null.
18. WHEN the caller role is `VENDAS` and the caller's `codRep` is not the open customer's primary representative THEN the system SHALL respond HTTP 403 with code `OVERVIEW_CUSTOMER_FORBIDDEN`.
19. IF the caller role is not `ADMIN`, `GERENTE_DPTO`, or `VENDAS` THEN the system SHALL respond HTTP 403 with code `OVERVIEW_CUSTOMER_FORBIDDEN`.

**Independent Test**: Fixture com dois itens do mesmo pedido e do mesmo `codPro` neste cliente, um item de outro cliente e um item com emissão em 2026-09-08; sem revelar, a resposta traz só os dois itens, com os próprios valores, e a sentença SQL recebe as datas prontas.

---

### P1: Revelar outros clientes pelo cache ⭐ MVP

**User Story**: Como admin ou gestor, quero revelar cotações de outros vendedores em outros clientes, só do mesmo produto, sem outra consulta ao Sapiens.

**Why P1**: O botão é filtro do que já foi lido.

**Acceptance Criteria**:

1. WHEN the caller role is `ADMIN` or `GERENTE_DPTO` and reveal is requested THEN the system SHALL return the open customer's rows for the selected product plus cached rows for that same product whose customer is not the open customer, and SHALL NOT query Sapiens again.
2. WHEN a returned row belongs to another customer THEN the system SHALL set `otherCustomer` true and SHALL include that customer's trade name (`apecli`), the row `codRep`, and `sellerName`.
3. WHEN the caller role is `VENDAS` THEN the system SHALL NOT return rows for other customers, even if reveal is requested.
4. WHEN reveal is not requested THEN the system SHALL NOT return rows for other customers.

**Independent Test**: Grupo já em cache com o mesmo `codPro` em dois clientes; revelar não incrementa a contagem de chamadas ao Sapiens; `VENDAS` continua só com o cliente aberto.

---

### P1: Coluna na ficha ⭐ MVP

**User Story**: Como usuário da ficha, quero uma coluna só, com carregamento na busca, verde ou vermelha, e o botão de revelar só para admin e gestor.

**Why P1**: Substitui os dois cards.

**Acceptance Criteria**:

1. WHEN a product group is selected THEN the system SHALL keep the ABC group chips and SHALL NOT render the two-card gains/losses grid.
2. WHEN a product is selected THEN the system SHALL show that product code and product name once above the rows and SHALL render one quote column.
3. WHEN a row renders THEN the system SHALL show the order number, emission date, quantity, unit price, line amount, margin, IPI amount, ICMS amount, ICMS percent, cost price, freight amount, carrier code, and freight-included value from that item.
4. WHEN a row has `otherCustomer` false and `outcome` `ganha` THEN the system SHALL render a saturated green row and SHALL NOT render an outcome badge, a seller badge, or a customer name.
5. WHEN a row has `otherCustomer` false and `outcome` `perdida` THEN the system SHALL render a saturated red row with the loss reason and SHALL NOT render an outcome badge, a seller badge, or a customer name.
6. WHEN the caller role is `VENDAS` THEN the system SHALL NOT render the reveal button.
7. WHEN the caller role is `ADMIN` or `GERENTE_DPTO` and reveal is off THEN the system SHALL render a button labeled `Revelar cotações de outros vendedores` and SHALL NOT render other-customer rows.
8. WHEN reveal is on and a row has `otherCustomer` true and `outcome` `ganha` THEN the system SHALL render a muted row, the other customer's trade name, a saturated green badge labeled `Ganha`, and a blue badge.
9. WHEN reveal is on and a row has `otherCustomer` true and `outcome` `perdida` THEN the system SHALL render a muted row, the other customer's trade name, a saturated red badge labeled `Perdida`, the loss reason, and a blue badge.
10. WHEN a blue badge renders and `sellerName` is non-empty THEN the system SHALL label it `{codRep} {sellerName}` separated by a single space.
11. WHEN a blue badge renders and `sellerName` is null and the rep short name is non-empty THEN the system SHALL label the blue badge `{codRep} {repShortName}` separated by a single space.
12. WHEN a blue badge renders and both `sellerName` and the rep short name are empty THEN the system SHALL label it with the `codRep` only.
13. WHEN reveal is turned off THEN the system SHALL remove other-customer rows and SHALL label the button `Revelar cotações de outros vendedores`.
14. WHEN reveal is on THEN the system SHALL label the button `Ocultar cotações de outros vendedores`.
15. The system SHALL NOT display an invoice number on the row.
16. WHEN two rows share an order number THEN the system SHALL render two rows, each with its own item amounts.
17. WHEN the row list is empty and the read has finished THEN the system SHALL show `Nenhuma cotação deste produto nos últimos 12 dias.`
18. IF the quote request fails THEN the system SHALL show an error with retry and SHALL NOT show the empty-window message.
19. The quote column component SHALL render from the selected product, the row list, the loading flag, and whether reveal is available, without the customer's revenue share or the ABC chip state.

**Independent Test**: Primeira seleção do grupo mostra carregamento e depois a coluna do produto, sem os dois cards. Gestor revela linha de outro cliente sem novo loading de Sapiens; vendedor não vê o botão.

---

## Edge Cases

- IF `ped.datemi` is `2026-09-09` on a request whose São Paulo date is `2026-09-21` THEN the system SHALL include the row.
- IF `ped.datemi` is `2026-09-08` on that request THEN the system SHALL exclude the row.
- IF `ped.datemi` is `2026-09-22` on that request THEN the system SHALL exclude the row.
- IF `sitped` is neither 9 nor 5 THEN the system SHALL exclude the row.
- IF the product's group code differs from `@grpPro` THEN the system SHALL exclude the row.
- IF reveal is requested by `VENDAS` THEN the system SHALL return only the open customer's rows.
- IF Sapiens fails THEN the system SHALL NOT reuse an empty cache for that group.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| GRPQ-01 | P1: Uma leitura do grupo, produto no cliente | Design | Pending |
| GRPQ-02 | P1: Uma leitura do grupo, produto no cliente | Design | Pending |
| GRPQ-03 | P1: Uma leitura do grupo, produto no cliente | Design | Pending |
| GRPQ-04 | P1: Uma leitura do grupo, produto no cliente | Design | Pending |
| GRPQ-05 | P1: Uma leitura do grupo, produto no cliente | Design | Pending |
| GRPQ-06 | P1: Uma leitura do grupo, produto no cliente | Design | Pending |
| GRPQ-07 | P1: Uma leitura do grupo, produto no cliente | Design | Pending |
| GRPQ-08 | P1: Uma leitura do grupo, produto no cliente | Design | Pending |
| GRPQ-09 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-10 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-11 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-12 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-13 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-14 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-15 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-16 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-17 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-18 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-19 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-20 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-21 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-22 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-23 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-24 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-25 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-26 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-27 | P1: Itens do produto neste cliente | Design | Pending |
| GRPQ-28 | P1: Revelar outros clientes pelo cache | Design | Pending |
| GRPQ-29 | P1: Revelar outros clientes pelo cache | Design | Pending |
| GRPQ-30 | P1: Revelar outros clientes pelo cache | Design | Pending |
| GRPQ-31 | P1: Revelar outros clientes pelo cache | Design | Pending |
| GRPQ-32 | P1: Coluna na ficha | Design | Pending |
| GRPQ-33 | P1: Coluna na ficha | Design | Pending |
| GRPQ-34 | P1: Coluna na ficha | Design | Pending |
| GRPQ-35 | P1: Coluna na ficha | Design | Pending |
| GRPQ-36 | P1: Coluna na ficha | Design | Pending |
| GRPQ-37 | P1: Coluna na ficha | Design | Pending |
| GRPQ-38 | P1: Coluna na ficha | Design | Pending |
| GRPQ-39 | P1: Coluna na ficha | Design | Pending |
| GRPQ-40 | P1: Coluna na ficha | Design | Pending |
| GRPQ-41 | P1: Coluna na ficha | Design | Pending |
| GRPQ-42 | P1: Coluna na ficha | Design | Pending |
| GRPQ-43 | P1: Coluna na ficha | Design | Pending |
| GRPQ-44 | P1: Coluna na ficha | Design | Pending |
| GRPQ-45 | P1: Coluna na ficha | Design | Pending |
| GRPQ-46 | P1: Coluna na ficha | Design | Pending |
| GRPQ-47 | P1: Coluna na ficha | Design | Pending |
| GRPQ-48 | P1: Coluna na ficha | Design | Pending |
| GRPQ-49 | P1: Coluna na ficha | Design | Pending |
| GRPQ-50 | P1: Coluna na ficha | Design | Pending |

**Coverage:** 50 total, 0 mapped to tasks, 50 unmapped.

---

## Success Criteria

- [ ] A sentença enviada ao Sapiens recebe `@dataInicio` e `@dataFimExclusiva` já calculados e filtra o grupo com `sitped` 9 e 5.
- [ ] Em 2026-09-21 a linha de 2026-09-09 entra e a de 2026-09-08 fica de fora.
- [ ] Trocar de produto ou revelar outros clientes não dispara outra consulta ao Sapiens no mesmo dia.
- [ ] A primeira busca mostra carregamento; o vendedor vê só este cliente e este produto; admin e gestor revelam os outros clientes pelo cache.
