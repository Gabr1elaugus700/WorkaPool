# Test Suite: Overview customer recent commercial motion

## User Story Source
- [#99](https://github.com/Gabr1elaugus700/WorkaPool/issues/99)
- Parent PRD context: [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92) (stories 17-20)

## Seams Under Test
- Sync materialization for recent commercial motion (`invoiced` vs `lost`) including ERP `sitped = 5` mapping for lost orders.
- Overview read-model contract for separated dates: `lastInvoicedPurchaseAt`, `lastLostOrderAt`, and `lastCommercialMovementAt`.
- Overview detail API seam for first-paint summary dates plus lazy recent-order slices (5 invoiced, 5 lost).
- Detail UI rendering seam for recent lists and movement dates without loading full history.
- Auth seam parity with Overview rules (ADMIN/GERENTE_DPTO allowed, VENDAS scoped by primary `codRep`).

## Coverage Notes
- Existing tests already cover Overview detail auth and summary payload shape, but they do not validate recent invoiced/lost lists.
- Existing summary materialization tests validate Jan/2024 and last-12-month numeric invariants, but do not validate lost-order classification from ERP.
- No dedicated seam coverage exists yet for `sitped = 5` in the Overview context.
- No dedicated UI tests exist for rendering recent invoiced and recent lost sections together with separated movement dates.
- Highest risk gap today is semantic drift between Order Loss meaning (`sitped = 5`) and what Overview may materialize as "lost".

## Risk Rationale
- **Classification correctness is critical:** if lost orders are not strictly `sitped = 5`, the widget loses parity with Order Loss and becomes untrustworthy.
- **Date separation has decision impact:** merging or confusing last invoiced vs last lost dates can hide churn risk and distort account health.
- **Top-5 slicing is fragile:** sorting/tie-break regressions can silently show the wrong "recent" orders and mislead follow-up actions.
- **Lazy-loading boundaries matter:** pulling full order history instead of bounded recent rows can hurt first paint and increase backend load.
- **Auth leakage risk remains high:** exposing recent lost/invoiced motion to wrong VENDAS portfolios is a sensitive commercial-data leak.

## Execution Order
1. Validate sync classification and date-derivation invariants (`sitped = 5`, separate last dates, movement=max).
2. Validate sync Top-5 ordering and truncation for invoiced and lost recent rows.
3. Validate detail API contract for first-paint fields and lazy recent slices with bounded payloads.
4. Validate authorization behavior for recent slices with the same portfolio scope as existing Overview endpoints.
5. Validate UI rendering of separated dates and two recent lists under loading/empty/error states.

## Gherkin
Feature: Overview customer recent commercial motion
  Users inspect recent invoiced and lost motion with clear date semantics and bounded payloads.

  @integration @critical
  Scenario: Sync classifies lost orders using ERP sitped equals 5
    Given Senior rows include mixed order statuses for a customer
    When the recent commercial motion snapshot is materialized
    Then only rows with sitped equal to 5 are classified as lost
    And non-lost statuses are excluded from the lost list

  @integration @critical
  Scenario: Sync keeps last invoiced, last lost, and last movement as separate fields
    Given a customer with both invoiced and lost orders on different dates
    When the snapshot is materialized
    Then last invoiced purchase date is stored from invoiced orders only
    And last lost order date is stored from lost orders only
    And last commercial movement date equals the max between both dates

  @integration @high
  Scenario: Sync stores only the 5 most recent invoiced and 5 most recent lost orders
    Given a customer has more than 5 invoiced and more than 5 lost orders
    When the snapshot is materialized
    Then exactly 5 invoiced orders are persisted sorted by most recent first
    And exactly 5 lost orders are persisted sorted by most recent first

  @integration @high
  Scenario: Sync handles customers with only invoiced or only lost history
    Given one customer has only invoiced orders and another has only lost orders
    When the snapshot is materialized
    Then missing side dates are null
    And last commercial movement still reflects the available side
    And recent lists are empty only for the unavailable side

  @security @critical
  Scenario: Unauthorized VENDAS cannot read recent motion for another portfolio customer
    Given a synced customer whose primary codRep is 10
    And I am authenticated as VENDAS with codRep 20
    When I request overview detail or recent motion slices for that customer
    Then the response status is 403

  @integration @critical
  Scenario: Authorized user receives first-paint date fields and lazy recent slices
    Given a synced customer with recent invoiced and lost orders
    And I am authenticated as ADMIN
    When I request the customer overview detail
    Then the payload includes separate last invoiced, last lost, and last movement fields
    And it does not require full order history payload on first paint
    When I request the recent invoiced and recent lost slices
    Then each slice returns at most 5 rows with expected order metadata

  @unit @high
  Scenario: UI renders both recent lists and date fields clearly
    Given the API returns separated movement dates and two recent lists
    When the detail view renders
    Then the UI shows distinct labels for last invoiced, last lost, and last movement
    And the UI shows two sections for recent invoiced and recent lost orders

  @unit @medium
  Scenario: UI handles loading, empty, and error states per recent slice
    Given one recent slice is loading and the other is empty or errored
    When the detail view renders
    Then first-paint identity and summary remain visible
    And each recent section shows a non-blocking state message
