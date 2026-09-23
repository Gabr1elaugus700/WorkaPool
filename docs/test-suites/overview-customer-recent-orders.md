# Test Suite: Overview customer recent orders (invoiced / lost)

## User Story Source
- [#99](https://github.com/Gabr1elaugus700/WorkaPool/issues/99)
- Parent context: [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92)

## Seams Under Test
- Sync step `ultimo-pedido-cliente` materialization (Senior extract → served snapshot payload with typed recent orders + date fields)
- First-paint detail payload: distinct `lastInvoicedAt`, `lastLostAt`, `lastMovementAt` (and optional 12-month counts) without loading full order history
- Authenticated endpoint `GET /api/overview/customers/:clienteId/recent-orders` (lazy lists)
- Frontend: first-paint date/summary card + lazy recent-orders section in `OverviewCustomerDetailView`

## Coverage Notes
- Sibling slices already cover identity/auth (#94/#115), portfolio list (#95/#116), commercial summary (#96), monthly (#97), purchased products (#98).
- Step `ultimo-pedido-cliente` is wired via `materializeOverviewCustomerRecentCommercialMotion`; lazy route is `GET /api/overview/customers/:clienteId/recent-orders` (alias `recent-commercial-motion`).
- Invoiced rows now include order totals (`revenue`, `volume`, `marginPercent`) and nested `items[]` (product, qty, volume, revenue, margin). After deploying this schema change, **re-run sync step `ultimo-pedido-cliente`** so served snapshots carry the enriched shape; extract rejects legacy header-only rows.
- Highest-risk gaps vs product intent: lost classification (`sitped = 5`), separation of the three date fields, top-5 lists without full history, and lazy UI that must not block first paint.

## Risk Rationale
- **Lost vs invoiced classification is critical:** wrong `sitped` filter mixes Order Loss semantics and misleads commercial motion.
- **Date separation is easy to regress:** collapsing last invoiced / last lost / last movement into one field hides risk vs win timing.
- **Top-5 without full history is a UX and cost contract:** materializing or fetching full order history breaks the Overview job-to-be-done.
- **Auth consistency protects portfolio scope:** recent-orders must enforce the same VENDAS primary-`codRep` rules as other Overview endpoints.
- **Lazy loading is a UX contract:** recent-orders request cannot block first paint of identity + commercial summary (+ first-paint dates).
- **Lost list is API-only for summary metrics:** UI no longer renders recent lost orders; summary still shows last lost date and 12-month lost count.

## Execution Order
1. Validate sync invariants (invoiced vs `sitped = 5` lost, top 5 ordering, 12-month counts, three distinct dates, null handling).
2. Validate first-paint detail exposes date fields (and optional counts) without requiring the lazy lists payload.
3. Validate lazy endpoint auth matrix (`401`, `403`, `200`, `404` missing slice) and payload contract.
4. Validate frontend: first paint renders dates/summary without waiting for recent-orders; section handles loading/empty/error/success.
5. Re-run focused regression when Senior SQL or snapshot schema for this step changes.

## Gherkin
Feature: Overview customer recent invoiced and lost orders
  Authorized users see recent commercial motion (wins vs losses) and distinct movement dates without loading full order history.

  @integration @critical
  Scenario: Sync materializes recent invoiced and lost order rows
    Given Senior fixtures with multiple invoiced and lost orders for a customer since the product cutoff
    When the "ultimo-pedido-cliente" sync step is materialized
    Then the snapshot includes typed recent invoiced rows with totals and items and typed recent lost rows
    And lost rows only include ERP sitped = 5
    And each list is capped at the 5 most recent by issue date (tie-break order number)

  @integration @critical
  Scenario: Sync computes 12-month invoiced vs lost counts
    Given fixtures with invoiced and lost orders inside and outside the last 12 months
    When the recent-orders snapshot is materialized
    Then invoicedCountLast12Months and lostCountLast12Months only count rows in the last 12 months

  @integration @critical
  Scenario: Sync keeps last invoiced, last lost, and last movement distinct
    Given a customer whose last invoiced date differs from last lost date
    When the recent-orders snapshot is materialized
    Then lastInvoicedAt equals the latest invoiced order date
    And lastLostAt equals the latest lost order date (sitped = 5)
    And lastMovementAt equals the max of those two dates

  @integration @high
  Scenario: Missing motion types yield null dates without inventing rows
    Given a customer with invoiced orders but no lost orders
    When the recent-orders snapshot is materialized
    Then lastLostAt is null
    And recentLost is empty
    And lastMovementAt equals lastInvoicedAt

  @integration @critical
  Scenario: Sync does not materialize full order history
    Given a customer with more than five invoiced and five lost orders
    When the recent-orders snapshot is materialized
    Then only up to five invoiced and five lost rows are stored for that customer
    And older orders are omitted from the served snapshot lists

  @integration @critical
  Scenario: Detail first paint includes distinct movement dates without lazy lists
    Given a served snapshot with recent-motion date fields for a customer
    And I am authenticated as an allowed Overview role
    When I GET the customer Overview detail first paint
    Then the response includes lastInvoicedAt, lastLostAt, and lastMovementAt as distinct fields
    And the response does not require the full recent order lists to render first paint

  @security @critical
  Scenario: Unauthenticated recent-orders request is rejected
    Given no authentication token
    When I GET recent orders for a known clienteId
    Then the response status is 401

  @security @critical
  Scenario: VENDAS cannot access recent orders for another primary salesperson
    Given a synced customer whose primary codRep is 10
    And I am authenticated as VENDAS with codRep 20
    When I GET recent orders for that clienteId
    Then the response status is 403

  @integration @critical
  Scenario: Allowed role gets recent orders through dedicated lazy endpoint
    Given a synced customer with recent invoiced and lost rows
    And I am authenticated as ADMIN
    When I GET recent orders for that clienteId
    Then the response status is 200
    And the response includes recentInvoiced (with totals and items) and recentLost lists (and 12-month counts when present)
    And the customer identity first-paint payload is not required in this endpoint

  @integration @medium
  Scenario: Unknown or not-synced customer returns 404 on recent-orders endpoint
    Given no recent-orders data exists for clienteId 999999
    And I am authenticated as ADMIN
    When I GET recent orders for clienteId 999999
    Then the response status is 404

  @unit @critical
  Scenario: Detail first paint renders without waiting for recent-orders
    Given identity, commercial summary, and movement dates are available for first paint
    And recent-orders lists are configured as lazy
    When the customer detail view loads
    Then identity, summary, and movement dates render before the recent-orders request resolves

  @unit @high
  Scenario: Recent-orders section renders expandable invoiced orders for an authorized user
    Given the recent-orders endpoint returns up to five invoiced orders with totals and items
    When the recent-orders request succeeds
    Then the UI renders expandable invoiced orders (valor, volume, margem, itens)
    And the UI does not render the recent lost-orders list
    And the summary still shows last lost date and 12-month lost count when present

  @unit @medium
  Scenario: Recent-orders section shows empty and error states safely
    Given the recent-orders endpoint returns no rows or fails
    When the recent-orders section renders
    Then the UI shows an empty state for no data
    And shows a non-blocking error state when request fails
