# Overview Customer — Contagens no hero — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/overview-customer-hero-order-counts/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `.agents/skills/tdd/SKILL.md`, `backend/package.json` (`npm test`), `frontend/package.json` (`npm test`, `npm run lint`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Materializer (domain) | unit | All window branches; 1:1 to HEROOC-01..06 + listed edge cases | `backend/test/unit/features/overviewCustomer/sync/*.test.ts` | `cd backend && npx tsx --test test/unit/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion.test.ts` |
| OrderCounts mapper / detail use-case | unit | Missing→0; totals; 12m unchanged | `backend/test/unit/features/overviewCustomer/**/*.test.ts` | `cd backend && npx tsx --test test/unit/features/overviewCustomer/utils/buildOverviewCustomerOrderCounts.test.ts` |
| Hero UI + KPI regression | unit | 3×2 matrix, zeros, absent payload; Pedidos tile gone | `frontend/src/features/overviewCustomer/**/*.test.ts` | `cd frontend && npx tsx --test src/features/overviewCustomer/components/detail/OverviewCustomerHeroOrderCounts.test.ts src/features/overviewCustomer/components/detail/OverviewCustomerDetailHero.test.ts src/features/overviewCustomer/components/detail/OverviewCustomerKpiGrid.test.ts src/features/overviewCustomer/utils/overviewCustomerOrderCounts.utils.test.ts` |
| Model / types only | none | - (covered by materializer/mapper/UI tests) | - | - |

## Gate Check Commands

> Generated from codebase - confirm before Execute. No production build.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After materializer or mapper unit tasks | `cd backend && npx tsx --test test/unit/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion.test.ts` |
| Full | After API or UI wiring | Backend mapper + materializer tests, then frontend hero/KPI/utils tests (commands in matrix) |
| Build | After UI phase | `cd frontend && npm run lint` (no `npm run build`) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Materializar totalizadoras

```
T1 → T2 → T3
```

### Phase 2: Contrato do detail

```
T4 → T5
```

### Phase 3: Hero + anti-duplicação KPI

```
T6 → T7
```

---

## Task Breakdown

### T1: Add base count fields to motion model

**What**: Extend `OverviewCustomerRecentCommercialMotion` with the four non-negative integer base count fields.
**Where**: `backend/src/features/overviewCustomer/models/OverviewCustomerIdentity.ts`
**Depends on**: None
**Reuses**: Existing `invoicedCountLast12Months` / `lostCountLast12Months` field style
**Requirement**: HEROOC-04

**Tools**:

- MCP: NONE
- Skill: writing-typescript

**Done when**:

- [x] Type includes `invoicedCountSinceJan2024`, `lostCountSinceJan2024`, `invoicedCountLast60Days`, `lostCountLast60Days`
- [x] 12-month count fields remain on the type unchanged

**Tests**: none
**Gate**: quick

---

### T2: Materialize since-Jan/2024 and last-60-day counts

**What**: Compute and persist the four base counts in the recent-commercial-motion materializer using existing invoiced/lost rules.
**Where**: `backend/src/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion.ts`
**Depends on**: T1
**Reuses**: Existing 12m counting loops and cutoffs
**Requirement**: HEROOC-01, HEROOC-02, HEROOC-03, HEROOC-04, HEROOC-05, HEROOC-06

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Four base counts materialized per customer
- [ ] 12m counts unchanged
- [ ] Unit tests cover since-Jan, day-60 inclusive, day-61 exclusive, pre-2024 exclusion, invoiced-only and lost-only
- [ ] Gate check passes: quick materializer command
- [ ] Test count: existing materializer tests remain; new assertions added (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T3: Extract motion snapshot defaults for new counts

**What**: Parse and default missing new base count fields to `0` in the motion snapshot extract.
**Where**: `backend/src/features/overviewCustomer/sync/extractOverviewCustomerRecentCommercialMotionSnapshot.ts`
**Depends on**: T2
**Reuses**: Existing non-negative integer guards for 12m counts
**Requirement**: HEROOC-10

**Tools**:

- MCP: NONE
- Skill: writing-typescript

**Done when**:

- [ ] Extract accepts and returns the four base fields
- [ ] Missing fields default to `0` (compatible with old snapshots)
- [ ] 12m extract behavior unchanged

**Tests**: none
**Gate**: quick

---

### T4: Enrich identity snapshot with new base counts

**What**: Merge the four base counts from motion onto identity during identity extract (same pattern as 12m counts).
**Where**: `backend/src/features/overviewCustomer/sync/extractOverviewCustomerIdentitySnapshot.ts`
**Depends on**: T3
**Reuses**: Existing motion→identity merge for `invoicedCountLast12Months` / `lostCountLast12Months`
**Requirement**: HEROOC-11

**Tools**:

- MCP: NONE
- Skill: writing-typescript

**Done when**:

- [ ] Identity customer carries the four base counts when motion provides them
- [ ] Optional/missing motion counts remain safe (no throw)

**Tests**: none
**Gate**: quick

---

### T5: Expose `orderCounts` on detail use-case

**What**: Add pure mapper `buildOverviewCustomerOrderCounts` and return `orderCounts` (with derived totals) from `GetOverviewCustomerDetailUseCase`.
**Where**: `backend/src/features/overviewCustomer/utils/buildOverviewCustomerOrderCounts.ts`
**Depends on**: T4
**Reuses**: Detail use-case identity enrichment pattern
**Requirement**: HEROOC-07, HEROOC-08, HEROOC-09, HEROOC-10, HEROOC-11, HEROOC-12

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Mapper returns six non-negative ints; totals = invoiced + lost per window
- [ ] Missing bases → `0`
- [ ] Detail result includes `orderCounts`; `commercialSummary.orderCountSinceJan2024` and 12m fields unchanged
- [ ] Unit tests for mapper cover totals and zero-defaults
- [ ] Gate check passes: mapper unit test command
- [ ] Test count: mapper suite green (no silent deletions)

**Tests**: unit
**Gate**: full

---

### T6: Hero order-counts block component

**What**: Create `OverviewCustomerHeroOrderCounts` (3×2 matrix) and place it between identity and health score in `OverviewCustomerDetailHero`.
**Where**: `frontend/src/features/overviewCustomer/components/detail/OverviewCustomerHeroOrderCounts.tsx`
**Depends on**: T5
**Reuses**: Hero typography tokens; `formatOverviewNumber`
**Requirement**: HEROOC-13, HEROOC-14, HEROOC-15, HEROOC-16, HEROOC-19

**Tools**:

- MCP: NONE
- Skill: writing-typescript

**Done when**:

- [ ] Component shows Totais / Faturados / Perdidos × Desde Jan/2024 / Últimos 60 dias
- [ ] Zeros render as `0`; absent payload resolves to zeros via util
- [ ] Hero places counts between identity and health score on md+ and stacked below md
- [ ] Unit tests for component + hero layout order pass
- [ ] Gate check passes: frontend hero/utils tests
- [ ] Test count: new hero tests green (no silent deletions)

**Tests**: unit
**Gate**: full

---

### T7: Wire detail view and remove Pedidos KPI tile

**What**: Pass `orderCounts` from detail into the hero; remove the KPI tile “Pedidos (desde Jan/2024)” from `OverviewCustomerKpiGrid`.
**Where**: `frontend/src/features/overviewCustomer/components/detail/OverviewCustomerKpiGrid.tsx`
**Depends on**: T6
**Reuses**: Existing detail query payload path
**Requirement**: HEROOC-17, HEROOC-18

**Tools**:

- MCP: NONE
- Skill: writing-typescript

**Done when**:

- [ ] `OverviewCustomerDetailView` passes `detail.orderCounts` into the hero
- [ ] KPI grid no longer renders “Pedidos (desde Jan/2024)”
- [ ] Movimentação 12m counts unchanged
- [ ] KPI grid unit test updated (assert tile absent)
- [ ] Gate check passes: frontend KPI + hero tests; `cd frontend && npm run lint`
- [ ] Test count: affected frontend suites green (no silent deletions)

**Tests**: unit
**Gate**: build

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Motion model fields | 1 type file | OK |
| T2: Materializer counts | 1 materializer + co-located tests | OK |
| T3: Motion extract defaults | 1 extract file | OK |
| T4: Identity enrich | 1 extract file | OK |
| T5: Mapper + detail orderCounts | 1 mapper file (primary); use-case wired in same task | OK |
| T6: Hero counts component | 1 component file (primary); hero layout in same task | OK |
| T7: Remove Pedidos KPI + wire view | 1 KPI file (primary); DetailView wire in same task | OK |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (start) | Match |
| T2 | T1 | T1 -> T2 | Match |
| T3 | T2 | T2 -> T3 | Match |
| T4 | T3 | T3 -> T4 (phase boundary) | Match |
| T5 | T4 | T4 -> T5 | Match |
| T6 | T5 | T5 -> T6 (phase boundary) | Match |
| T7 | T6 | T6 -> T7 | Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Model / types only | none | none | OK |
| T2 | Materializer (domain) | unit | unit | OK |
| T3 | Extract (wiring) | none | none | OK |
| T4 | Extract (wiring) | none | none | OK |
| T5 | OrderCounts mapper / detail use-case | unit | unit | OK |
| T6 | Hero UI | unit | unit | OK |
| T7 | Hero UI + KPI regression | unit | unit | OK |

---

## GitHub Issues

| Task | Issue |
| ---- | ----- |
| T1 | https://github.com/Gabr1elaugus700/WorkaPool/issues/149 |
| T2 | https://github.com/Gabr1elaugus700/WorkaPool/issues/145 |
| T3 | https://github.com/Gabr1elaugus700/WorkaPool/issues/146 |
| T4 | https://github.com/Gabr1elaugus700/WorkaPool/issues/147 |
| T5 | https://github.com/Gabr1elaugus700/WorkaPool/issues/148 |
| T6 | https://github.com/Gabr1elaugus700/WorkaPool/issues/150 |
| T7 | https://github.com/Gabr1elaugus700/WorkaPool/issues/151 |
