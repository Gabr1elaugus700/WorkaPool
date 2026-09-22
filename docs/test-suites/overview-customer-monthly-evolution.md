# Test Suite: Overview customer monthly evolution

## User Story Source
- [#97](https://github.com/Gabr1elaugus700/WorkaPool/issues/97)
- Parent PRD context: [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92)

## Seams Under Test
- Sync step `evolucao-mensal` materialization (Senior fixture -> read model monthly snapshot)
- Dedicated authenticated endpoint `GET /api/overview/customers/:clienteId/monthly-evolution`
- Detail UI monthly section rendering under lazy loading

## Coverage Notes
- Existing sync unit coverage validates Jan/2024 cutoff filtering and chronological output ordering.
- Existing sync unit coverage validates null-safe behavior when margin is missing while keeping revenue, volume, and orderCount.
- Existing route coverage validates authorized monthly retrieval (200) and unauthorized VENDAS access denial (403).
- Existing frontend unit coverage validates loading, empty, error, and loaded rendering states for the monthly section.
- Main remaining gap is explicit 401 coverage for unauthenticated monthly endpoint and explicit 404 coverage for unknown customer on the monthly endpoint.

## Risk Rationale
- **Cutoff correctness is business-critical:** including pre-2024 rows breaks PRD scope and can distort trend interpretation.
- **Chronological integrity drives analysis:** out-of-order series misleads users about growth, decline, or recovery.
- **Auth parity is mandatory:** monthly endpoint must enforce the same portfolio rules as detail first paint.
- **Lazy-load isolation protects UX:** regressions that block first paint defeat the purpose of splitting monthly evolution into a separate call.
- **Null and sparse months are common:** margin gaps must remain null-safe to avoid fake precision in commercial narratives.

## Execution Order
1. Validate sync materialization invariants (cutoff, ordering, null-safe margin handling).
2. Validate monthly endpoint authorization and payload contract for allowed users.
3. Add or confirm seam tests for unauthenticated (401) and unknown customer (404) monthly requests.
4. Validate frontend lazy section behaviors (loading, empty, error, loaded) independently from first paint.
5. Re-run targeted monthly regression when sync source SQL or transform mapping changes.

## Gherkin
Feature: Overview customer monthly evolution
  Authorized users load monthly evolution on demand without impacting first paint.

  @integration @critical
  Scenario: Sync materializes monthly series since Jan/2024
    Given Senior fixtures with monthly commercial rows before and after 2024-01-01
    When the "evolucao-mensal" sync step is materialized
    Then only months from 2024-01 onward are persisted
    And each month contains revenue, volume, orderCount, and margin when available

  @integration @high
  Scenario: Sync output is ordered chronologically by month
    Given a fixture customer with records for multiple months out of order
    When the monthly snapshot is materialized
    Then persisted monthly rows are sorted from oldest to newest month

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
    And the endpoint does not require first-paint sections

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
    Then the UI renders monthly rows in chronological order

  @unit @medium
  Scenario: Monthly section shows empty and error states safely
    Given the monthly endpoint returns no rows or fails
    When the monthly section renders
    Then the UI shows an empty state for no data
    And the UI shows a non-blocking error state when request fails
