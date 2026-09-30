# overview-customer-observation-chat Validation

## Validation verdict: PASS

**Date**: 2026-09-30
**Spec**: `.specs/features/overview-customer-observation-chat/spec.md`
**Diff range**: `eb9fc8e..354ec42` (commits OBSCHAT #184 a #233 mais os fixes da T17 `bd0f126` e `354ec42`, restrito a `backend/src/features/overviewCustomer/**`, `backend/prisma/schema.prisma`, `backend/test/unit/features/overviewCustomer/**`, `frontend/src/features/overviewCustomer/**`)
**Verifier**: sub-agent independente (author != verifier), read-only; sensor executado pelo orquestrador em worktree scratch.
**Iterações**: 2 de 3. A iteração 1 (sobre `72effa7`) deu FAIL; os fixes estão em [Fix Plans](#fix-plans) e a iteração 2 (sobre `354ec42`) está registrada abaixo.

Legenda de caminhos: `BT/` = `backend/test/unit/features/overviewCustomer/`, `BS/` = `backend/src/features/overviewCustomer/`, `FS/` = `frontend/src/features/overviewCustomer/`, `FU/` = `frontend/src/utils/`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T16 | Done | Todas marcadas em `tasks.md`; PRs #184, #193, #200-#202, #211, #216-#218, #222, #226, #229, #231-#233 em `main`. |
| T17 | Done | Este relatório + fixes `bd0f126` (copy de erro, helper de cache) e `354ec42` (testes de fronteira e `primaryCodRep` null). |

---

## Spec-Anchored Acceptance Criteria

### OBSCHAT-01: Abrir o histórico no hero

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | Botão de conversa ao lado do nome fantasia, nome acessível `Histórico de observações` | `FS/components/detail/OverviewCustomerDetailHero.test.ts:143` - `assert.ok(buttonIdx > tradeNameIdx)`; `:145` - `assert.match(markup, /<button type="button"[^>]*aria-label="Histórico de observações"/)` | PASS |
| 2 | Clique abre modal com título = nome fantasia e pede a thread daquele `customerCode` | Impl: `FS/views/OverviewCustomerDetailView.tsx:157` (`setObservationsOpen(true)`); `FS/components/detail/observations/OverviewCustomerObservationModal.tsx:40` (`<DialogTitle>{tradeName}</DialogTitle>`); `FS/hooks/useOverviewCustomerObservations.ts:42-49` (`enabled: open`). URL: `FS/utils/overviewCustomerObservationsPath.utils.test.ts:10-13` - `"/api/overview/customers/123/observations"` | PASS (título/abertura impl-only: Radix portal fora do alcance de `renderToStaticMarkup`) |
| 3 | Detalhe permanece atrás; fecha por overlay, controle de fechar ou Escape | Impl: `FS/views/OverviewCustomerDetailView.tsx:255-261` (modal irmão do conteúdo); `FS/components/detail/observations/OverviewCustomerObservationModal.tsx:29` (`Dialog onOpenChange`). Durante edição, o primeiro Escape cancela a edição (`OverviewCustomerObservationModal.tsx:32-37`) | PASS (impl-only, Radix Dialog) |
| 4 | Falha: modal aberto, sem mensagens inventadas, copy `Não foi possível carregar o histórico` | `FS/components/detail/observations/OverviewCustomerObservationModalBody.test.ts:54` - `assert.match(markup, /Não foi possível carregar o histórico/)`; `:56` - `assert.doesNotMatch(markup, /data-own=/)` | PASS |

### OBSCHAT-02: Ler o thread (50 mais recentes)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | No máximo 50, as mais novas por `createdAt`, ordem crescente | `BT/useCases/ListOverviewCustomerObservationsUseCase.test.ts:259` - `assert.equal(result.items.length, 50)`; `:261-262` - `id-02` / `id-51`; `BT/http/overviewCustomerObservationRoutes.test.ts:272-274` | PASS |
| 2 | Lista vazia; UI mostra `Nenhuma observação neste cliente` com composer visível | `BT/http/overviewCustomerObservationRoutes.test.ts:235` - `assert.deepEqual(response.body, { items: [], hasOlder: false, nextBefore: null })`; `FS/components/detail/observations/OverviewCustomerObservationModalBody.test.ts:64-65` | PASS |
| 3 | Nome do autor, corpo e `createdAt` em pt-BR | `FS/components/detail/observations/OverviewCustomerObservationBubble.test.ts:76-80`; `FU/formatDate.test.ts:45-48` - `"28/09/2026, 10:05"`; fallback `name`/`user`: `BT/repositories/OverviewCustomerObservationAuthorRepository.test.ts:22-26` | PASS |
| 4 | VENDAS de outro `codRep`: 403 `OVERVIEW_CUSTOMER_FORBIDDEN`, sem observações | `BT/http/overviewCustomerObservationRoutes.test.ts:342` - `assert.equal(response.status, 403)`; `:343` - `"OVERVIEW_CUSTOMER_FORBIDDEN"`; `:344` - `assert.equal(response.body.items, undefined)` | PASS |
| 5 | Role fora de ADMIN/GERENTE_DPTO/VENDAS: 403 `OVERVIEW_CUSTOMER_FORBIDDEN` | `BT/http/overviewCustomerObservationRoutes.test.ts:354-355` (LOGISTICA); `BT/utils/assertOverviewCustomerAccess.test.ts:142-144` (USER) | PASS |
| 6 | Cliente desconhecido: 404 `OVERVIEW_CUSTOMER_NOT_FOUND` | `BT/http/overviewCustomerObservationRoutes.test.ts:365-366`; `BT/useCases/ListOverviewCustomerObservationsUseCase.test.ts:426` | PASS |

### OBSCHAT-03: Registrar observação

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | Persiste `customerCode`, autor do token, `createdAt`, `updatedAt` = `createdAt`, `editedAt` null | `BT/useCases/CreateOverviewCustomerObservationUseCase.test.ts:165` - `authorUserId, "user-admin"`; `:167-172`; `BT/http/overviewCustomerObservationRoutes.test.ts:392` (autor vem do JWT). A igualdade `createdAt` = `updatedAt` vem do fake Prisma (`CreateOverviewCustomerObservationUseCase.test.ts:40-47`); produção usa `@default(now())`/`@updatedAt` (`backend/prisma/schema.prisma:490-491`) | PASS (igualdade de timestamps apoiada no fake; ver Observações) |
| 2 | 201 com a observação; UI anexa e limpa o composer | `BT/http/overviewCustomerObservationRoutes.test.ts:390` - `assert.equal(response.status, 201)`; `FS/utils/overviewCustomerObservationsState.utils.test.ts:73` - `["obs-1", "obs-2"]`; `:211` - `draftAfterObservationSubmitSuccess(), ""` | PASS |
| 3 | Enviar desabilitado com request em voo | `FS/utils/overviewCustomerObservationsState.utils.test.ts:205` - `canSubmitObservation("observação", true), false`; `FS/components/detail/observations/OverviewCustomerObservationComposer.test.ts:40` - `/\sdisabled=""/` | PASS |
| 4 | Vazio após trim: 400 `OBSERVATION_INVALID_BODY`, não persiste | `BT/http/overviewCustomerObservationRoutes.test.ts:431-433` - `400` / `"OBSERVATION_INVALID_BODY"` / `rows.length, 0`; `BT/useCases/CreateOverviewCustomerObservationUseCase.test.ts:245`, `:250` - `createCount, 0` | PASS |
| 5 | Mais de 2000 após trim: 400 `OBSERVATION_INVALID_BODY`, não persiste | `BT/http/overviewCustomerObservationRoutes.test.ts:421` (`"a".repeat(2001)`); `BT/useCases/CreateOverviewCustomerObservationUseCase.test.ts:255-267`; fronteira aceita `:281` - `result.body.length, 2000` (M2 killed) | PASS |
| 6 | VENDAS de outro `codRep`: 403 `OVERVIEW_CUSTOMER_FORBIDDEN`, não persiste | `BT/http/overviewCustomerObservationRoutes.test.ts:458-460`; `BT/useCases/CreateOverviewCustomerObservationUseCase.test.ts:295-298` | PASS |
| 7 | Falha no envio: mantém o texto e mostra `Não foi possível enviar a observação` | Texto mantido: `FS/utils/overviewCustomerObservationsState.utils.test.ts:216` - `draftAfterObservationSubmitError(draft), draft`. Copy: `FS/utils/overviewCustomerObservationsState.utils.test.ts:222` - `assert.equal(OBSERVATION_SUBMIT_ERROR_MESSAGE, "Não foi possível enviar a observação")`; o hook usa só essa constante no `onError`, sem ler a mensagem do servidor (`FS/hooks/useOverviewCustomerObservations.ts:91-92`); render da copy injetada em `FS/components/detail/observations/OverviewCustomerObservationComposer.test.ts:53` | PASS (corrigido em `bd0f126`) |

### OBSCHAT-04: Bolhas no padrão WhatsApp/Grok

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | Própria à direita | `FS/components/detail/observations/OverviewCustomerObservationBubble.test.ts:59-61` - `data-own="true"`, `/ml-auto/`, sem `mr-auto`; `FS/components/detail/observations/OverviewCustomerObservationThread.test.ts:70` - `["true", "false"]` | PASS |
| 2 | Dos outros à esquerda | `FS/components/detail/observations/OverviewCustomerObservationBubble.test.ts:67-69` - `data-own="false"`, `/mr-auto/`, sem `ml-auto` | PASS |
| 3 | Composer embaixo; mais nova acima do composer após envio | `FS/components/detail/observations/OverviewCustomerObservationModalBody.test.ts:74`; auto-scroll impl `FS/components/detail/observations/OverviewCustomerObservationThread.tsx:55-57` | PASS |
| 4 | Autor alheio não vai à direita por ser o vendedor | `FS/components/detail/observations/OverviewCustomerObservationThread.test.ts:59-70` (autor "Vendedor" -> `"false"`); alinhamento só por `authorUserId` (`OverviewCustomerObservationThread.tsx:99`) | PASS |

### OBSCHAT-05: Editar a própria observação

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | PATCH do autor: novo corpo, `editedAt`/`updatedAt` = agora, `createdAt` e autor intactos | `BT/useCases/UpdateOverviewCustomerObservationUseCase.test.ts:166-170`; `BT/http/overviewCustomerObservationRoutes.test.ts:528-535`; `BT/repositories/OverviewCustomerObservationRepository.test.ts:325-328` | PASS |
| 2 | UI mostra `editado` quando `editedAt` não é null | `FS/components/detail/observations/OverviewCustomerObservationBubble.test.ts:87` - `/editado/`; `:88` - ausente no original | PASS |
| 3 | Não autor (inclusive ADMIN/GERENTE_DPTO): 403 `OBSERVATION_EDIT_FORBIDDEN`, linha intacta | `BT/http/overviewCustomerObservationRoutes.test.ts:550-553` (loop ADMIN/GERENTE `:538-555`); `BT/useCases/UpdateOverviewCustomerObservationUseCase.test.ts:186-190` - `updateCount, 0` (M3 killed) | PASS |
| 4 | Id fora do `customerCode` da rota: 404 `OBSERVATION_NOT_FOUND` | `BT/http/overviewCustomerObservationRoutes.test.ts:565-567`, `:578-579`; `BT/useCases/UpdateOverviewCustomerObservationUseCase.test.ts:225-228` | PASS |
| 5 | Vazio ou > 2000: 400 `OBSERVATION_INVALID_BODY` | `BT/http/overviewCustomerObservationRoutes.test.ts:596-598`; `BT/useCases/UpdateOverviewCustomerObservationUseCase.test.ts:263-266` | PASS |

### OBSCHAT-06: Página anterior no topo

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | Cursor para a página mais antiga (até 50, crescente) | `BT/http/overviewCustomerObservationRoutes.test.ts:275-279` - `hasOlder, true` / `nextBefore`; `BT/repositories/OverviewCustomerObservationRepository.test.ts:232-234`; `BT/useCases/ListOverviewCustomerObservationsUseCase.test.ts:371`, `:381` | PASS |
| 2 | Antigas entram no topo sem perder as novas | `FS/utils/overviewCustomerObservationsState.utils.test.ts:140-143` (60 = 50 + 10, em ordem); `FS/components/detail/observations/OverviewCustomerObservationThread.test.ts:157-159` | PASS |
| 3 | Sem página anterior: sem request e sem controle | Fronteira: `BT/useCases/ListOverviewCustomerObservationsUseCase.test.ts:277-296` - 50 observações -> `items.length, 50`, `hasOlder, false` (`:295`), `nextBefore, null` (M5 killed). Controle oculto: `FS/components/detail/observations/OverviewCustomerObservationThread.test.ts:147`, `:160`. Guard impl `FS/hooks/useOverviewCustomerObservations.ts:117` | PASS (corrigido em `354ec42`) |

**Status**: All ACs covered. 29/29 PASS, 2 deles com parte impl-only (OBSCHAT-01 AC2/AC3, UI do Radix Dialog). 0 spec-precision gaps.

---

## Discrimination Sensor

Baseline `git status --porcelain` capturado antes; worktree scratch destacada em `%TEMP%\obschat-sensor-wt` a partir de `HEAD`, com junctions para `node_modules` (desfeitas antes de `git worktree remove --force`). Cada mutante aplicado, testes OBSCHAT rodados (8 arquivos backend, 8 frontend), arquivo restaurado com `git checkout`. Sem `git stash`.

**Iteração 1 (`72effa7`)**: 5/7 killed. Sobreviveram M5 (fronteira de 50) e M7 (descarte do cache ao fechar, então no hook).

**Iteração 2 (`354ec42`)**:

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| M1 | `backend/src/features/overviewCustomer/utils/assertOverviewCustomerAccess.ts:40` | `primaryCodRep !== codRep` -> `primaryCodRep === null` (VENDAS de outro codRep passa) | Killed (8 falhas, ex.: OBSCHAT-02 AC4, OBSCHAT-03 AC6) |
| M2 | `backend/src/features/overviewCustomer/useCases/CreateOverviewCustomerObservationUseCase.ts:39` | `> MAX` -> `>= MAX` | Killed (`accepts body of exactly 2000 characters after trim`) |
| M3 | `backend/src/features/overviewCustomer/useCases/UpdateOverviewCustomerObservationUseCase.ts:52` | Checagem de autor -> `false` | Killed (5 falhas, OBSCHAT-05 AC3) |
| M4 | `backend/src/features/overviewCustomer/repositories/OverviewCustomerObservationRepository.ts:87` | Remove desempate `{ id: "desc" }` | Killed (`orders by id ascending when createdAt ties`) |
| M5 | `backend/src/features/overviewCustomer/useCases/ListOverviewCustomerObservationsUseCase.ts:63` | `page.length > PAGE_SIZE` -> `>=` | Killed (`returns exactly 50 observations without hasOlder...`) |
| M6 | `frontend/src/features/overviewCustomer/components/detail/observations/OverviewCustomerObservationBubble.tsx:23` | `isOwn ?` -> `!isOwn ?` | Killed (2 falhas de alinhamento) |
| M7 | `frontend/src/features/overviewCustomer/utils/overviewCustomerObservationsState.utils.ts:75` | Remove `queryClient.removeQueries(...)` ao fechar | Killed (`drops the cached thread on close...`) |
| M8 | `backend/src/features/overviewCustomer/utils/assertOverviewCustomerAccess.ts:40` | `primaryCodRep === null` nega ADMIN/GERENTE_DPTO | Killed (3 falhas, edge case `primaryCodRep` null) |

**Sensor depth**: reforçado (8 mutações; feature toca autorização e integridade de dados).
**Sensor result**: 8/8 killed.
**Isolation**: porcelain real idêntica ao baseline após remover a worktree nas duas iterações; `node_modules` reais intactos.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical changes / no scope creep | OK |
| Matches patterns (features/, route -> controller -> use case -> repository; hook -> utils) | OK |
| Sem `any` na superfície do diff | OK |
| Spec-anchored outcome check | OK |
| Per-layer coverage (use cases 1:1 ACs; rotas happy + 400/403/404; utils de estado do front) | OK |
| Testes mapeiam para AC/edge case/Done-when | OK |
| Guidelines: `AGENTS.md`, `.cursor/rules/layer-boundaries.mdc`, `.github/QUALITY_GATE.md` | OK |

---

## Edge Cases

- [x] Mesmo `createdAt` -> ordena por `id` crescente: `BT/repositories/OverviewCustomerObservationRepository.test.ts:208-211`; `BT/useCases/ListOverviewCustomerObservationsUseCase.test.ts:316` (M4 killed).
- [x] GERENTE_DPTO que não é o vendedor: só as próprias à direita: `FS/components/detail/observations/OverviewCustomerObservationThread.test.ts:70`.
- [x] `primaryCodRep` null -> ADMIN e GERENTE_DPTO leem e escrevem, VENDAS negado: `BT/utils/assertOverviewCustomerAccess.test.ts:122-131` (ADMIN/GERENTE permitidos), `:107-117` (VENDAS 403); escrita `BT/useCases/CreateOverviewCustomerObservationUseCase.test.ts:201-213` (`createCount, 1`) e `:217-230` (VENDAS 403, `createCount, 0`) (M8 killed).
- [x] Fechar e reabrir -> busca a página nova, sem thread stale: `FS/utils/overviewCustomerObservationsState.utils.test.ts:335` - `queryClient.getQueryData(queryKey), undefined` após fechar; `:355` só aquele cliente; hook usa `gcTime: 0, staleTime: 0` (`FS/hooks/useOverviewCustomerObservations.ts:47-48`) e chama o helper no effect (`:55`) (M7 killed).
- [x] Enter envia; Shift+Enter quebra linha: `FS/utils/overviewCustomerObservationComposer.utils.test.ts:7-17`.

---

## Gate Check

- **Lint**: `cd frontend && npm run lint` -> 0 erros (warnings só em arquivos fora da OBSCHAT); `npx eslint src/features/overviewCustomer` após os fixes -> 0 erros.
- **Typecheck**: `cd frontend && npx tsc --noEmit --project tsconfig.app.json` -> exit 0; `cd backend && npx tsc --noEmit -p tsconfig.json` -> exit 0.
- **OBSCHAT backend**: `cd backend; $env:NODE_ENV='test'; npx tsx --test <8 arquivos em test/unit/features/overviewCustomer>` -> 92 tests, 92 pass, 0 fail.
- **OBSCHAT frontend**: `cd frontend; $env:TSX_TSCONFIG_PATH='tsconfig.app.json'; npx tsx --test <7 arquivos observations + OverviewCustomerDetailHero.test.ts>` -> 67 tests, 67 pass, 0 fail.
- **Test count before T17**: 87 backend + 65 frontend = 152. **After**: 92 + 67 = 159. **Delta**: +7 (2 testes de resolver de mensagem do servidor substituídos por 2 de copy fixa; +3 de cache; +1 fronteira de 50; +2 access null; +2 create null).
- **Suite completa backend** (`tsx --test "test/unit/**/*.test.ts"`, antes dos fixes): 293 tests, 288 pass, 5 fail, todos fora da OBSCHAT e anteriores a ela (`cargo/cargoRoutesAuth`, `cargo/http/updatePedidoCarga.capacity.http`, `cargo/useCases/UpdateCargaUseCase`, `cargo/useCases/UpdatePedidoCargaUseCase.capacity`, `schedulers/watchdog/WatchdogScheduler.overlap`; ex.: `require is not defined in ES module scope`).
- **Suite completa frontend** (`tsx --test "src/**/*.test.ts"` com `tsconfig.app.json`, antes dos fixes): 170 tests, 169 pass, 1 fail fora da OBSCHAT (`OverviewCustomerDetailFirstPaintSkeleton.test.ts:15` espera `Carregando indicadores comerciais`, que o componente não renderiza).
- **Ambiente**: `npm test` como está (`tsx --test test/unit` / `tsx --test src`) não roda no Node 22.23 local (`ERR_UNSUPPORTED_DIR_IMPORT`); a CI usa Node 20. No frontend, sem `TSX_TSCONFIG_PATH=tsconfig.app.json` o tsx usa JSX clássico (`React is not defined`).
- **Skipped**: nenhum.

---

## Fix Plans

Aplicados na branch `feature/176-obschat-validation` após aprovação (opção A: seguir o spec).

### Fix 1: copy de erro do envio (OBSCHAT-03 AC7) - Major - `bd0f126`

- **Root cause**: `resolveObservationSubmitError` repassava `error.message` do servidor (`apiFetch` propaga `body.error`); a copy do spec só aparecia com mensagem vazia, e um teste travava esse comportamento.
- **Fix**: resolvers substituídos por `OBSERVATION_SUBMIT_ERROR_MESSAGE` / `OBSERVATION_EDIT_ERROR_MESSAGE` (`FS/utils/overviewCustomerObservationsState.utils.ts:10-11`), usados direto nos `onError` dos hooks; testes em `FS/utils/overviewCustomerObservationsState.utils.test.ts:222`, `:226`.

### Fix 2: fronteira de exatamente 50 (OBSCHAT-06 AC3, M5) - Major - `354ec42`

- **Fix**: `BT/useCases/ListOverviewCustomerObservationsUseCase.test.ts:277-296`.

### Fix 3: refetch ao reabrir o modal (edge case, M7) - Minor - `bd0f126`

- **Fix**: descarte extraído para `dropObservationsPageWhenClosed` (`FS/utils/overviewCustomerObservationsState.utils.ts:67-76`), testado com `QueryClient` real (`FS/utils/overviewCustomerObservationsState.utils.test.ts:321-357`).

### Fix 4: `primaryCodRep` null (edge case, M8) - Minor - `354ec42`

- **Fix**: `BT/utils/assertOverviewCustomerAccess.test.ts:121-133`; `BT/useCases/CreateOverviewCustomerObservationUseCase.test.ts:201-231`. O harness de create convertia `null` em `10` (`?? 10`) e passou a repassar o valor.

---

## Observações (não bloqueiam)

- OBSCHAT-03 AC1: `updatedAt` = `createdAt` é garantido em produção por `@default(now())` + `@updatedAt`, não por teste contra Postgres. Um teste de `test:integration` fecharia isso.
- O hook `useOverviewCustomerObservations` não tem teste próprio (não há DOM de teste no frontend); a lógica testável fica nos utils, e o hook só os conecta.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| OBSCHAT-01 | T13 | Verified |
| OBSCHAT-02 | T4, T6, T8, T12 | Verified |
| OBSCHAT-03 | T5, T6, T8, T9 | Verified |
| OBSCHAT-04 | T10, T11, T13 | Verified |
| OBSCHAT-05 | T14, T15 | Verified |
| OBSCHAT-06 | T2, T4, T16 | Verified |

---

## Summary

**Overall**: Ready.

**Spec-anchored check**: 29/29 ACs batem com o spec; 5/5 edge cases com evidência.
**Sensor**: 8/8 killed.
**Gate**: testes OBSCHAT 159/159 (92 backend + 67 frontend); tsc e eslint sem erros.

**What works**: acesso por role/codRep (inclusive `primaryCodRep` null), validação 1-2000, 201/400/403/404 com os códigos do spec, copy fixa de falha no envio, edição só do autor com `editado`, bolhas por `authorUserId`, paginação por cursor com desempate por `id` e fronteira de 50, thread refeita a cada abertura.

**Next steps**: PR para `main` (closes #176); falhas pré-existentes fora da OBSCHAT (cargo, watchdog, skeleton, `npm test` no Node 22) ficam para follow-up.
