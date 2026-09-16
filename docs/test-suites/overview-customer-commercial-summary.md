# Test Suite #96 - Overview customer commercial summary

Source issue: [#96](https://github.com/Gabr1elaugus700/WorkaPool/issues/96)  
Story: [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92)

## Confirmed seams

1. `GET /api/overview/customers/:clienteId` (first paint identity + commercial summary + sync freshness)
2. Sync step `resumo-comercial` materialization (Senior fixture -> read model KPIs)
3. Detail UI rendering for "desde Jan/2024" labels and frequency KPIs

## Gherkin

```gherkin
Feature: Overview customer commercial summary
  Gestor and vendedor see a trusted commercial summary on first paint.

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
    Given a fixture customer with known faturamento, pedidos, volume and margem inputs
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

  @unit @high
  Scenario: Detail UI labels Jan/2024 totals explicitly
    Given a detail payload with commercial summary values
    When the summary card renders
    Then labels for revenue, orders, ticket and volume include "desde Jan/2024"
    And frequency and days-since-last-purchase fields are visible
```
