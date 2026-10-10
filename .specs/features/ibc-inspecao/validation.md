# IBC — Inspeção por checklist (fatia 6, #307) Validation

**Verdict**: PASS

**Date**: 2026-10-10
**Spec**: `.specs/features/ibc-inspecao/spec.md` — "P2: Histórico e alertas na UI (fatia 6, #307)" ACs 1–2, plus AC 5 of "P2: Tela de inspeção no Controle do ativo" (button wiring deferred into this slice); issue #307 acceptance criteria
**Diff range**: `5fff31ec00db6ccc80135e0009946fe90c22e896..5eeb70b858333b33fa0536e4ae16d66489310e4e` (`origin/epic/272-ibc-inspecao...HEAD`, single commit `5eeb70b` on `feature/307-inspecao-tela-historico`; the dispatch referenced `8a2b872`, which is not on the branch — the commit was re-created, the verified diff is the one above)
**Verifier**: independent sub-agent (author ≠ verifier)

Abbreviations used below: `DRW` = `frontend/src/features/ibc/components/IbcInspecoesDrawer.tsx`, `DET` = `frontend/src/features/ibc/components/IbcAlertaReprovacaoDetalhes.tsx`, `PNL` = `frontend/src/features/ibc/components/CadastroIbcAlertsPanel.tsx`, `POOL` = `frontend/src/features/ibc/components/CadastroIbcPoolList.tsx`, `VIEW` = `frontend/src/features/ibc/views/CadastroIbcView.tsx`, `UT` = `frontend/src/features/ibc/utils/ibcInspecao.utils.ts`, `UTT` = `frontend/src/features/ibc/utils/ibcInspecao.utils.test.ts`.

---

## Task Completion

No `tasks.md` exists for `ibc-inspecao` (slices are tracked as GitHub issues). Issue #307 "Escopo Técnico" used as the task list:

| Task | Status | Notes |
| ---- | ------ | ----- |
| Tipos + `ibcInspecaoService.listar` + `useIbcInspecoes` | ✅ Done | `frontend/src/features/ibc/types/ibcInspecao.types.ts:22-44`; `frontend/src/features/ibc/services/ibcInspecaoService.ts:9-10`; `frontend/src/features/ibc/hooks/useIbcInspecao.ts:20-26`; registrar invalidates the history key (`useIbcInspecao.ts:50`) |
| `IbcInspecoesDrawer.tsx` (separate from conversion history) | ✅ Done | `DRW:24-100`; mounted separately from `IbcHistoricoDrawer` in `VIEW:332-334` |
| Botão "Inspeções" in pool, wired in view | ✅ Done | `POOL:118-120`; `VIEW:282` |
| `IbcAlertDTO` gains `INSPECAO_REPROVADA` + `detalhes?`; panel + labels | ✅ Done | `frontend/src/features/ibc/types/ibcCadastro.types.ts:46-69`; `PNL:20,36`; `frontend/src/features/ibc/utils/ibcCadastroLabels.ts:12,24-31` |
| Formatting via `frontend/src/utils/` | ✅ Done | `UT:8` imports `formatNumber` from `@/utils/formatNumber`; `DRW:4` imports `formatIsoDateTimeLabel` from `@/utils/formatDate`; `rg "Intl\." frontend/src/features/ibc` → 0 hits |
| (deferred from #306) Botão "Inspecionar" wired | ✅ Done | `POOL:86-90`; `VIEW:281,329-331` |

---

## Contract Check (frontend types vs backend DTOs)

| Backend (`backend/src/features/ibc/...`) | Frontend | Match |
| ---------------------------------------- | -------- | ----- |
| `types/IbcInspecao.types.ts:35-47` `IbcInspecaoHistoricoDto` {id, checklistModeloId, checklistNome, resultado, mediaObtida: number\|null, notaMinimaCritico, mediaMinima, inspetor {id, nome}, inspecionadoEm: string, observacao: string\|null, respostas[]} | `frontend/src/features/ibc/types/ibcInspecao.types.ts:29-44` (`IbcInspecaoLimitesDTO & {...}`) — same 11 fields, same nullability | ✅ |
| `types/IbcInspecao.types.ts:14-19` `IbcInspecaoRespostaDto` {checklistItemId, descricao, critico, nota} | `frontend/src/features/ibc/types/ibcInspecao.types.ts:22-27` | ✅ |
| `useCases/ListIbcAlerts.use-case.ts:11-28` `IbcAlert` {identificador, motivo, detalhes?: {checklists[{checklistModeloId, nome, mediaObtida\|null, mediaMinima, itensAbaixoDoMinimo[]}], alocacao?}} | `frontend/src/features/ibc/types/ibcCadastro.types.ts:54-69` | ✅ |
| `services/listarItensAbaixoDoMinimo.ts:1` `{descricao, nota, notaMinima}` | `frontend/src/features/ibc/types/ibcCadastro.types.ts:46-50` | ✅ |
| `types/IbcInspecao.types.ts:62` `IbcAlocacaoAberta` {codCar: number, numPed: string} | `frontend/src/features/ibc/types/ibcCadastro.types.ts:52` | ✅ |
| `types/IbcCadastro.types.ts:6-8` motivo union incl. `INSPECAO_REPROVADA`, `SEM_INSPECAO` | `frontend/src/features/ibc/types/ibcCadastro.types.ts:1-4,67` | ✅ |

---

## Spec-Anchored Acceptance Criteria

### P2: Histórico e alertas na UI (fatia 6, #307)

| Criterion | Spec-defined outcome | `file:line` evidence | Result |
| --------- | -------------------- | -------------------- | ------ |
| H1 open "Inspeções" | button opens the history for that IBC | `POOL:118-120` button → `onVerInspecoes`; `VIEW:282` `setInspecoesIbc`; `VIEW:332-334` mounts `IbcInspecoesDrawer`; `DRW:25` `useIbcInspecoes(ibc.id)` | ✅ PASS |
| H1 most recent first | list ordered newest → oldest | UI renders API order unchanged (`DRW:46-48`); API orders `ultimaPrimeiro` = `inspecionadoEm desc, id desc` (`backend/src/features/ibc/repositories/IbcInspecaoRepository.ts:29,123`) | ✅ PASS (relies on API order, see gap 3) |
| H1 checklist | checklist name per inspection | `DRW:61` `{inspecao.checklistNome}` | ✅ PASS |
| H1 resultado | Aprovada/Reprovada | `DRW:62-64` badge `ibcCadastroLabels.inspecaoResultado[inspecao.resultado]` (destructive variant when REPROVADA); labels `frontend/src/features/ibc/utils/ibcCadastroLabels.ts:28-31` | ✅ PASS |
| H1 média vs mínima (snapshot) | obtained average against snapshot minimum | `DRW:67` `formatMediaVsMinima(inspecao.mediaObtida, inspecao.mediaMinima)`; util `UT:60-63`; `UTT:124` `assert.equal(formatMediaVsMinima(6.5, 7), "média 6,5 · mín. 7")`; `UTT:128` null case `"sem média (só críticos) · mín. 7"` | ✅ PASS |
| H1 nota mínima do crítico (snapshot) | snapshot `notaMinimaCritico` visible | `DRW:68-69` `" · crítico mín. "` + `formatNotaInspecao(inspecao.notaMinimaCritico)` | ✅ PASS |
| H1 notas por item | every answered item with its score | `DRW:72-87` maps `inspecao.respostas`; `DRW:77` descricao; `DRW:83` `formatNotaInspecao(resposta.nota)` | ✅ PASS |
| H1 crítico sinalizado | critical items flagged | `DRW:78-80` `Badge` "Crítico" when `resposta.critico` | ✅ PASS |
| H1 abaixo do mínimo sinalizado | items below their minimum flagged | `DRW:73` `isNotaAbaixoDoMinimo(resposta, inspecao)`; `DRW:82` `text-destructive`; `DRW:84` `(mín. X)` via `notaMinimaDoItem`; util `UT:49-58`; `UTT:110-111` critical→8, other→6.5; `UTT:115-118` strict `<` (7<8 true, 8<8 false, 6<6.5 true, 7<6.5 false) — same rule as backend `backend/src/features/ibc/services/listarItensAbaixoDoMinimo.ts:16-17` | ✅ PASS |
| H1 inspetor | inspector name | `DRW:96` `{inspecao.inspetor.nome}` | ✅ PASS |
| H1 data | inspection date | `DRW:94` `formatIsoDateTimeLabel(inspecao.inspecionadoEm)` (shared `frontend/src/utils/formatDate.ts:100`) | ✅ PASS |
| H1 observação | observation when present | `DRW:90-92` renders `inspecao.observacao` when non-null | ✅ PASS |
| H2 identificador | alert shows IBC identifier | `PNL:31` `{alert.identificador}`; motivo label `PNL:34` → "Inspeção reprovada" (`frontend/src/features/ibc/utils/ibcCadastroLabels.ts:12,24-25`) | ✅ PASS |
| H2 checklist | failed checklist(s) named | `PNL:36` renders `IbcAlertaReprovacaoDetalhes` when `alert.detalhes`; `DET:15-18` one block per `detalhes.checklists`, `{checklist.nome}`; `DET:21` média vs mínima | ✅ PASS |
| H2 itens abaixo do mínimo | items with score and minimum | `DET:24-28` "Abaixo do mínimo: " + `formatItensAbaixoDoMinimo(...)` (hidden when empty); util `UT:65-69`; `UTT:134-140` `"Válvula: 3 (mín. 6) · Tampa: 4 (mín. 6,5)"`; `UTT:144` empty → `""` | ✅ PASS |
| H2 alocação (carga/pedido) quando houver | carga + pedido only when allocated | `DET:31-33` renders only when `detalhes.alocacao`; util `UT:71-73`; `UTT:150` `"Alocado na carga 123 · pedido 456"` | ✅ PASS |
| H2 destaque destrutivo (issue #307) | reprovação styled destructive | `PNL:20,26-27` `isDestrutivo` includes `INSPECAO_REPROVADA` → `border-destructive/40 bg-destructive/5` | ✅ PASS |

### P2: Tela de inspeção no Controle do ativo — AC 5 (wiring in this slice)

| Criterion | Spec-defined outcome | `file:line` evidence | Result |
| --------- | -------------------- | -------------------- | ------ |
| T5 hide "Inspecionar" | hidden when Em viagem or substituído | `POOL:86` `{!substituido && ibc.custodia !== "EM_VIAGEM" ? (<Button>Inspecionar</Button>) : null}` (`substituido` from `isIbcSubstituido`, `POOL:47`); `custodia` union `"PATIO" \| "EM_VIAGEM"` at `frontend/src/features/ibc/types/ibcCadastro.types.ts:12` | ✅ PASS (no automated test, see gap 2) |
| T5 wiring | button opens the inspection dialog | `POOL:87` `onInspecionar(ibc)`; `VIEW:281` `setInspecaoIbc`; `VIEW:329-331` `IbcInspecaoDialog key={inspecaoIbc.id}` | ✅ PASS |

### Issue #307 acceptance criteria

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| Histórico consultável na UI, com snapshot dos limites e do crítico | H1 rows above; limits read from the inspection DTO (`DRW:67-69,73,84`), not from the current checklist | ✅ PASS |
| Alerta de reprovação mostra identificador, checklist e itens abaixo do mínimo | H2 rows above | ✅ PASS |
| Fatia demoável (Checklist Soda → reprovar → alerta → reinspecionar → Apto) | Not executable by the Verifier | ⏳ Pending — manual demo by user (gap 1) |
| Lint, testes e typecheck do frontend ok | Gate Check below | ✅ PASS |
| Formatação via `frontend/src/utils/` (sem `Intl` duplicado) | `UT:8`, `DRW:4`; 0 `Intl.` hits under `frontend/src/features/ibc` | ✅ PASS |

**Status**: ✅ 17/17 spec rows + 2/2 AC-5 rows + 4/5 issue criteria verified with `file:line` evidence; the fifth (manual demo) is pending the user and is non-blocking.

---

## Discrimination Sensor

Scratch: `git worktree add --detach ..\WorkaPool.worktrees\verifier-307-scratch HEAD` + junction to the real `frontend\node_modules`. Baseline: 16/16 pass. Each mutant applied alone to `UT`, `npx tsx --tsconfig tsconfig.app.json --test src/features/ibc/utils/ibcInspecao.utils.test.ts` run from scratch `frontend`, then `git checkout -- <file>` before the next.

| # | File | Mutation | Killed? | Killed by |
| - | ---- | -------- | ------- | --------- |
| M1 | `UT:57` | `item.nota < min` → `<=` in `isNotaAbaixoDoMinimo` | ✅ Killed (1 test) | `UTT:116` (8 vs 8 → false) |
| M2 | `UT:50` | swap critico branch in `notaMinimaDoItem` | ✅ Killed (2 tests) | `UTT:110-111`, `UTT:115-118` |
| M3 | `UT:62` | drop `"mín."` in `formatMediaVsMinima` | ✅ Killed (2 tests) | `UTT:124`, `UTT:128` |
| M4 | `UT:68` | `.join(" · ")` → `.join(", ")` in `formatItensAbaixoDoMinimo` | ✅ Killed (1 test) | `UTT:134-140` |
| M5 | `UT:72` | swap carga/pedido in `formatAlocacaoAlerta` | ✅ Killed (1 test) | `UTT:150` |
| M6 | `UT:61` | null-média label → `"média —"` | ✅ Killed (1 test) | `UTT:128` |
| M7 | `UT:67` | item minimum prints `nota` instead of `notaMinima` | ✅ Killed (1 test) | `UTT:134-140` |

**Sensor depth**: standard (5 requested + 2 extra mutants on presentation utils)
**Result**: 7/7 killed — PASS ✅
**Isolation**: scratch clean after each restore; junction removed first with `cmd /c rmdir` (no recursive delete through it), `git worktree remove --force` deregistered the worktree (folder delete hit "Permission denied" from a lingering handle; leftover folder verified junction-free, then removed), `git worktree prune` run. Real `frontend/node_modules` intact (495 packages, `vite/package.json` present). Real tree `git status --porcelain` unchanged apart from this file.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ (~170 production lines, matches the issue estimate) |
| Surgical changes | ✅ (`isDataLimite` renamed `isDestrutivo` to cover the new motivo) |
| No scope creep | ✅ |
| Matches patterns (React Query hook + feature service, `Dialog` like `IbcHistoricoDrawer`, `satisfies Record<...>` labels, section skeleton/error) | ✅ |
| Layer boundaries (no HTTP in components; view orchestrates via hooks) | ✅ `DRW:25` uses hook; HTTP only in `ibcInspecaoService.ts` |
| Shared utils (no duplicated `Intl`) | ✅ |
| No `any` | ✅ |
| Spec-anchored outcome check | ✅ |
| Util rules mirror backend (`notaMinimaDoItem` ↔ `listarItensAbaixoDoMinimo.ts:16`) | ✅ |
| Every new test maps to an AC | ✅ (`UTT:106-152` → H1 média/crítico/abaixo, H2 itens/alocação) |
| Documented guidelines followed: `AGENTS.md`, `.cursor/rules/layer-boundaries.mdc`, `.cursor/rules/shared-utils.mdc` | ✅ |

---

## Gate Check

- **Typecheck** (`npx tsc --noEmit --project tsconfig.app.json`): exit 0
- **Lint** (`npm run lint`): exit 0 — 0 errors, 8 warnings, all pre-existing `react-hooks/exhaustive-deps` outside the IBC feature (`npx eslint src/features/ibc`: 0 problems)
- **Tests** (`npm test`): 276 passed, 0 failed, 0 skipped, 0 cancelled (104 suites)
- **Test delta from this slice**: +7 tests in `UTT` (4 describes); no tests removed or weakened
- **Production build**: not run (forbidden in the agent flow)

---

## Ranked Gaps (non-blocking)

1. **Manual demo pending, user to run** — issue #307: inspecionar com "Checklist Soda" → reprovar → ver alerta `INSPECAO_REPROVADA` com itens/alocação → abrir "Inspeções" → reinspecionar → Apto. Required by the spec "Independent Test" (demo manual) and the issue; the Verifier cannot drive it.
2. **"Inspecionar" visibility rule has no automated test** (T5) — `POOL:86`. Fix: extract `podeInspecionar(ibc)` into `frontend/src/features/ibc/utils/` and unit-test EM_VIAGEM / substituído / PATIO, or add a render test of `CadastroIbcPoolList`.
3. **"Mais recente primeiro" is only guaranteed by the API** — `DRW:46-48` renders API order; no frontend assertion. Backend order is `IbcInspecaoRepository.ts:29,123`. Acceptable as is; fix only if the UI ever re-sorts (add a render/order test then).
4. **Components not render-tested** — `DRW`, `DET`, `PNL` field presence verified by reading only. The spec only requires util unit tests + demo, so this is coverage hardening, not a gap against the spec.
5. **`INSPECAO_REPROVADA` without `detalhes`** (legacy fallback `backend/src/features/ibc/useCases/ListIbcAlerts.use-case.ts:99-100`) shows only identificador + motivo (`PNL:36`). Matches the API contract; noted so the demo is not confused by it.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| IBCINSP-09 | Implementing | ✅ Verified (AC 5 button wiring; manual demo pending) |
| IBCINSP-10 | Implementing | ✅ Verified (manual demo pending) |

---

## Summary

**Overall**: ✅ Ready (pending the user's manual demo)

**Spec-anchored check**: 17/17 history/alert rows + 2/2 AC-5 rows matched the spec outcome; frontend DTOs match the backend contract field-by-field
**Sensor**: 7/7 mutations killed
**Gate**: tsc exit 0; lint 0 errors; 276/276 frontend tests passed

**Next steps**: user runs the manual demo (gap 1); optional hardening of gaps 2–4.
