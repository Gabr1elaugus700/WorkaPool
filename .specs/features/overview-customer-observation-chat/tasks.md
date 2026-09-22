# Overview Customer — Histórico de observações — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/overview-customer-observation-chat/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `.github/QUALITY_GATE.md`, `backend/package.json` (`npm test`), `frontend/package.json` (`npm test`, `npm run lint`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Use cases (list/create/update + access) | unit | 1:1 com ACs OBSCHAT-02..05; edge cases do spec | `backend/test/unit/features/overviewCustomer/**/*.test.ts` | `cd backend && npm test` |
| Repository | unit | queries de página, cursor, create, update-by-author | `backend/test/unit/features/overviewCustomer/repositories/*.test.ts` | `cd backend && npm test` |
| HTTP routes/controller | unit (supertest) | GET/POST/PATCH happy + 400/403/404 por AC | `backend/test/unit/features/overviewCustomer/http/*.test.ts` | `cd backend && npm test` |
| Prisma schema/migration | none | build gate only | — | migration apply local |
| Frontend components/hook/service | unit (renderToStaticMarkup) | ACs OBSCHAT-01/04/05 UI; bolhas esquerda/direita | `frontend/src/features/overviewCustomer/**/*.test.ts` | `cd frontend && npm test` |
| OpenAPI contracts | none | validação manual + route tests | `backend/src/features/overviewCustomer/http/overviewCustomer.contracts.ts` | lint/tsc gate |

## Gate Check Commands

> Generated from codebase - confirm before Execute. No production build.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após task backend unit | `cd backend && npm test -- --test-name-pattern="Observation"` |
| Quick | Após task frontend unit | `cd frontend && npm test -- OverviewCustomerObservation` |
| Full | Fim de cada fase | `cd backend && npm test` + `cd frontend && npm test` + `cd frontend && npm run lint` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend foundation (MVP API)

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 2: Frontend MVP (OBSCHAT-01..04)

```
T7 → T8 → T9 → T10 → T11 → T12 → T13
```

### Phase 3: P2 (edit + pagination)

```
T13 → T14 → T15 → T16
```

### Phase 4: Verificação

```
T16 → T17
```

---

## Task Breakdown

### T1: Prisma model OverviewCustomerObservation + migration

**What**: Add `OverviewCustomerObservation` model and Prisma migration.
**Where**: `backend/prisma/schema.prisma`
**Depends on**: None
**Reuses**: Existing `User` model for author FK
**Requirement**: OBSCHAT-02, OBSCHAT-03

**Tools**:

- MCP: NONE
- Skill: writing-typescript

**Done when**:

- [x] Model includes `customerCode`, `authorUserId`, `body`, `createdAt`, `updatedAt`, `editedAt`
- [x] Index on `(customerCode, createdAt, id)`
- [x] Migration file created and applies locally

**Tests**: none
**Gate**: build

---

### T2: OverviewCustomerObservationRepository

**What**: Repository with paginated list, create, and update-by-author.
**Where**: `backend/src/features/overviewCustomer/repositories/OverviewCustomerObservationRepository.ts`
**Depends on**: T1
**Reuses**: Prisma client patterns from existing overview repositories
**Requirement**: OBSCHAT-02, OBSCHAT-06

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] `findRecentPage(customerCode, limit=50, before?)` returns newest page ascending
- [ ] `create(...)` persists observation with `editedAt: null`
- [ ] `updateByAuthor(...)` updates body and sets `editedAt`
- [ ] Unit tests: 0 msgs, 51 msgs (only 50), cursor `before`, tie-break by `id`
- [ ] Gate passes: quick backend observation tests

**Tests**: unit
**Gate**: quick

---

### T3: assertOverviewCustomerAccess helper

**What**: Extract shared access gate (role, snapshot, `primaryCodRep`) and refactor detail use case to use it.
**Where**: `backend/src/features/overviewCustomer/utils/assertOverviewCustomerAccess.ts`
**Depends on**: T2
**Reuses**: Logic from `GetOverviewCustomerDetailUseCase.ts`
**Requirement**: OBSCHAT-02, OBSCHAT-03

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Helper throws `OVERVIEW_CUSTOMER_FORBIDDEN` / `OVERVIEW_CUSTOMER_NOT_FOUND` as spec
- [ ] `GetOverviewCustomerDetailUseCase` refactored to use helper
- [ ] Unit tests: ADMIN ok, GERENTE ok, VENDAS owner ok, VENDAS other 403, `primaryCodRep` null + VENDAS 403
- [ ] Gate passes: quick backend tests

**Tests**: unit
**Gate**: quick

---

### T4: ListOverviewCustomerObservationsUseCase

**What**: List use case returning paginated thread with author display name.
**Where**: `backend/src/features/overviewCustomer/useCases/ListOverviewCustomerObservationsUseCase.ts`
**Depends on**: T3
**Reuses**: `assertOverviewCustomerAccess`, repository
**Requirement**: OBSCHAT-02, OBSCHAT-06

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Returns at most 50 items, ascending by `createdAt`, with `hasOlder` and `nextBefore`
- [ ] Author display name = `User.name || User.user`
- [ ] Unit tests cover ACs OBSCHAT-02 (1..6) and same-`createdAt` tie-break
- [ ] Gate passes: quick backend observation tests

**Tests**: unit
**Gate**: quick

---

### T5: CreateOverviewCustomerObservationUseCase

**What**: Create use case validating trimmed body 1–2000 chars.
**Where**: `backend/src/features/overviewCustomer/useCases/CreateOverviewCustomerObservationUseCase.ts`
**Depends on**: T4
**Reuses**: `assertOverviewCustomerAccess`, repository
**Requirement**: OBSCHAT-03

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Persists with `authorUserId`, `editedAt: null`
- [ ] Returns 400 `OBSERVATION_INVALID_BODY` for empty or >2000 after trim
- [ ] Returns 403 for VENDAS with wrong `codRep`
- [ ] Unit tests cover ACs OBSCHAT-03 (1..6)
- [ ] Gate passes: quick backend observation tests

**Tests**: unit
**Gate**: quick

---

### T6: HTTP layer GET + POST observations

**What**: Wire GET and POST observation routes, controller, and route tests.
**Where**: `backend/src/features/overviewCustomer/http/routes/overviewCustomerDetailRoutes.ts`
**Depends on**: T5
**Reuses**: `overviewCustomerDetailRoutes.test.ts` supertest pattern
**Requirement**: OBSCHAT-02, OBSCHAT-03

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] `GET /api/overview/customers/:clienteId/observations` works with optional `before`
- [ ] `POST /api/overview/customers/:clienteId/observations` returns 201
- [ ] Route tests cover happy path + 400/403/404 per spec
- [ ] Gate passes: full backend test suite for observation routes

**Tests**: unit
**Gate**: full

---

### T7: OpenAPI contracts for observations

**What**: Document observation schemas and paths in OpenAPI contracts.
**Where**: `backend/src/features/overviewCustomer/http/overviewCustomer.contracts.ts`
**Depends on**: T6
**Reuses**: Existing contract file structure
**Requirement**: OBSCHAT-02, OBSCHAT-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] GET/POST observation paths and DTOs documented
- [ ] Error codes listed in contracts

**Tests**: none
**Gate**: build

---

### T8: Frontend types + observation service methods

**What**: Add observation types and service methods `getObservations`, `createObservation`.
**Where**: `frontend/src/features/overviewCustomer/types/overviewCustomerObservation.types.ts`, `services/overviewCustomerService.ts`
**Depends on**: T7
**Reuses**: Existing `overviewCustomerService` axios patterns
**Requirement**: OBSCHAT-02, OBSCHAT-03

**Tools**:

- MCP: NONE
- Skill: writing-typescript

**Done when**:

- [ ] Types match API DTO
- [ ] Service methods call correct endpoints
- [ ] Unit tests for URL/parsing if needed

**Tests**: unit
**Gate**: quick

---

### T9: useOverviewCustomerObservations hook

**What**: Hook managing modal fetch, submit, loading, error, and pagination state.
**Where**: `frontend/src/features/overviewCustomer/hooks/useOverviewCustomerObservations.ts`
**Depends on**: T8
**Reuses**: React Query or existing hook patterns in feature
**Requirement**: OBSCHAT-02, OBSCHAT-03

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Fetches on open; POST success appends and clears composer
- [ ] Keeps typed text on POST error
- [ ] Disables submit while request in flight
- [ ] Unit tests cover fetch, submit, error retention
- [ ] Gate passes: quick frontend observation tests

**Tests**: unit
**Gate**: quick

---

### T10: OverviewCustomerObservationBubble

**What**: Chat bubble component with left/right alignment based on `isOwn`.
**Where**: `frontend/src/features/overviewCustomer/components/detail/observations/OverviewCustomerObservationBubble.tsx`
**Depends on**: T9
**Reuses**: DESIGN.md tokens, `formatIsoDateLabel`
**Requirement**: OBSCHAT-04, OBSCHAT-05

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Own bubble renders right (`ml-auto`); others left (`mr-auto`)
- [ ] Shows author, pt-BR timestamp, body, `editado` when `editedAt`
- [ ] Unit tests assert alignment classes/markup
- [ ] Gate passes: quick frontend observation tests

**Tests**: unit
**Gate**: quick

---

### T11: OverviewCustomerObservationThread + Composer

**What**: Scrollable thread with empty state and textarea composer (Enter/Shift+Enter).
**Where**: `frontend/src/features/overviewCustomer/components/detail/observations/OverviewCustomerObservationThread.tsx`, `OverviewCustomerObservationComposer.tsx`
**Depends on**: T10
**Reuses**: `ScrollArea`, `LossReasonForm` textarea patterns
**Requirement**: OBSCHAT-01, OBSCHAT-04

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Empty state: `Nenhuma observação neste cliente` with composer visible
- [ ] Thread renders ascending list of bubbles
- [ ] Enter submits; Shift+Enter inserts newline
- [ ] Unit tests cover empty state and keyboard behavior markup
- [ ] Gate passes: quick frontend observation tests

**Tests**: unit
**Gate**: quick

---

### T12: OverviewCustomerObservationModal

**What**: Dialog modal integrating thread, composer, and hook; loading/error states.
**Where**: `frontend/src/features/overviewCustomer/components/detail/observations/OverviewCustomerObservationModal.tsx`
**Depends on**: T11
**Reuses**: `components/ui/dialog.tsx`
**Requirement**: OBSCHAT-01, OBSCHAT-02

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Title = customer trade name
- [ ] Error copy: `Não foi possível carregar o histórico`
- [ ] Closes on overlay, close control, Escape
- [ ] Does not render fabricated messages on error
- [ ] Unit tests cover open/close/error states
- [ ] Gate passes: quick frontend observation tests

**Tests**: unit
**Gate**: quick

---

### T13: Hero conversation icon + wiring

**What**: Add conversation icon beside trade name; wire modal in detail view with re-fetch on open.
**Where**: `frontend/src/features/overviewCustomer/components/detail/OverviewCustomerDetailHero.tsx`, `views/OverviewCustomerDetailView.tsx`
**Depends on**: T12
**Reuses**: `MessageSquare` (lucide), auth context for `currentUserId`
**Requirement**: OBSCHAT-01, OBSCHAT-04

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Icon button with `aria-label="Histórico de observações"` beside `tradeName`
- [ ] Click opens modal; detail view remains behind
- [ ] Re-fetch on each modal open (no stale cache)
- [ ] `OverviewCustomerDetailHero.test.ts` updated
- [ ] Gate passes: full frontend tests + lint

**Tests**: unit
**Gate**: full

---

### T14: UpdateOverviewCustomerObservationUseCase + PATCH route

**What**: Author-only PATCH use case and HTTP route.
**Where**: `backend/src/features/overviewCustomer/useCases/UpdateOverviewCustomerObservationUseCase.ts`, observation routes
**Depends on**: T13
**Reuses**: Repository `updateByAuthor`, access helper
**Requirement**: OBSCHAT-05

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] PATCH sets `editedAt`, keeps `createdAt` and `authorUserId`
- [ ] Non-author (including ADMIN) gets 403 `OBSERVATION_EDIT_FORBIDDEN`
- [ ] Wrong customer/id gets 404 `OBSERVATION_NOT_FOUND`
- [ ] Unit + route tests cover ACs OBSCHAT-05
- [ ] Gate passes: full backend tests

**Tests**: unit
**Gate**: full

---

### T15: Frontend edit flow

**What**: Inline edit on own bubbles; PATCH + show `editado`.
**Where**: `frontend/src/features/overviewCustomer/components/detail/observations/OverviewCustomerObservationBubble.tsx`, hook/service
**Depends on**: T14
**Reuses**: PATCH endpoint, bubble component
**Requirement**: OBSCHAT-05

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Only own bubbles show edit affordance
- [ ] PATCH success updates bubble and shows `editado`
- [ ] Unit tests cover edit UI and error handling
- [ ] Gate passes: quick frontend observation tests

**Tests**: unit
**Gate**: quick

---

### T16: Load older observations at top

**What**: Load-previous control prepends older page without scroll jump.
**Where**: `frontend/src/features/overviewCustomer/components/detail/observations/OverviewCustomerObservationThread.tsx`, hook
**Depends on**: T15
**Reuses**: `before` cursor from list API
**Requirement**: OBSCHAT-06

**Tools**:

- MCP: NONE
- Skill: tdd

**Done when**:

- [ ] Control shown only when `hasOlder`
- [ ] Prepend preserves scroll position
- [ ] Unit tests with 60-message fixture (50 + 10)
- [ ] Gate passes: quick frontend observation tests

**Tests**: unit
**Gate**: quick

---

### T17: Verifier + validation.md

**What**: Run spec-anchored outcome check, discrimination sensor, write validation report.
**Where**: `.specs/features/overview-customer-observation-chat/validation.md`
**Depends on**: T16
**Reuses**: tlc-spec-driven Verifier sub-agent flow
**Requirement**: OBSCHAT-01..06

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [ ] `validation.md` written with PASS/FAIL and `file:line` evidence per AC
- [ ] `validate_state.py` passes
- [ ] Surviving mutants become fix tasks if any

**Tests**: unit
**Gate**: full

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Prisma model | 1 schema + migration | OK |
| T2: Repository | 1 repository + co-located tests | OK |
| T3: Access helper | 1 util + detail use case refactor | OK |
| T4: List use case | 1 use case + tests | OK |
| T5: Create use case | 1 use case + tests | OK |
| T6: HTTP GET/POST | routes + controller + route tests | OK |
| T7: OpenAPI contracts | 1 contracts file | OK |
| T8: FE types + service | types + service methods | OK |
| T9: Hook | 1 hook + tests | OK |
| T10: Bubble | 1 component + tests | OK |
| T11: Thread + composer | 2 components + tests | OK |
| T12: Modal | 1 component + tests | OK |
| T13: Hero wiring | hero + view + test update | OK |
| T14: PATCH use case + route | use case + route + tests | OK |
| T15: FE edit flow | bubble + hook updates | OK |
| T16: Load older | thread + hook updates | OK |
| T17: Verifier | validation.md | OK |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (start) | Match |
| T2 | T1 | T1 → T2 | Match |
| T3 | T2 | T2 → T3 | Match |
| T4 | T3 | T3 → T4 | Match |
| T5 | T4 | T4 → T5 | Match |
| T6 | T5 | T5 → T6 | Match |
| T7 | T6 | T6 → T7 | Match |
| T8 | T7 | T7 → T8 | Match |
| T9 | T8 | T8 → T9 | Match |
| T10 | T9 | T9 → T10 | Match |
| T11 | T10 | T10 → T11 | Match |
| T12 | T11 | T11 → T12 | Match |
| T13 | T12 | T12 → T13 | Match |
| T14 | T13 | T13 → T14 | Match |
| T15 | T14 | T14 → T15 | Match |
| T16 | T15 | T15 → T16 | Match |
| T17 | T16 | T16 → T17 | Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Prisma schema/migration | none | none | OK |
| T2 | Repository | unit | unit | OK |
| T3 | Use case access helper | unit | unit | OK |
| T4 | List use case | unit | unit | OK |
| T5 | Create use case | unit | unit | OK |
| T6 | HTTP routes | unit | unit | OK |
| T7 | OpenAPI contracts | none | none | OK |
| T8 | FE service/types | unit | unit | OK |
| T9 | Hook | unit | unit | OK |
| T10 | Bubble UI | unit | unit | OK |
| T11 | Thread + composer UI | unit | unit | OK |
| T12 | Modal UI | unit | unit | OK |
| T13 | Hero wiring | unit | unit | OK |
| T14 | PATCH use case + route | unit | unit | OK |
| T15 | Edit UI | unit | unit | OK |
| T16 | Pagination UI | unit | unit | OK |
| T17 | Verifier | unit | unit | OK |

---

## GitHub Issues

| Task | Issue |
| ---- | ----- |
| Epic | https://github.com/Gabr1elaugus700/WorkaPool/issues/159 |
| T1 | https://github.com/Gabr1elaugus700/WorkaPool/issues/160 |
| T2 | https://github.com/Gabr1elaugus700/WorkaPool/issues/161 |
| T3 | https://github.com/Gabr1elaugus700/WorkaPool/issues/162 |
| T4 | https://github.com/Gabr1elaugus700/WorkaPool/issues/163 |
| T5 | https://github.com/Gabr1elaugus700/WorkaPool/issues/164 |
| T6 | https://github.com/Gabr1elaugus700/WorkaPool/issues/165 |
| T7 | https://github.com/Gabr1elaugus700/WorkaPool/issues/166 |
| T8 | https://github.com/Gabr1elaugus700/WorkaPool/issues/167 |
| T9 | https://github.com/Gabr1elaugus700/WorkaPool/issues/168 |
| T10 | https://github.com/Gabr1elaugus700/WorkaPool/issues/169 |
| T11 | https://github.com/Gabr1elaugus700/WorkaPool/issues/170 |
| T12 | https://github.com/Gabr1elaugus700/WorkaPool/issues/171 |
| T13 | https://github.com/Gabr1elaugus700/WorkaPool/issues/172 |
| T14 | https://github.com/Gabr1elaugus700/WorkaPool/issues/173 |
| T15 | https://github.com/Gabr1elaugus700/WorkaPool/issues/174 |
| T16 | https://github.com/Gabr1elaugus700/WorkaPool/issues/175 |
| T17 | https://github.com/Gabr1elaugus700/WorkaPool/issues/176 |
