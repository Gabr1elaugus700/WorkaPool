# Test Suite #115 - Overview customer identity + route auth

Source issue: [#115](https://github.com/Gabr1elaugus700/WorkaPool/issues/115)  
Story: [#94](https://github.com/Gabr1elaugus700/WorkaPool/issues/94)

## Confirmed seams

1. `GET /api/overview/customers/:clienteId` (authn/authz + payload)
2. Overview identity sync step (seed/fixture -> read model identity snapshot)
3. Access-denied UI state (403 -> back-to-list affordance)

## Gherkin

```gherkin
Feature: Overview customer identity and route auth
  Authorized users open a synced customer identity detail; portfolio rules enforce VENDAS access.

  @security @critical
  Scenario: Unauthenticated request is rejected
    Given no authentication token
    When I GET the Overview customer detail for a known clienteId
    Then the response status is 401

  @security @critical
  Scenario: VENDAS cannot open a customer when not primary salesperson
    Given a synced customer whose primary codRep is 10
    And I am authenticated as VENDAS with codRep 20
    When I GET the Overview customer detail for that clienteId
    Then the response status is 403
    And the response does not include commercial identity fields beyond an error body

  @integration @critical
  Scenario: VENDAS can open a customer when primary salesperson
    Given a synced customer whose primary codRep is 10 with minimal identity fields
    And I am authenticated as VENDAS with codRep 10
    When I GET the Overview customer detail for that clienteId
    Then the response status is 200
    And the body includes identity fields and sync freshness metadata

  @security @critical
  Scenario: ADMIN can open any synced customer
    Given a synced customer whose primary codRep is 10
    And I am authenticated as ADMIN
    When I GET the Overview customer detail for that clienteId
    Then the response status is 200

  @security @high
  Scenario: GERENTE_DPTO can open any synced customer
    Given a synced customer whose primary codRep is 10
    And I am authenticated as GERENTE_DPTO
    When I GET the Overview customer detail for that clienteId
    Then the response status is 200

  @integration @critical
  Scenario: Identity sync materializes required fields including branch indicator
    Given Senior extract fixtures for a customer with activity in MGA and CTB
    When the Overview identity sync step runs successfully
    Then the read model stores code, fantasia, document, city/UF, segment, registration date, primary codRep
    And the branch indicator shows both MGA and CTB without ranking one as primary

  @integration @critical
  Scenario: First and last purchase follow invoiced NF rules
    Given Senior fixtures that include non-invoicing NFs and invoiced NFs for the same customer
    When the Overview identity sync step runs successfully
    Then first and last purchase dates are derived only from invoiced NF rules from the PRD
    And non-qualifying NFs do not define those dates

  @integration @high
  Scenario: Detail response exposes last successful sync freshness
    Given a synced customer identity and a recorded lastSuccessfulSyncAt
    And I am authenticated as an allowed role for that customer
    When I GET the Overview customer detail
    Then the body includes the sync freshness metadata

  @unit @high
  Scenario: Access-denied UI offers a path back to the customer list
    Given the Overview detail view receives a 403 from the identity API
    When the access-denied state is shown
    Then the user sees an access-denied message
    And a navigation affordance toward the Overview customer list is available

  @integration @medium
  Scenario: Unknown or not-synced customer returns 404 for all roles
    Given no Overview identity exists for clienteId 999999
    And I am authenticated as ADMIN
    When I GET the Overview customer detail for 999999
    Then the response status is 404

  @integration @medium
  Scenario: Unknown customer also returns 404 for VENDAS
    Given no Overview identity exists for clienteId 999999
    And I am authenticated as VENDAS with any codRep
    When I GET the Overview customer detail for 999999
    Then the response status is 404
```
