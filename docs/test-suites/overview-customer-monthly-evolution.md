# Test Suite: Overview customer monthly evolution

## User Story Source
- [#97](https://github.com/Gabr1elaugus700/WorkaPool/issues/97)
- PRD context: [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92)

## Seams Under Test
- Sync step `evolucao-mensal` (Senior fixture to read model monthly snapshot)
- Dedicated authenticated monthly GET endpoint (lazy section contract)
- Monthly section rendering in Overview customer detail view

## Coverage Notes
- Existing coverage already validates identity/auth, list/search, and commercial summary seams.
- Current backend sync wiring still marks `evolucao-mensal` as pending integration.
- No dedicated monthly endpoint contract coverage found yet.
- No frontend monthly lazy section coverage found yet.
- Highest risks: cutoff consistency since Jan/2024, auth parity with Overview detail rules, and lazy loading not blocking first paint.

## Slice Order
1. Sync materialization for monthly evolution (cutoff, ordering, null-safe metrics)
2. HTTP endpoint contract plus authorization behavior
3. Frontend lazy section behavior and resilient UI states

## Gherkin
Feature: Overview customer monthly evolution
  Authorized users load monthly evolution on demand without impacting first paint.

  @integration @critical
  Scenario: Sync materializes monthly series since Jan/2024
    Given Senior fixtures with monthly commercial lines before and after 2024-01-01
    When the "evolucao-mensal" sync step is materialized
    Then only months from 2024-01 onward are persisted
    And each month contains revenue, volume, orderCount, and margin when available

  @integration @high
  Scenario: Sync output is ordered chronologically by month
    Given a fixture customer with records for multiple months out of order
    When the monthly snapshot is materialized
    Then the persisted monthly rows are sorted from oldest to newest month

  @integration @high
  Scenario: Sync handles months without margin data
    Given a fixture customer with monthly rows where margin is missing
    When the monthly snapshot is materialized
    Then revenue, volume, and orderCount are still computed
    And margin is null for those months

  @security @critical
  Scenario: Unauthenticated monthly endpoint request is rejected
    Given no authentication token
    When I GET monthly evolution for a known clienteId
    Then the response status is 401

  @security @critical
  Scenario: VENDAS cannot access monthly evolution for another primary salesperson
    Given a synced customer whose primary codRep is 10
    And I am authenticated as VENDAS with codRep 20
    When I GET monthly evolution for that clienteId
    Then the response status is 403

  @integration @critical
  Scenario: Allowed role gets monthly evolution through dedicated lazy endpoint
    Given a synced customer with monthly evolution data
    And I am authenticated as ADMIN
    When I GET monthly evolution for that clienteId
    Then the response status is 200
    And the response includes only the monthly section payload
    And the customer identity first-paint payload is not required in this endpoint

  @integration @medium
  Scenario: Unknown or not-synced customer returns 404 on monthly endpoint
    Given no monthly data exists for clienteId 999999
    And I am authenticated as ADMIN
    When I GET monthly evolution for clienteId 999999
    Then the response status is 404

  @unit @critical
  Scenario: Detail first paint renders without waiting for monthly evolution
    Given identity and commercial summary are available for first paint
    And monthly evolution is configured as lazy
    When the customer detail view loads
    Then identity and summary render before monthly request resolves

  @unit @high
  Scenario: Monthly section renders loaded series for an authorized user
    Given the monthly endpoint returns month-by-month series
    When the monthly section request succeeds
    Then the UI renders the evolution rows or chart points in chronological order

  @unit @medium
  Scenario: Monthly section shows empty and error states safely
    Given the monthly endpoint returns no rows or fails
    When the monthly section renders
    Then the UI shows an empty state for no data
    And shows a non-blocking error state when request fails
