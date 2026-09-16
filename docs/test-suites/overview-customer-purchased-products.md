# Test Suite: Overview customer purchased products

## User story source
- [#98](https://github.com/Gabr1elaugus700/WorkaPool/issues/98)
- PRD context: [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92)

## Seams sob teste (TDD)
1. Sync step `produtos-comprados` materialization (Senior fixture -> product-mix read model)
2. Authenticated `GET` endpoint for purchased products (lazy-section contract)
3. Purchased-products section rendering in Overview customer detail view

## Risco e foco
- Coberturas ja existentes tratam identity/auth geral, list/search, commercial summary e monthly evolution.
- O maior risco funcional do slice `produtos-comprados` esta em materialization correctness e contract stability.
- Regras com maior risco de regressao: excecao de volume para `101072` e margem ponderada por receita de item.
- Carregamento lazy nao pode bloquear first paint de identity/commercial summary.

## Ciclos TDD (red -> green)

### Ciclo 1 - Sync materialization
**Seam:** `produtos-comprados` dentro do `OverviewCustomerSyncPipeline` (served snapshot published).

**Red**
- Escrever teste de integracao que falha ao validar cutoff em `2024-01-01`, agregacao por produto e campos derivados obrigatorios.
- Escrever teste de integracao que falha para regra especial de volume do produto `101072`.
- Escrever teste de integracao que falha para margem ponderada por receita (nao media aritmetica simples).
- Escrever teste de integracao que falha para ordenacao por `revenueShare` decrescente.

**Green**
- Implementar apenas o minimo para passar cada teste na ordem acima.
- Garantir publish atomico do served snapshot somente quando os dados do step estiverem consistentes.

**Evidencia**
- Testes de integracao verdes para cutoff, regra `101072`, margem ponderada e ranking por `revenueShare`.

### Ciclo 2 - Endpoint contract + authorization
**Seam:** endpoint dedicado de produtos comprados (`GET` autenticado para secao lazy).

**Red**
- Escrever teste de integracao/security que falha com `401` sem token.
- Escrever teste de integracao/security que falha com `403` para perfil `VENDAS` fora do `codRep` primario.
- Escrever teste de integracao que falha ao validar `200` para perfil permitido e payload restrito a secao de produtos.
- Escrever teste de integracao que falha ao validar `404` para cliente inexistente/nao sincronizado.

**Green**
- Implementar autorizacao e contrato HTTP minimo para passar os cenarios.
- Manter separacao de camadas: controller valida/delega, regras de acesso no use-case/service.

**Evidencia**
- Matriz de status por role/cenario: `401`, `403`, `200`, `404`.

### Ciclo 3 - Frontend lazy section behavior
**Seam:** renderizacao da secao de produtos comprados na tela de detalhe do cliente.

**Red**
- Escrever teste de UI que falha quando first paint fica bloqueado aguardando request de produtos.
- Escrever teste de UI que falha ao validar renderizacao das metricas principais com resposta de sucesso.
- Escrever teste de UI que falha para estados resilientes: empty state e erro nao bloqueante.

**Green**
- Implementar apenas o necessario para manter lazy loading sem bloquear identity/commercial summary.
- Garantir que a secao trate sucesso, vazio e erro sem quebrar a tela.

**Evidencia**
- Testes de UI verdes para first paint, render de mix e estados de fallback.

## Plano pre-desenvolvimento (ordem de execucao)

### Seams confirmados
Seams confirmados para este slice:
1. Sync step `produtos-comprados` materialization
2. Endpoint autenticado de purchased products
3. Renderizacao lazy da secao no detalhe

### Ordem de specs (um teste red por vez)
1. `backend/test/unit/features/overviewCustomer/sync/materializeOverviewCustomerPurchasedProducts.test.ts`
2. `backend/test/unit/features/overviewCustomer/sync/createOverviewCustomerSyncSteps.test.ts`
3. `backend/test/unit/features/overviewCustomer/http/overviewCustomerPurchasedProductsRoutes.test.ts`
4. `backend/test/unit/features/overviewCustomer/http/overviewCustomerDetailRoutes.test.ts`
5. `frontend/src/features/overviewCustomer/components/OverviewCustomerPurchasedProductsSection.test.ts`
6. `frontend/src/features/overviewCustomer/services/overviewCustomerService.test.ts`

### Ciclo 1 - Sync materialization (backend)
**Arquivo 1:** `backend/test/unit/features/overviewCustomer/sync/materializeOverviewCustomerPurchasedProducts.test.ts`

**Spec names planejados**
- `materializeOverviewCustomerPurchasedProducts`
- `aggregates only invoiced lines since 2024-01-01`
- `applies half-volume rule for product 101072`
- `computes margin weighted by line revenue`
- `sorts rows by descending revenueShare`

**Primeiro teste red**
- `it("aggregates only invoiced lines since 2024-01-01 with required derived fields", ...)`
- Entrada: seed com linhas antes/depois do cutoff.
- Esperado: produto antes do cutoff excluido; campos `quantity`, `volume`, `revenue`, `averagePrice`, `firstPurchaseAt`, `lastPurchaseAt`, `frequencyDays`, `revenueShare` presentes.

**Arquivo 2:** `backend/test/unit/features/overviewCustomer/sync/createOverviewCustomerSyncSteps.test.ts`

**Spec name planejado**
- `wires produtos-comprados step after evolucao-mensal with materialized payload`

**Primeiro teste red**
- `it("registers produtos-comprados as a concrete step instead of pending wiring", ...)`
- Esperado: lista de steps inclui `produtos-comprados` com executor real e metadata coerente.

### Ciclo 2 - Endpoint contract + authorization (backend)
**Arquivo 3:** `backend/test/unit/features/overviewCustomer/http/overviewCustomerPurchasedProductsRoutes.test.ts`

**Spec names planejados**
- `rejects unauthenticated access with 401`
- `rejects unauthorized VENDAS access with 403`
- `returns 200 and products-only payload for ADMIN`
- `returns 404 for unknown or not-synced customer`

**Primeiro teste red**
- `it("rejects unauthenticated access with 401", ...)`
- Esperado: sem `Authorization`, `GET /api/overview/customers/:id/purchased-products` retorna `401`.

**Arquivo 4:** `backend/test/unit/features/overviewCustomer/http/overviewCustomerDetailRoutes.test.ts`

**Spec name planejado**
- `does not require purchased-products payload on first paint detail route`

**Primeiro teste red**
- `it("returns customer + commercialSummary without purchasedProducts key", ...)`
- Esperado: payload do detalhe nao inclui secao lazy de produtos comprados.

### Ciclo 3 - Frontend lazy behavior (frontend)
**Arquivo 5:** `frontend/src/features/overviewCustomer/components/OverviewCustomerPurchasedProductsSection.test.ts`

**Spec names planejados**
- `renders non-blocking loading state`
- `renders empty state when there are no rows`
- `renders error state without breaking page`
- `renders product metrics when request succeeds`

**Primeiro teste red**
- `it("renders loading placeholder without replacing identity/commercial summary areas", ...)`
- Esperado: secao mostra placeholder local e nao impede render de blocos ja carregados.

**Arquivo 6:** `frontend/src/features/overviewCustomer/services/overviewCustomerService.test.ts`

**Spec name planejado**
- `calls purchased-products endpoint with encoded customer id`

**Primeiro teste red**
- `it("requests /api/overview/customers/:id/purchased-products", ...)`
- Esperado: novo metodo de service monta path correto sem alterar `getDetail`.

## DoD do plano antes de codar
- Cada arquivo acima com 1 teste red inicial commitado/validado antes da implementacao correspondente.
- Nenhum salto horizontal: nao criar todos os testes de uma vez.
- Cada green limitado ao minimo para virar o teste atual.

## Gherkin
```gherkin
Feature: Overview customer purchased products
  Authorized users load purchased-product mix on demand without impacting first paint.

  @integration @critical
  Scenario: Sync materializes purchased-product aggregates since Jan/2024
    Given Senior fixtures with invoiced product lines before and after 2024-01-01
    When the "produtos-comprados" sync step is materialized
    Then only qualifying lines since 2024-01-01 are aggregated
    And each product row includes quantity, volume, revenue, averagePrice, firstPurchaseAt, lastPurchaseAt, frequencyDays, and revenueShare

  @integration @critical
  Scenario: Sync applies volume exception for product 101072
    Given fixtures with product code 101072 and regular products for the same customer
    When the purchased-products snapshot is materialized
    Then product 101072 volume uses half-volume rule
    And other product volumes use the default quantity rule

  @integration @critical
  Scenario: Sync computes weighted margin from item revenue
    Given fixtures with multiple lines for the same product with different revenues and margin percents
    When the purchased-products snapshot is materialized
    Then margin is weighted by line revenue
    And margin is not a simple arithmetic average

  @integration @high
  Scenario: Product mix is sorted by descending revenue share
    Given a customer with multiple purchased products and different revenues
    When the purchased-products snapshot is materialized
    Then product rows are ordered by descending revenue share

  @security @critical
  Scenario: Unauthenticated products endpoint request is rejected
    Given no authentication token
    When I GET purchased products for a known clienteId
    Then the response status is 401

  @security @critical
  Scenario: VENDAS cannot access purchased products for another primary salesperson
    Given a synced customer whose primary codRep is 10
    And I am authenticated as VENDAS with codRep 20
    When I GET purchased products for that clienteId
    Then the response status is 403

  @integration @critical
  Scenario: Allowed role gets purchased products through dedicated lazy endpoint
    Given a synced customer with purchased-products data
    And I am authenticated as ADMIN
    When I GET purchased products for that clienteId
    Then the response status is 200
    And the response includes only the purchased-products section payload
    And the customer identity first-paint payload is not required in this endpoint

  @integration @medium
  Scenario: Unknown or not-synced customer returns 404 on products endpoint
    Given no purchased-products data exists for clienteId 999999
    And I am authenticated as ADMIN
    When I GET purchased products for clienteId 999999
    Then the response status is 404

  @unit @critical
  Scenario: Detail first paint renders without waiting for purchased-products
    Given identity and commercial summary are available for first paint
    And purchased-products is configured as lazy
    When the customer detail view loads
    Then identity and summary render before products request resolves

  @unit @high
  Scenario: Purchased-products section renders product mix for an authorized user
    Given the products endpoint returns top purchased products with metrics
    When the purchased-products request succeeds
    Then the UI renders product rows with quantity, volume, revenue, margin, frequency, and revenue share

  @unit @medium
  Scenario: Purchased-products section shows empty and error states safely
    Given the products endpoint returns no rows or fails
    When the purchased-products section renders
    Then the UI shows an empty state for no data
    And shows a non-blocking error state when request fails
```
