# Test Suite: Overview customer commercial summary

## User Story Source
- [#96](https://github.com/Gabr1elaugus700/WorkaPool/issues/96)
- Parent PRD context: [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92)

## Seams Under Test
- Sync step `resumo-comercial` materialization (Senior fixture -> read model KPIs)
- Detail first-paint API contract `GET /api/overview/customers/:clienteId`
- Detail UI summary card rendering for Jan/2024 labels and frequency fields

## Coverage Notes
- Existing unit coverage validates numeric fixture parity for revenue, order counts, ticket, volume, weighted margin, purchase frequency, and days since last purchase.
- Existing API seam coverage validates first-paint payload composition, including `commercialSummary`, `customer`, and `sync`.
- Existing UI unit coverage validates labels "desde Jan/2024" and frequency fields visibility.
- Highest remaining risk is behavioral drift between trusted SQL intent and future sync transforms when adding new filters or fields.
- Secondary risk is first-paint degradation when summary data is partially missing or stale.

## Risk Rationale
- **Business metric correctness is critical:** wrong revenue, volume, margin, or frequency quickly erodes trust for gestores and vendedores.
- **Rule-specific edge cases are fragile:** product `101072` half-volume and weighted margin by line revenue can silently regress with refactors.
- **First-paint dependency risk:** if detail endpoint blocks or mis-shapes summary payload, the MVP promise ("understand relationship quickly") fails.
- **Sparse-history customers are common:** null-safe frequency and margin behavior must remain explicit to avoid misleading zero-like values.
- **Time-window boundaries matter:** Jan/2024 cutoff and last-12-month windows are prone to off-by-one and timezone mistakes.

## Execution Order
1. Validate sync materialization math and business rules (`resumo-comercial` invariants).
2. Validate first-paint detail API contract and fallback behavior when summary is absent.
3. Validate frontend summary-card labels and critical KPI visibility.
4. Extend fixtures for sparse and extreme histories at the sync seam.
5. Run targeted regression for this suite when sync SQL/transform fields change.

## Gherkin
Feature: Overview customer commercial summary
  Authorized users see a trusted commercial summary on first paint.

  @integration @critical
  Scenario: First paint includes commercial summary and sync freshness
    Given a synced customer with identity and resumo-comercial payload
    And I am authenticated as an allowed role for that customer
    When I GET the Overview customer detail
    Then the response status is 200
    And the body includes customer identity fields
    And the body includes commercial summary KPIs
    And the body includes sync freshness metadata

  @integration @high
  Scenario: Detail returns empty-safe summary when resumo-comercial is unavailable
    Given a synced customer identity without resumo-comercial payload
    And I am authenticated as ADMIN
    When I GET the Overview customer detail
    Then the response status is 200
    And commercial summary numeric totals are zero
    And nullable summary fields are null

  @integration @critical
  Scenario: resumo-comercial materialization matches trusted numeric fixture
    Given a fixture customer with known revenue, orders, volume, and margin inputs
    When the resumo-comercial step is materialized
    Then revenue since Jan/2024 and last 12 months match expected values
    And order count since Jan/2024 and last 12 months match expected values
    And ticket metrics match expected values
    And volume applies half-volume rule for product 101072
    And margin is weighted by line revenue
    And purchase frequency in days matches expected value
    And days since last purchase matches expected value

  @integration @medium
  Scenario: resumo-comercial handles sparse purchase history
    Given a customer with a single valid order and no margin data
    When the resumo-comercial step is materialized
    Then purchase frequency is null
    And weighted margin is null
    And the remaining totals are still computed

  @integration @high
  Scenario: resumo-comercial ignores returned-only volume lines
    Given a fixture line where returned quantity is equal to invoiced quantity
    When the resumo-comercial step is materialized
    Then that line does not contribute positive volume
    And revenue and order aggregates remain coherent

  @unit @high
  Scenario: Detail UI labels Jan/2024 totals explicitly
    Given a detail payload with commercial summary values
    When the summary card renders
    Then labels for revenue, orders, ticket, and volume include "desde Jan/2024"
    And frequency and days-since-last-purchase fields are visible
