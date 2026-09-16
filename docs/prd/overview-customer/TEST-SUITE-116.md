# Test Suite #116 - Overview customer portfolio list + search

Source issue: [#116](https://github.com/Gabr1elaugus700/WorkaPool/issues/116)  
Story: [#95](https://github.com/Gabr1elaugus700/WorkaPool/issues/95)

## Confirmed seams

1. `GET /api/overview/customers` (authn/authz + search + pagination + sort + row payload)
2. List query helper (search OR + default sort fallback)
3. Portfolio list UI (rows/empty state + navigate to detail)

## Gherkin

```gherkin
Feature: Overview customer portfolio list and search
  Users browse and search the Overview portfolio, scoped by role, then open a customer detail.

  @security @high
  Scenario: Unauthenticated list request is rejected
    Given no authentication token
    When I GET the Overview customer list
    Then the response status is 401

  @security @critical
  Scenario: VENDAS list only includes primary-codRep customers
    Given synced customers for primary codRep 10 and primary codRep 20
    And I am authenticated as VENDAS with codRep 10
    When I GET the Overview customer list
    Then the response status is 200
    And every returned row has primary codRep 10
    And no row for primary codRep 20 is present

  @security @critical
  Scenario: VENDAS search cannot surface another primary's customer
    Given a synced customer code 123 with primary codRep 20
    And I am authenticated as VENDAS with codRep 10
    When I GET the Overview customer list searching by exact code 123
    Then the response does not include customer 123

  @security @critical
  Scenario: ADMIN list includes all synced customers
    Given synced customers for multiple primary codRep values
    And I am authenticated as ADMIN
    When I GET the Overview customer list
    Then the response includes customers across those primaries

  @security @high
  Scenario: GERENTE_DPTO list includes all synced customers
    Given synced customers for multiple primary codRep values
    And I am authenticated as GERENTE_DPTO
    When I GET the Overview customer list
    Then the response includes customers across those primaries

  @integration @critical
  Scenario: Search by exact customer code
    Given a synced customer with code 123
    And I am authenticated as an allowed role for that customer
    When I GET the Overview customer list with search equal to 123
    Then the response includes customer 123

  @integration @critical
  Scenario: Search by name or fantasia contains
    Given a synced customer whose fantasia contains "ACME"
    And I am authenticated as an allowed role for that customer
    When I GET the Overview customer list with search "ACME"
    Then the response includes that customer

  @integration @critical
  Scenario: Search by document CNPJ or CPF
    Given a synced customer with document "12345678000199"
    And I am authenticated as an allowed role for that customer
    When I GET the Overview customer list with search matching that document
    Then the response includes that customer

  @integration @critical
  Scenario: Pagination uses page size 20
    Given more than 20 synced customers visible to the caller
    And I am authenticated as ADMIN
    When I GET the Overview customer list page 1
    Then the response contains at most 20 rows
    And pagination metadata allows requesting page 2

  @integration @high
  Scenario: Page 2 returns the next window
    Given more than 20 synced customers visible to the caller
    And I am authenticated as ADMIN
    When I GET the Overview customer list page 2
    Then the rows differ from page 1
    And the response contains at most 20 rows

  @integration @critical
  Scenario: Default sort is order-count last 12 months descending when present
    Given synced customers with different orderCountLast12Months values
    And I am authenticated as ADMIN
    When I GET the Overview customer list with default sort
    Then rows are ordered by orderCountLast12Months descending

  @integration @high
  Scenario: Sort falls back to lastPurchase descending when order-count is absent
    Given synced customers without orderCountLast12Months but with lastPurchase dates
    And I am authenticated as ADMIN
    When I GET the Overview customer list with default sort
    Then rows are ordered by lastPurchase descending

  @integration @high
  Scenario: List row includes required identity columns
    Given a synced customer with city/UF, branch indicator, and lastPurchase
    And I am authenticated as an allowed role for that customer
    When I GET the Overview customer list
    Then each matching row includes code, name, city/UF, branch indicator, and lastPurchase
    And commercial columns appear when present on the read model

  @unit @high
  Scenario: List UI is the entry point to customer detail
    Given the Overview portfolio list shows a customer row
    When the user activates that row
    Then navigation targets the Overview detail route for that clienteId

  @unit @medium
  Scenario: List UI empty state when portfolio has no rows
    Given the Overview list API returns an empty page
    When the portfolio list view renders
    Then an empty state is shown
```
