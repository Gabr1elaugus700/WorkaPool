# IBC — Vínculo de checklist no IBC (API) Validation

**Verdict**: PASS

**Date**: 2026-10-06
**Spec**: `.specs/features/ibc-checklist-vinculo/spec.md`
**Diff range**: `ee3c435c191d464adabdeab935b5e63a892f9846..d15ba3a1d57e0ad866e4832675302f56bce7238b` (part 1 = 735554d on `epic/31-modulo-ibc`; part 2 = `feature/277-vinculo-checklist-api-escrita`)
**Verifier**: independent sub-agent (author ≠ verifier)

Abbreviations used below: `INT` = `backend/test/integration/features/ibc/ibcChecklistVinculos.integration.test.ts`, `UC` = `backend/test/unit/features/ibc/useCases/IbcChecklistVinculoUseCases.test.ts`, `RA` = `backend/test/unit/features/ibc/ibcRoutesAuth.test.ts`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | Model in `schema.prisma` + `schema.dev.prisma`; additive migration `20261007230000_ibc_checklist_vinculo` (unique + index + 3 FKs, Restrict) |
| T2 | ✅ Done | `ensureIbcChecklistSchema` mirrors the migration with `IF NOT EXISTS` |
| T3 | ✅ Done | `ListIbcChecklistVinculos.use-case.ts` |
| T4 | ✅ Done | Repository `listByIbc` (orderBy `checklistModelo.nome asc`), controller, `readAuth` route |
| T5 | ✅ Done | `VincularIbcChecklist.use-case.ts`; P2002 → `null` → 409 |
| T6 | ✅ Done | `findElegibilidade`, Zod `vincularChecklist`, controller 201, `writeAuth` route |
| T7 | ✅ Done | `DesvincularIbcChecklist.use-case.ts` |
| T8 | ✅ Done | `delete` via `deleteMany` → `count > 0`, controller 204, `writeAuth` route |
| T9 | ✅ Done | `CONTEXT.md` entry matches implemented codes/status |

---

## Spec-Anchored Acceptance Criteria

### P1: Listar

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| L1 GET for existing IBC | 200, sorted by checklist name, fields `checklistModeloId, nome, ativo, vinculadoEm, vinculadoPor{id,nome}` | `INT:121` `assert.equal(response.status, 200)`; `INT:122-137` `assert.deepEqual(response.body, [A Estrutural…, B Soda…])` (seeded in reverse order, full DTO) | ✅ PASS |
| L2 IBC without vínculos | 200 `[]` | `INT:153-154` `assert.equal(vazio.status, 200)`; `assert.deepEqual(vazio.body, [])`; `UC:107` | ✅ PASS |
| L3 IBC does not exist | 404 `IBC_NOT_FOUND` | `INT:172-173` `assert.equal(response.status, 404)`; `assert.equal(response.body.code, "IBC_NOT_FOUND")`; `UC:118` `hasCode("IBC_NOT_FOUND", 404)` | ✅ PASS |
| L4 checklist deactivated later | still listed with `ativo: false` | `INT:115` deactivates, `INT:126` `ativo: false` inside `deepEqual` | ✅ PASS |
| L5 role without read access | 403 | `RA:337` `assert.strictEqual(vendas.status, 403)`; `RA:343-344` LOGISTICA/GERENTE_DPTO not 401/403 | ✅ PASS |
| (Assumption) baixado IBC on GET | lists normally | `INT:156-163` status 200 + `[soda.id]`; `UC:110-114` | ✅ PASS |

### P1: Vincular

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| V1 active IBC checklist, not linked | 201 + DTO; author = JWT user; current date | `INT:191` `assert.equal(created.status, 201)`; `INT:192-195` checklistModeloId/nome/ativo/`vinculadoPor {id: ana.id, nome}`; `INT:196` `Date.parse(vinculadoEm) >= inicio - 1000`; `INT:202` GET equals `[created.body]`; `UC:127` `creates` deepEqual `vinculadoPorId: "user-9"` | ✅ PASS (date: lower bound only, see gap 3) |
| V2 checklist does not exist | 404 `IBC_CHECKLIST_NOT_FOUND` | `INT:227,233-234` case `[zero-uuid, 404, "IBC_CHECKLIST_NOT_FOUND"]`; `UC:146` | ✅ PASS |
| V3 `tipo = VISTORIA` | 422 `IBC_CHECKLIST_TIPO_INVALIDO` | `INT:225,233-234`; `UC:151` `hasCode("IBC_CHECKLIST_TIPO_INVALIDO", 422)` + `creates.length === 0` | ✅ PASS |
| V4 inactive checklist | 422 `IBC_CHECKLIST_INATIVO` | `INT:226,233-234`; `UC:157` | ✅ PASS |
| V5 already linked | 409 `IBC_CHECKLIST_JA_VINCULADO` | `INT:238-241` status 409 + code + DB count 1; `UC:163` | ✅ PASS |
| V6 concurrent requests | one link, other gets 409 `IBC_CHECKLIST_JA_VINCULADO` | `INT:259` `deepEqual(statuses.sort(), [201, 409])`; `INT:260` code; `INT:261` count 1 (real Postgres P2002); `UC:170-173` | ✅ PASS |
| V7 IBC missing or baixado | 404 `IBC_NOT_FOUND` | `INT:270-277` (baixado + zero-uuid) status 404 + code; `UC:176-181` | ✅ PASS |
| V8 body without UUID `checklistModeloId` | 400 `IBC_CHECKLIST_VINCULO_INVALID_BODY` | `INT:228-229` cases `{}` and `"nao-e-uuid"` → 400 + code | ✅ PASS |
| V9 role not ADMIN/ALMOX | 403 | `RA:357` `assert.strictEqual(response.status, 403)` for LOGISTICA/GERENTE_DPTO/VENDAS; `UC:133-141` `IBC_CHECKLIST_FORBIDDEN` 403 | ✅ PASS (USER role not exercised, see gap 5) |
| V10 aptidão unchanged | `aptidao`, `motivoInaptidao`, `primeiraInspecaoEm` equal before/after | `INT:197` `assert.deepEqual(await readAptidao(ibc.id), antes)` on an INAPTO IBC with all three fields set (`INT:56-65`) | ✅ PASS |

### P1: Desvincular

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| D1 existing link | removed, 204 | `INT:299` `assert.equal(removed.status, 204)`; `INT:305` GET `[]`; `UC:190-191` | ✅ PASS |
| D2 link does not exist | 404 `IBC_CHECKLIST_VINCULO_NOT_FOUND` | `INT:308-309`; `UC:195-199` | ✅ PASS |
| D3 IBC missing or baixado | 404 `IBC_NOT_FOUND` | `INT:342-349` status 404 + code + link kept (count 1); `UC:202-208` | ✅ PASS |
| D4 inactive checklist | 204 | `INT:329-330` status 204 + count 0; `UC:210-217` | ✅ PASS |
| D5 role not ADMIN/ALMOX | 403 | `RA:369` 403 for LOGISTICA/GERENTE_DPTO/VENDAS; `UC:219-228` | ✅ PASS |
| D6 aptidão unchanged | three fields equal | `INT:300` `assert.deepEqual(await readAptidao(ibc.id), antes)` (INAPTO IBC) | ✅ PASS |

### Edge Cases

| Edge case | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| E1 non-UUID `:id` | 404 `IBC_NOT_FOUND`, no 500 | `INT:168-174` `"nao-e-uuid"` on GET → 404 + code | ✅ PASS for GET; POST/DELETE not exercised (gap 1) |
| E2 same checklist on two IBCs | both accepted | `INT:204-208` second POST on `outroIbc` → 201 | ✅ PASS |
| E3 unlink + relink | accepted, new author/date | `INT:311-313` 201 + `vinculadoPor {id: bruno.id}` | ✅ PASS for author; new date not asserted (gap 2) |

**Status**: ✅ All 21 ACs + 3 edge cases have `file:line` evidence whose asserted value matches the spec outcome. Minor precision gaps listed below; none blocks.

---

## Discrimination Sensor

Scratch: `git worktree add --detach ..\WorkaPool.worktrees\verifier-277-scratch HEAD` + `node_modules` junction. Each mutant applied alone, IBC unit tests (`test/unit/features/ibc/**`) and IBC integration tests run, then the file restored with `git checkout` and the scratch verified clean before the next mutant.

| # | File | Mutation | Killed? | Killed by |
| - | ---- | -------- | ------- | --------- |
| M1 | `useCases/findIbcOrThrow.ts:24` | Drop baixado check in `assertIbcAtivo` (`if (false)`) | ✅ Killed (2 unit, 2 int) | UC baixado cases; INT POST/DELETE baixado |
| M2 | `useCases/VincularIbcChecklist.use-case.ts:58,66` | Swap codes `TIPO_INVALIDO` ↔ `INATIVO` | ✅ Killed (2 unit, 1 int) | UC:151,157; INT refusals test |
| M3 | `http/controllers/IbcChecklistController.ts` (`vincular`) | POST returns 200 instead of 201 | ✅ Killed (4 int) | INT happy path, refusals, race, relink |
| M4 | `repositories/IbcChecklistVinculoRepository.ts:44` | `delete` always returns `true` | ✅ Killed (1 int) | INT:308-309 (`VINCULO_NOT_FOUND`) |
| M5 | `repositories/IbcChecklistVinculoRepository.ts:26` | Remove `orderBy nome` from `listByIbc` | ✅ Killed (1 int) | INT:122 ordering deepEqual |
| M6 | `repositories/IbcChecklistVinculoRepository.ts:54` | `vinculadoPor.nome` mapped to user id instead of `name` | ✅ Killed (3 int) | INT:122, 195, 313 |
| M7 | `repositories/IbcChecklistVinculoRepository.ts:37` | P2002 no longer translated (race/duplicate → 500) | ✅ Killed (2 int) | INT:239-240, 259-260 |
| M8 | `useCases/ListIbcChecklistVinculos.use-case.ts:15` | Baixado IBC returns `[]` on GET | ✅ Killed (1 unit, 1 int) | UC:110-114; INT:156-163 |

Note: a first sensor pass reverted with a wrong path, so mutants stacked after M1; those results were discarded and the full set was re-run cleanly (table above).

**Sensor depth**: expanded (8 manual mutants; data-integrity path: unique + authorship)
**Result**: 8/8 killed — PASS ✅
**Isolation**: real tree `git status --porcelain` empty before and after; scratch worktree removed + `git worktree prune`; real `backend/node_modules` intact.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (`actorRole` refactored into `actor()` — needed for `actorId`) |
| No scope creep | ✅ |
| Matches patterns (`respondAppError`, `invalidBody`, `readAuth`/`writeAuth`, repo interfaces) | ✅ |
| Layer boundaries (controller validates + delegates; no Prisma in use-cases; no HTTP in repo) | ✅ |
| DTO mapping (no raw Prisma rows leaked) | ✅ `toVinculoDto` |
| No `any` | ✅ |
| Spec-anchored outcome check | ✅ |
| Per-layer coverage (use-case 1:1; routes happy + edge + error) | ✅ |
| Every test maps to an AC / edge case / Done-when | ✅ (`IbcChecklistUseCases.test.ts` change is only a stub for the new interface method) |
| Documented guidelines followed: `AGENTS.md`, `.cursor/rules/layer-boundaries.mdc` | ✅ |

---

## Gate Check

- **Unit** (`npm test`): 522 passed, 0 failed, 0 skipped
- **IBC integration** (`test/integration/features/ibc/*.test.ts`): 42 passed, 0 failed, 0 skipped
- **Typecheck** (`npx tsc --noEmit`): exit 0
- **Lint**: not runnable — `backend/package.json` has no `lint` script (tasks.md Build gate lists `npm run lint`; see gap 6)
- **Test delta from this feature**: +17 use-case unit tests, +3 route-auth subtests, +10 integration tests; no tests removed or weakened
- **Full `npm run test:integration`**: not run by the Verifier (scope limited to IBC suites); tasks.md records a pre-existing unrelated failure in `OverviewCustomerSyncPipeline`

---

## Ranked Gaps (non-blocking)

1. **Non-UUID `:id` on POST/DELETE untested** (Edge E1) — `INT:270`, `INT:342` use only the zero UUID. Fix: add `"nao-e-uuid"` to the id loops in both tests and assert 404 `IBC_NOT_FOUND`.
2. **Relink "new date" not asserted** (Edge E3) — `INT:311-313` checks only the new author. Fix: capture the first `vinculadoEm` and assert `Date.parse(relinked.body.vinculadoEm) >= Date.parse(first.vinculadoEm)` (or seed the first link with an old date and assert it changed).
3. **"Data atual" only lower-bounded** (V1) — `INT:196`. Fix: also assert `Date.parse(created.body.vinculadoEm) <= Date.now() + 1000`.
4. **Spec-precision: error precedence undefined** — spec does not say which error wins when several apply (e.g. baixado IBC + VISTORIA checklist, or invalid body + 403). Implementation order is auth → body → IBC → checklist → duplicate. Fix: state the order in spec.md assumptions (no code change).
5. **USER role not exercised for 403** (L5/V9/D5) — `RA:352`, `RA:365` loop LOGISTICA/GERENTE_DPTO/VENDAS only; allowlist `requireRoles` makes this low risk. Fix: add `"USER"` to the role loops.
6. **tasks.md Build gate references a missing `npm run lint`** — `tasks.md:43`. Fix: replace with the actual backend lint invocation or drop it.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| IBCVINC-01 | Done | ✅ Verified |
| IBCVINC-02 | Done | ✅ Verified |
| IBCVINC-03 | Done | ✅ Verified |
| IBCVINC-04 | Done | ✅ Verified |
| IBCVINC-05 | Done | ✅ Verified |
| IBCVINC-06 | Done | ✅ Verified |
| IBCVINC-07 | Done | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 21/21 ACs + 3/3 edge cases matched spec outcome (2 edge cases partially exercised; 1 spec-precision gap)
**Sensor**: 8/8 mutations killed
**Gate**: 522 unit + 42 IBC integration passed; tsc clean

**Next steps**: Optional hardening of gaps 1–3 and 5 in tests; clarify gap 4 in spec; fix gap 6 in tasks.md.
