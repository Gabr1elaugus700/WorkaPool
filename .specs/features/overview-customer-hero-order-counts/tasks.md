# Overview Customer — Contagens no hero — Tasks

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `.agents/skills/tdd/SKILL.md`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Materializer (domain) | unit | All window branches; 1:1 to HEROOC-05 + edge cases | `backend/test/unit/features/overviewCustomer/sync/*.test.ts` | `cd backend && npx vitest run test/unit/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion.test.ts` |
| Extract + detail use-case | unit | Missing→0; totals; 12m unchanged | `backend/test/unit/features/overviewCustomer/**/*.test.ts` | `cd backend && npx vitest run test/unit/features/overviewCustomer` |
| Hero UI | unit | 3×2 matrix, zeros, absent payload | `frontend/src/features/overviewCustomer/**/*.test.ts` | `cd frontend && npx vitest run src/features/overviewCustomer` |
| Config / types | none | - (tsc via lint) | - | `cd frontend && npm run lint` |

---

## Gate Check Commands

| Gate | Command |
| ---- | ------- |
| quick | `cd backend && npx vitest run test/unit/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion.test.ts` |
| full | `cd backend && npx vitest run test/unit/features/overviewCustomer` then `cd frontend && npx vitest run src/features/overviewCustomer` |
| build | `cd frontend && npm run lint` (no production build) |

---

## Execution Plan

### Phase 1: End-to-end

```
T1 → T2 → T3 → T4 → T5 → T6
```

---

## Task Breakdown

### T1: Spec artifacts validated

**What**: Confirm `spec.md` + `context.md` pass `validate_spec.py`.
**Where**: `.specs/features/overview-customer-hero-order-counts/`
**Depends on**: None
**Reuses**: —
**Requirement**: meta

**Done when**:

- [x] `validate_spec.py overview-customer-hero-order-counts` exits 0

**Tests**: none
**Gate**: quick

---

### T2: Materializer base counts

**What**: Add since-Jan/2024 and last-60-days invoiced/lost counts to recent-commercial-motion materializer.
**Where**: `backend/src/features/overviewCustomer/sync/materializeOverviewCustomerRecentCommercialMotion.ts`, model type, unit test
**Depends on**: T1
**Reuses**: existing 12m counting loop
**Requirement**: HEROOC-05

**Done when**:

- [x] Four base count fields materialized
- [x] 12m counts unchanged
- [x] Unit tests cover 59/60/61 days and since-Jan windows

**Tests**: unit
**Gate**: quick

---

### T3: Extract, identity enrich, detail `orderCounts`

**What**: Default missing fields to 0; merge onto identity; return `orderCounts` with derived totals from detail use-case.
**Where**: extract motion/identity, `GetOverviewCustomerDetailUseCase.ts`, unit tests
**Depends on**: T2
**Reuses**: identity enrich pattern for 12m counts
**Requirement**: HEROOC-01, HEROOC-02, HEROOC-03, HEROOC-04, HEROOC-06

**Done when**:

- [x] Detail response includes `orderCounts` with six non-negative ints and correct totals
- [x] Missing snapshot fields → 0
- [x] commercialSummary / 12m fields unchanged

**Tests**: unit
**Gate**: full

---

### T4: Hero order-counts component + layout

**What**: `OverviewCustomerHeroOrderCounts` 3×2 matrix; hero 3-zone layout; types.
**Where**: `frontend/src/features/overviewCustomer/components/detail/`, types
**Depends on**: T3
**Reuses**: health-score typography tokens
**Requirement**: HEROOC-07, HEROOC-08, HEROOC-09, HEROOC-10, HEROOC-12

**Done when**:

- [ ] Component renders Totais/Faturados/Perdidos × Jan/2024 + 60d
- [ ] Absent counts render as 0
- [ ] Hero places block between identity and health score

**Tests**: unit
**Gate**: full

---

### T5: Wire DetailView

**What**: Pass `orderCounts` from detail query into hero; leave KPI/motion untouched.
**Where**: `OverviewCustomerDetailView.tsx`, hero props
**Depends on**: T4
**Reuses**: existing detail query
**Requirement**: HEROOC-11

**Done when**:

- [ ] Hero receives `orderCounts` from detail payload
- [ ] KPI grid and motion summary props unchanged

**Tests**: unit / regression
**Gate**: build

---

### T6: Verifier

**What**: Fresh verifier writes `validation.md`; completion gate passes.
**Where**: `.specs/features/overview-customer-hero-order-counts/validation.md`
**Depends on**: T5
**Reuses**: TLC verify flow
**Requirement**: all

**Done when**:

- [ ] `validation.md` verdict PASS with file:line evidence
- [ ] `validate_state.py` exits 0

**Tests**: discrimination sensor
**Gate**: build
