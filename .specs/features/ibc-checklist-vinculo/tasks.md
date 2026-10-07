# IBC — Vínculo de checklist no IBC (API) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

Regras desta feature:

- Dois PRs para `epic/31-modulo-ibc` (ver "Agrupamento em PRs"): PR A em `feature/277-vinculo-checklist-api`, PR B em `feature/277-vinculo-checklist-api-escrita` criada de `origin/epic/31-modulo-ibc` depois do merge do PR A.
- Um commit atômico por task. **Nenhum push/PR/merge sem pedido explícito do usuário**.
- Sem `any`; sem build de produção.

---

**Spec**: `.specs/features/ibc-checklist-vinculo/spec.md`
**Design**: inline (segue o padrão de `IbcChecklistController` / `IbcChecklistRepository` / use-cases de #276)
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md` (§8), `.github/QUALITY_GATE.md`, `backend/package.json`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Use-case | unit | Todos os ramos; 1:1 com os ACs da spec; edge cases listados | `backend/test/unit/features/ibc/useCases/*.test.ts` | `npm test` |
| Route (auth por papel) | unit | 401/403 por papel em cada rota nova | `backend/test/unit/features/ibc/ibcRoutesAuth.test.ts` | `npm test` |
| Controller + Repository + Route (HTTP) | integration | Cada rota: caminho feliz + recusas + aptidão inalterada | `backend/test/integration/features/ibc/*.integration.test.ts` | `npm run test:integration` |
| Prisma schema / migration / test helper | none | Gate de integração (tabela criada e usada) | - | `npm run test:integration` |
| Docs (`CONTEXT.md`) | none | - | - | - |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com testes unitários | `cd backend && npm test` |
| Full | Tasks com integração HTTP/persistência | `cd backend && npm test && npm run test:integration` |
| Build | Fim de fase | `cd backend && npm run lint && npx tsc --noEmit && npm test && npm run test:integration` |

---

## Agrupamento em PRs

Limite do CI: 300 linhas adicionadas sem testes nem Markdown. A #277 inteira tem ~374 linhas de produção.

| PR | Fases | Tasks | Branch | Linhas de produção (estim.) | Fecha a #277? |
| -- | ----- | ----- | ------ | --------------------------- | ------------- |
| A (parte 1/2) | 1–2 | T1–T4 | `feature/277-vinculo-checklist-api` | ~160 | Não (`Parte de #277`) |
| B (parte 2/2) | 3–5 | T5–T9 | `feature/277-vinculo-checklist-api-escrita` | ~215 | Sim (`gh issue close 277` após o merge) |

Checkpoint do PR B: depois de T6, se o diff de produção contra `origin/epic/31-modulo-ibc` passar de ~230 linhas, mover T7–T8 para um PR C.

---

## Execution Plan

Cada fase é uma fatia pequena e demoável. Fases rodam em ordem; a primeira task de cada fase começa quando a fase anterior termina.

### Phase 1: Fundação — tabela de vínculo

```
T1 → T2
```

### Phase 2: Leitura — GET /api/ibc/:id/checklists

```
T3 → T4
```

### Phase 3: Vincular — POST /api/ibc/:id/checklists

```
T5 → T6
```

### Phase 4: Desvincular — DELETE /api/ibc/:id/checklists/:checklistModeloId

```
T7 → T8
```

### Phase 5: Documentação de domínio

```
T9
```

---

## Task Breakdown

### T1: Modelo `IbcChecklistVinculo` + migration

**What**: Model Prisma `IbcChecklistVinculo` (`id`, `ibcId` → `Ibc`, `checklistModeloId` → `ChecklistModelo`, `vinculadoPorId` → `User` Restrict, `vinculadoEm @default(now())`, `@@unique([ibcId, checklistModeloId])`, `@@index([checklistModeloId])`) espelhado em `schema.dev.prisma`, com migration aditiva nova (timestamp novo, não reaproveitar `20261007100000`).
**Where**: `backend/prisma/schema.prisma`
**Depends on**: None
**Reuses**: relações de `CargaDespacho.fechadoPor`
**Requirement**: IBCVINC-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Model nos dois schemas e `migration.sql` aditiva (sem tocar tabelas da Vistoria)
- [x] `npx prisma validate` ok e client gerado
- [x] Gate check passes: `cd backend && npm test`

**Tests**: none
**Gate**: quick

**Commit**: `feat(ibc): tabela IbcChecklistVinculo (#277)`

---

### T2: Helper de schema de teste cria a tabela de vínculo

**What**: `ensureIbcChecklistSchema` cria `IbcChecklistVinculo` (+ unique e FKs) com `IF NOT EXISTS`, igual ao `migration.sql` de T1.
**Where**: `backend/test/helpers/ensureIbcChecklistSchema.ts`
**Depends on**: T1
**Reuses**: statements existentes do helper
**Requirement**: IBCVINC-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Suites de integração de checklist existentes continuam verdes
- [x] Gate check passes: `cd backend && npm test && npm run test:integration` (falha pré-existente em `OverviewCustomerSyncPipeline`, sem relação)

**Tests**: none
**Gate**: full

**Commit**: `test(ibc): helper de schema cria IbcChecklistVinculo (#277)`

---

### T3: Use-case `ListIbcChecklistVinculos`

**What**: Tipo `IbcChecklistVinculoDto`, interface `IIbcChecklistVinculoRepository.listByIbc`, e use-case que valida existência do IBC (404 `IBC_NOT_FOUND`, baixado permitido) e retorna os vínculos.
**Where**: `backend/src/features/ibc/useCases/ListIbcChecklistVinculos.use-case.ts`
**Depends on**: None (Phase 1 concluída)
**Reuses**: `IIbcCadastroRepository.findById`, padrão de `ListIbcHistorico.use-case.ts`
**Requirement**: IBCVINC-02

**Tools**:

- MCP: NONE
- Skill: `tdd`

**Done when**:

- [x] Unit: IBC inexistente → 404; IBC baixado → lista; lista vazia → `[]`
- [x] Gate check passes: `cd backend && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(ibc): use-case de listagem de checklists vinculados (#277)`

---

### T4: GET `/api/ibc/:id/checklists` (repository + controller + rota)

**What**: `IbcChecklistVinculoRepository.listByIbc` (join com checklist e autor, ordenado por nome), método `listVinculos` no `IbcChecklistController`, rota com `readAuth`, guarda de UUID inválido → 404.
**Where**: `backend/src/features/ibc/repositories/IbcChecklistVinculoRepository.ts`
**Depends on**: T3
**Reuses**: `IbcChecklistRepository`, `respondAppError`, `readAuth` em `IbcRoute.ts`
**Requirement**: IBCVINC-02, IBCVINC-06

**Tools**:

- MCP: NONE
- Skill: `tdd`

**Done when**:

- [x] Integração: ACs 1–4 de "Listar" (ordenação por nome, `ativo: false` listado, 404, `[]`)
- [x] Unit de rotas: 403 para papel sem leitura
- [x] Gate check passes: `cd backend && npm test && npm run test:integration`

**Tests**: integration
**Gate**: full

**Commit**: `feat(ibc): GET /api/ibc/:id/checklists (#277)`

---

### T5: Use-case `VincularIbcChecklist`

**What**: Valida IBC (404 se inexistente/baixado), checklist (404 inexistente, 422 VISTORIA, 422 inativo), duplicado (409) e cria o vínculo com autor; traduz violação de unique do repositório em 409.
**Where**: `backend/src/features/ibc/useCases/VincularIbcChecklist.use-case.ts`
**Depends on**: None (Phase 2 concluída)
**Reuses**: `assertCanManageIbcChecklists`, `AppError`
**Requirement**: IBCVINC-03, IBCVINC-05

**Tools**:

- MCP: NONE
- Skill: `tdd`

**Done when**:

- [x] Unit 1:1 com ACs 1–7 de "Vincular" (inclui corrida → 409)
- [x] Use-case não chama nenhuma escrita no IBC (aptidão intocada)
- [x] Gate check passes: `cd backend && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(ibc): use-case de vínculo de checklist no IBC (#277)`

---

### T6: POST `/api/ibc/:id/checklists` (repository + schema Zod + controller + rota)

**What**: `findChecklistTipo` (sem filtro de tipo, para distinguir VISTORIA), `create` que sinaliza P2002, schema Zod `{ checklistModeloId: uuid }`, controller `vincular` (201) e rota `writeAuth`.
**Where**: `backend/src/features/ibc/http/controllers/IbcChecklistController.ts`
**Depends on**: T5
**Reuses**: `IbcChecklistHttpSchemas`, `invalidBody`, `writeAuth`
**Requirement**: IBCVINC-03, IBCVINC-05, IBCVINC-06

**Tools**:

- MCP: NONE
- Skill: `tdd`

**Done when**:

- [x] Integração: vincular feliz (201 + GET), VISTORIA 422, inativo 422, inexistente 404, duplicado 409, corpo inválido 400, IBC baixado 404
- [x] Integração: `aptidao`/`motivoInaptidao`/`primeiraInspecaoEm` iguais antes e depois
- [x] Unit de rotas: 403 para LOGISTICA/GERENTE_DPTO/VENDAS
- [x] Gate check passes: `cd backend && npm test && npm run test:integration`

**Tests**: integration
**Gate**: full

**Commit**: `feat(ibc): POST /api/ibc/:id/checklists (#277)`

---

### T7: Use-case `DesvincularIbcChecklist`

**What**: Valida IBC (404 se inexistente/baixado), remove o vínculo; 404 `IBC_CHECKLIST_VINCULO_NOT_FOUND` se não houver; permite checklist inativo.
**Where**: `backend/src/features/ibc/useCases/DesvincularIbcChecklist.use-case.ts`
**Depends on**: None (Phase 3 concluída)
**Reuses**: guarda de IBC de T5
**Requirement**: IBCVINC-04, IBCVINC-05

**Tools**:

- MCP: NONE
- Skill: `tdd`

**Done when**:

- [x] Unit 1:1 com ACs 1–4 de "Desvincular"
- [x] Gate check passes: `cd backend && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(ibc): use-case de desvínculo de checklist do IBC (#277)`

---

### T8: DELETE `/api/ibc/:id/checklists/:checklistModeloId` (repository + controller + rota)

**What**: `deleteByPar` no repositório (retorna se removeu), controller `desvincular` (204), rota `writeAuth`.
**Where**: `backend/src/features/ibc/http/routes/IbcRoute.ts`
**Depends on**: T7
**Reuses**: repositório de T4/T6
**Requirement**: IBCVINC-04, IBCVINC-05, IBCVINC-06

**Tools**:

- MCP: NONE
- Skill: `tdd`

**Done when**:

- [x] Integração: vincular → desvincular (204) → GET `[]`; inexistente 404; checklist inativo desvinculável; revincular grava novo autor/data
- [x] Integração: aptidão igual antes e depois
- [x] Unit de rotas: 403 para papéis sem escrita
- [x] Gate check passes: `cd backend && npm test && npm run test:integration` (falha pré-existente em `OverviewCustomerSyncPipeline`, sem relação)

**Tests**: integration
**Gate**: full

**Commit**: `feat(ibc): DELETE /api/ibc/:id/checklists/:checklistModeloId (#277)`

---

### T9: Documentar o vínculo no `CONTEXT.md`

**What**: Termo **Vínculo de checklist** (rotas, códigos de erro, regra de aptidão inalterada, papéis).
**Where**: `backend/src/features/ibc/CONTEXT.md`
**Depends on**: None (Phase 4 concluída)
**Reuses**: verbete "Checklist de IBC"
**Requirement**: IBCVINC-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Verbete reflete exatamente os códigos/status implementados
- [x] Gate check passes: `cd backend && npm test`

**Tests**: none
**Gate**: quick

**Commit**: `docs(ibc): vínculo de checklist no CONTEXT (#277)`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ------→ T2
Phase 2:  T3 ------→ T4
Phase 3:  T5 ------→ T6
Phase 4:  T7 ------→ T8
Phase 5:  T9
```

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 model (2 schemas espelhados + 1 migration) | ⚠️ OK — mudança de schema coesa |
| T2 | 1 helper | ✅ |
| T3 | 1 use-case (+ tipo e interface) | ✅ |
| T4 | 1 endpoint (repo + controller + rota) | ⚠️ OK — fatia vertical testável só por HTTP |
| T5 | 1 use-case | ✅ |
| T6 | 1 endpoint | ⚠️ OK — idem T4 |
| T7 | 1 use-case | ✅ |
| T8 | 1 endpoint | ⚠️ OK — idem T4 |
| T9 | 1 doc | ✅ |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da Phase 1 | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | None (Phase 1) | início da Phase 2 | ✅ |
| T4 | T3 | T3 → T4 | ✅ |
| T5 | None (Phase 2) | início da Phase 3 | ✅ |
| T6 | T5 | T5 → T6 | ✅ |
| T7 | None (Phase 3) | início da Phase 4 | ✅ |
| T8 | T7 | T7 → T8 | ✅ |
| T9 | None (Phase 4) | Phase 5 | ✅ |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Prisma schema / migration | none | none | ✅ |
| T2 | Test helper | none | none | ✅ |
| T3 | Use-case | unit | unit | ✅ |
| T4 | Repository + Controller + Route | integration (+ unit auth) | integration | ✅ |
| T5 | Use-case | unit | unit | ✅ |
| T6 | Repository + Schema + Controller + Route | integration (+ unit auth) | integration | ✅ |
| T7 | Use-case | unit | unit | ✅ |
| T8 | Repository + Controller + Route | integration (+ unit auth) | integration | ✅ |
| T9 | Docs | none | none | ✅ |
