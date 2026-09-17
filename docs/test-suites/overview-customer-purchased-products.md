# Test Suite: Overview customer purchased products

## User Story Source
- [#98](https://github.com/Gabr1elaugus700/WorkaPool/issues/98)
- Parent context: [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92)

## Seams Under Test
- Sync step `produtos-comprados` materialization (Senior lines -> served snapshot payload)
- Authenticated endpoint `GET /api/overview/customers/:clienteId/purchased-products`
- Frontend lazy section rendering in `OverviewCustomerDetailView`

## Coverage Notes
- Existing sync test already validates cutoff (`2024-01-01`), half-volume rule for `101072`, weighted margin, derived fields, and ordering by `revenueShare`.
- Existing HTTP tests already validate `401` (unauthenticated), `403` (cross-portfolio VENDAS), and `200` payload for authorized access.
- Existing UI test already validates loading, empty, error, and loaded states for the purchased-products section.
- Highest-risk gap: explicit `404` behavior for unknown/not-synced customer on the purchased-products endpoint is not covered directly.

## Risk Rationale
- **Materialization correctness is critical:** wrong cutoff/aggregation changes product ranking and business decisions.
- **Rule `101072` is fragile:** any change to quantity/volume logic can silently distort KPIs.
- **Weighted margin is easy to regress:** replacing weighted calculation with arithmetic average produces plausible but wrong margins.
- **Auth consistency protects data scope:** purchased-products must enforce the same portfolio constraints as other overview endpoints.
- **Lazy loading is a UX contract:** products request cannot block first paint of identity and commercial summary.

## Execution Order
1. Validate sync invariants (cutoff, `101072`, weighted margin, `revenueShare` ordering).
2. Validate endpoint auth matrix (`401`, `403`, `200`) and payload contract for authorized users.
3. Add explicit endpoint `404` scenario for unknown/not-synced customer.
4. Validate frontend lazy behavior remains non-blocking while preserving loading/empty/error/success rendering.
5. Re-run focused regression when SQL extraction or snapshot schema changes.

## Gherkin
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
