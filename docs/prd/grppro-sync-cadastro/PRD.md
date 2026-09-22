# PRD — Grupos de produto (`grppro`): sync + cadastro

**Produto:** WorkaPool  
**Status:** especificação aprovada (grilling 2026-09-18)  
**Audiência:** implementação (Cursor) / revisão técnica  

---

## Problem Statement

O mapa de grupos de produto (`poolbi.dbo.grppro`) vive no ERP e hoje só é lido em JOINs pontuais (ranking, estoque, order-loss). Não há espelho confiável no Postgres, nem forma operacional de **cadastrar** novos vínculos `CODPRO` → grupo existente sem ir ao ERP manualmente, nem visibilidade de sync dedicada.

Gestores precisam:

1. Ver todos os grupos e seus produtos mapeados.
2. Vincular um produto ERP a um grupo **já existente** com validação e feedback claro.
3. Manter o Postgres alinhado ao ERP via job noturno e sync sob demanda após cada cadastro.

---

## Solution

Entregar um bounded context **Grupos de Produto** com:

- **Read/write no ERP** para cadastro (`INSERT` em `grppro` — somente adicionar `CODPRO` a `CODGRP`/`DESGRP` existentes).
- **Espelho Postgres** (`produto_grupo_map`) preenchido por pipeline **`GrpProSync`** (full refresh via **staging + swap atômico**, idempotente).
- **Tela ADMIN** de listagem + modal de cadastro (`/grupos-produto/cadastro`).
- **Sub-aba** na tela de sync existente (`/overview/sync`) para operar/monitorar o job `GrpProSync`, **mesmo padrão visual** do Overview Sync Control Center ([DESIGN.md](../../../DESIGN.md) + layout de `OverviewSyncAdminView`).

A feature consumidora **análise 5+5 por grupo** fica **fora deste PRD** (fase futura).

---

## User Stories

1. As an **ADMIN**, I want to see all product groups and their mapped `CODPRO`s on one screen, so that I understand the current map without querying the ERP.
2. As an **ADMIN**, I want to open a **Cadastrar** modal to link a product to an existing group, so that I do not need ERP access for routine mappings.
3. As an **ADMIN**, I want to pick a group by **name** (`DESGRP`) from a list, so that I do not type group descriptions manually.
4. As an **ADMIN**, I want to type a `CODPRO` and click **Buscar**, so that the system validates the product before I save.
5. As an **ADMIN**, I want a clear **Produto não encontrado** message when the code is invalid, so that I do not save bad data.
6. As an **ADMIN**, I want a clear **Produto já possui grupo cadastrado** message when `CODPRO` is already mapped, so that I respect the one-product-one-group rule.
7. As an **ADMIN**, I want **Salvar** disabled until group is selected and product is validated, so that I cannot submit incomplete forms.
8. As an **ADMIN**, I want a success toast and a cleared modal after save, so that I can register the next link quickly.
9. As an **ADMIN**, I want the listing to **reload automatically** after a successful save, so that I see the new vínculo immediately.
10. As an **ADMIN**, I want cadastro to write to the ERP and trigger sync, so that Postgres stays consistent (or I see a partial-success message if sync fails).
11. As an **ADMIN**, I want a **GrpProSync** panel on the existing sync admin page (sub-tab), so that I operate nightly and manual sync in one place.
12. As an **ADMIN**, I want to see last sync time, row count, and status for `GrpProSync`, so that I know the mirror is healthy.
13. As an **ADMIN**, I want to manually trigger `GrpProSync`, so that I can recover without waiting for the nightly job.
14. As the **system**, I want a nightly `GrpProSync` job, so that the Postgres mirror stays aligned even without daytime cadastro.
15. As a **developer**, I want vertical slices in order **1 → 2 → 3 → 4** (mirror + sync core → sync admin UI → cadastro API → cadastro UI), so that each increment is shippable and sync is operável antes do cadastro.

---

## Decisions Locked (grilling)

| Tópico | Decisão |
|--------|---------|
| Modos de cadastro | **Somente** vincular `CODPRO` → grupo existente |
| Grupo novo | Criado **no ERP**, fora do WorkaPool |
| Unicidade | Apenas **`CODPRO`** é único (1 produto → 1 grupo) |
| `CODGRP` / `DESGRP` | Podem repetir entre linhas; regra rígida só em `CODPRO` |
| Validação produto | `EXISTS` em `e210est` com `codemp = 1`; **saldo irrelevante** |
| Entrada `CODPRO` | `trim` + **uppercase** antes de buscar/salvar |
| Busca produto | Botão **Buscar** (não debounce) |
| Feedback busca ok | Texto verde **Produto válido** (sem exibir saldo) |
| Select grupo | Lista por **`DESGRP`**; valor interno **`CODGRP`**; ref visível **só** se nome repetir |
| Listagem página | Cards empilhados — um card por grupo, `CODPRO`s A→Z dentro |
| Ordem grupos | `DESGRP` A→Z |
| Fonte listagem/cadastro | **Live SQL Server** (`grppro`) na leitura imediata |
| Formulário | Modal via botão **Cadastrar** (Dialog, padrão `NovaCargaModal`) |
| Botão submit modal | **Salvar** |
| Pós-save | Toast + limpar modal + re-fetch listagem |
| Permissão | **ADMIN only** (API + UI) |
| Sync UI | Pipeline **separado** + **sub-aba** em `/overview/sync` |
| Sync monitoramento | Painel **simples** (último sync, linhas, status, executar) com **mesmo design** da view Overview Sync |
| Análise 5+5 | **Fora de escopo** deste PRD |

### Mensagens de erro (copy fixo)

| Situação | Mensagem |
|----------|----------|
| Produto inexistente | `Produto não encontrado.` |
| Produto já mapeado | `Produto já possui grupo cadastrado.` |
| Grupo não selecionado | `Selecione um grupo.` |
| Falha INSERT ERP | `Não foi possível cadastrar o vínculo. Tente novamente.` |
| INSERT ok, sync falhou | `Vínculo gravado no ERP. Sincronização pendente — tente sync manual.` |

---

## Implementation Decisions

### Bounded context

- Novo contexto: **Grupos de Produto** (`grupos-produto` / `grppro`).
- Feature folder vertical slice: `backend/src/features/grppro/` (ou `gruposProduto/`), espelhando Order Loss / Overview Customer.
- **Não** estender controllers legados na raiz; respeitar layer boundaries (controller → use-case → repository).
- SQL Server writes seguem padrão `CargoRepository`: pool + `.input()` parametrizado + checagem de `rowsAffected` + `AppError`.

### Fonte de verdade

| Camada | Papel |
|--------|--------|
| SQL Server `poolbi.dbo.grppro` | **System of record** para o mapa |
| Postgres `produto_grupo_map` | **Read model** espelho (sync, uso futuro na análise por grupo) |
| `e210est` | Validação de existência de produto no cadastro (live read) |

### Modelo ERP (`grppro`)

| Coluna | Descrição |
|--------|-----------|
| `CODGRP` | Código grupo (`G` + 3 dígitos) |
| `DESGRP` | Nome de exibição |
| `CODPRO` | Código bruto do produto |

Cardinalidade: 1 grupo → N produtos (N linhas); 1 `CODPRO` → no máximo 1 grupo.

### Postgres — `produto_grupo_map`

| Coluna | Origem | Notas |
|--------|--------|--------|
| `grupo_codigo` | `CODGRP` | |
| `grupo_descricao` | `DESGRP` | |
| `produto_codigo` | `CODPRO` | |
| `synced_at` | — | Timestamp da carga |

Constraints:

- `UNIQUE (produto_codigo)`
- Índice em `grupo_codigo`

Estratégia de sync: **full refresh** por execução via **staging + swap atômico** (único caminho oficial — ver abaixo). Job **não** recalcula pedidos.

### Pipeline `GrpProSync`

- **Scheduler:** cron default **`0 3 * * *`** (mesma janela do Overview Customer; configurável via env se necessário).
- **Núcleo idempotente** reutilizado pelo sync sob demanda pós-cadastro.
- **Independente** do pipeline Overview Customer (não é step do overview).
- **Caminho oficial de carga (staging + swap atômico):**
  1. Truncar / recriar tabela staging (`produto_grupo_map_staging` ou equivalente).
  2. Bulk insert de todo `grppro` lido do ERP na staging.
  3. Em transação Postgres: swap atômico staging ↔ produção (`produto_grupo_map`).
  4. Se qualquer passo falhar **antes** do swap: espelho publicado permanece intacto.
- **Não implementar** upsert linha-a-linha (`ON CONFLICT`) no job — ver SQL Reference (referência descartável).
- Observabilidade mínima: linhas syncadas, duração, sucesso/falha, mensagem de erro.

### Constantes de implementação (fechadas)

| Item | Valor |
|------|--------|
| Cron default | `0 3 * * *` |
| `DESGRP` divergente no mesmo `CODGRP` | Canônico = **`TOP 1`** na leitura (como SQL 9.8) |
| Tamanhos de coluna ERP (`CODGRP`, `DESGRP`, `CODPRO`) | **Medir no ERP no Slice 1** e tipar `.input()` mssql de acordo |

### Cadastro — fluxo backend

1. Validar input (`grupoCodigo`, `produtoCodigo` normalizado).
2. Verificar grupo existe em `grppro` (`CODGRP`).
3. Verificar `CODPRO` não mapeado.
4. `INSERT` via SQL 9.8 (adicionar produto a grupo existente — herda `DESGRP`).
5. Commit ERP.
6. Executar `GrpProSync` (sob demanda).
7. Responder `201` com códigos + flag `synced: true/false`.

**Não implementar** SQL 9.7 (grupo novo) neste PRD.

### Validação de produto — SQL Server

Existência (substitui consulta com `SUM` — evita falso positivo com saldo 0):

```sql
SELECT CASE
  WHEN EXISTS (
    SELECT 1
    FROM e210est est
    WHERE est.codpro = @codPro
      AND est.codemp = 1
  ) THEN CAST(1 AS bit)
  ELSE CAST(0 AS bit)
END AS existe;
```

Checagem de mapeamento existente:

```sql
SELECT TOP 1 CODGRP, DESGRP
FROM poolbi.dbo.grppro
WHERE CODPRO = @codPro;
```

Ordem na API de validação: (1) normalizar código (`trim` + `uppercase`) → (2) exists `e210est` → se não, `Produto não encontrado` → (3) se já em `grppro`, `Produto já possui grupo cadastrado` → (4) ok → `{ valid: true }`.

A normalização é **obrigatória no backend** (autoritativa); frontend pode espelhar por UX, mas ACs exigem comportamento server-side.

### Listagem agregada — SQL Server

```sql
SELECT
  CODGRP,
  DESGRP,
  CODPRO
FROM poolbi.dbo.grppro
ORDER BY DESGRP, CODGRP, CODPRO;
```

Backend agrega em estrutura:

```json
[
  {
    "grupoCodigo": "G001",
    "grupoDescricao": "Linha X",
    "produtos": ["ABC123", "DEF456"]
  }
]
```

Grupos ordenados por `DESGRP` A→Z; produtos A→Z dentro de cada card.

### Grupos para select — SQL Server

```sql
SELECT DISTINCT CODGRP, DESGRP
FROM poolbi.dbo.grppro
ORDER BY DESGRP, CODGRP;
```

UI: label = `DESGRP`; se `DESGRP` duplicado na lista, acrescentar ref ` (G00N)` (ex.: `Linha X (G003)`). Se único, label = só `DESGRP`.

---

## API Contract

Base: `/api`. Todas as rotas abaixo exigem auth **ADMIN**.

### Cadastro e consulta (`/api/grupos-produto`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/grupos-produto/mapeamentos` | Listagem agregada (live ERP) |
| `GET` | `/grupos-produto/grupos` | Opções do select (`CODGRP` + `DESGRP`) |
| `GET` | `/grupos-produto/produtos/:codPro/validar` | Valida existência + não mapeado |
| `POST` | `/grupos-produto/mapeamentos` | Cria vínculo (INSERT ERP + sync) |

**POST body:**

```json
{
  "grupoCodigo": "G001",
  "produtoCodigo": "ABC123"
}
```

**POST response `201`:**

```json
{
  "grupoCodigo": "G001",
  "grupoDescricao": "Linha X",
  "produtoCodigo": "ABC123",
  "synced": true
}
```

**Validar response `200`:**

```json
{ "valid": true }
```

**Erros:** `404` produto não encontrado; `409` produto já mapeado; `400` input inválido; `404` grupo inexistente no POST.

### Sync admin (`/api/grppro/sync`)

Namespace **paralelo** ao Overview (`/api/overview/sync`), consumido pela mesma página com sub-abas.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/grppro/sync/status` | Último sync ok, `lastSyncedAt`, `rowCount`, `activeRunId?` |
| `GET` | `/grppro/sync/runs` | Histórico recente de runs (lista simples) |
| `POST` | `/grppro/sync/runs` | Dispara sync manual |

**Status response (exemplo):**

```json
{
  "lastSuccessfulSyncAt": "2026-09-18T06:12:00.000Z",
  "lastRowCount": 842,
  "activeRunId": null,
  "lastError": null
}
```

**Run record (exemplo):**

```json
{
  "id": "uuid",
  "status": "SUCCEEDED",
  "startedAt": "...",
  "finishedAt": "...",
  "rowCount": 842,
  "error": null
}
```

Persistência de runs: tabela dedicada (`grppro_sync_run`) ou reutilizar padrão mínimo análogo ao overview — **preferir tabela própria** (job atômico, sem steps).

---

## UI Specification

Referências obrigatórias: [DESIGN.md](../../../DESIGN.md), componentes shadcn (`Card`, `Dialog`, `Button`, `Input`, `Select`, `Badge`, `Sonner` toast), layout `DefaultLayout`.

### Navegação

| Item | Valor |
|------|--------|
| Rota | `/grupos-produto/cadastro` |
| Navbar label | **Grupos de produto** |
| Roles | `ADMIN` only |

### Página principal — listagem

- **Header:** título `Grupos de produto` + botão primário **Cadastrar** (abre modal).
- **Corpo:** cards empilhados (`space-y` do design system).
  - Card header: `DESGRP` (+ `CODGRP` em texto secundário/muted se útil).
  - Card content: lista de `CODPRO` (mono/spaced), ordenados A→Z.
- **Empty state:** `Nenhum vínculo cadastrado.`
- **Loading:** spinner ou skeleton nos cards.
- **Erro de carga:** mensagem destrutiva + retry.

### Modal — Cadastrar vínculo

Componente Dialog (padrão `NovaCargaModal`):

| Campo | Tipo | Comportamento |
|-------|------|---------------|
| Grupo | Select | Opções de `GET /grupos-produto/grupos` |
| Código produto | Input text | Server aplica `trim` + `uppercase`; client pode espelhar |
| — | Button **Buscar** | Chama validar |
| Feedback | Texto inline | Verde `Produto válido` / vermelho mensagens Q12 |
| Footer | **Cancelar** \| **Salvar** | Salvar disabled até grupo + `valid: true` |

Fluxo: selecionar grupo → digitar `CODPRO` → **Buscar** → **Salvar** → toast sucesso → fechar/limpar → listagem refetch.

### Sync admin — sub-aba em `/overview/sync`

Estender `OverviewSyncAdminView` com **tabs** (ou equivalente acessível):

| Aba | Conteúdo |
|-----|------------|
| **Overview Customer** | Comportamento atual (sem regressão) |
| **Grupos de produto** | Painel GrpProSync |

A aba **Grupos de produto** deve reutilizar o **mesmo padrão visual** do Overview Sync Control Center:

- Card hero com badge `Admin Console`, título, descrição, health label.
- Métricas em grid de cards (ex.: último sync válido, linhas syncadas, runs com falha, run ativo).
- Botões **Atualizar sinais** + **Executar sincronização**.
- Seção de eventos recentes / histórico de runs (versão **simples** — sem steps retry como o overview; runs atômicos).

> **Requisito explícito (grilling):** manter paridade de **design** com a view de sync do Customer Overview; conteúdo operacional do grppro permanece simples (job atômico).

---

## Frontend Architecture

- Feature folder: `frontend/src/features/grppro/` (ou `gruposProduto/`).
- **Sem HTTP em components** — hooks + services (`useGruposProdutoMapeamentos`, `useValidarProduto`, `useSalvarMapeamento`).
- Service layer encapsula `/api/grupos-produto/*`.
- Sync sub-aba: hooks `useGrpproSyncStatus`, `useGrpproSyncRuns`, `useStartGrpproSync` espelhando `useOverviewSyncAdmin`.

---

## Backend Architecture

```
features/grppro/
├── http/           # routes, controllers
├── useCases/
│   ├── ListMapeamentosUseCase
│   ├── ListGruposUseCase
│   ├── ValidarProdutoUseCase
│   ├── CreateMapeamentoUseCase
│   └── (sync) RunGrpproSyncUseCase
├── repositories/
│   ├── GrpproSeniorRepository    # read/write grppro + e210est
│   └── ProdutoGrupoMapRepository # postgres mirror
├── sync/
│   ├── GrpProSyncPipeline
│   └── GrpproSyncStore
└── schemas/        # zod
```

Scheduler: `backend/src/schedulers/grpproSync/` (espelhar `overviewCustomerSync`).

---

## SQL Reference (ERP)

### Insert — adicionar produto a grupo existente (9.8)

Usar transação com lock e erros tipados conforme contrato técnico (`CODPRO ja possui grupo`, `CODGRP inexistente`).

### Sync — leitura completa (9.1)

```sql
SELECT CODGRP, DESGRP, CODPRO
FROM poolbi.dbo.grppro
ORDER BY CODGRP, CODPRO;
```

### Postgres — carga do espelho (oficial: staging + swap)

Implementar no `GrpProSyncPipeline` — **não** usar upsert linha-a-linha.

1. `TRUNCATE produto_grupo_map_staging` (ou `DELETE` full).
2. Bulk insert na staging a partir da leitura 9.1.
3. Transação: rename/swap atômico staging ↔ `produto_grupo_map`.

### Postgres upsert (referência descartável — **não implementar**)

> Exemplo do contrato original. **Não usar** no job `GrpProSync`.

```sql
-- DESCARTÁVEL — apenas referência histórica do contrato
INSERT INTO produto_grupo_map (grupo_codigo, grupo_descricao, produto_codigo, synced_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (produto_codigo) DO UPDATE SET
  grupo_codigo = EXCLUDED.grupo_codigo,
  grupo_descricao = EXCLUDED.grupo_descricao,
  synced_at = NOW();
```

---

## Non-Functional Requirements

| Área | Requisito |
|------|-----------|
| Performance | Índices em `produto_grupo_map(grupo_codigo)`, `produto_grupo_map(produto_codigo)` |
| Idempotência | Reexecutar `GrpProSync` repete staging + swap; espelho publicado reflete paridade com ERP |
| Concorrência | INSERT ERP usa transação (SQL 9.8); sync serializado se run ativo (409) |
| Segurança | ADMIN only em cadastro e sync |
| Observabilidade | Log linhas syncadas, falhas ERP, falhas sync pós-insert |
| Portas dev | Respeitar regra imutável: backend `:3001`, front `:5858`, Postgres `:5435` |

---

## Acceptance Criteria

### Sync

- [ ] **GRP-SYNC-01** Job noturno replica `grppro` → `produto_grupo_map` com paridade de linhas.
- [ ] **GRP-SYNC-02** Sync manual via API + botão na sub-aba dispara o mesmo núcleo.
- [ ] **GRP-SYNC-03** Falha de sync não corrompe espelho publicado (swap atômico).
- [ ] **GRP-SYNC-04** Sub-aba GrpProSync segue design do Overview Sync Control Center.

### Cadastro API

- [ ] **GRP-API-01** `POST /mapeamentos` insere no ERP e retorna `201`.
- [ ] **GRP-API-02** `CODPRO` duplicado retorna `409` com mensagem acordada.
- [ ] **GRP-API-03** Grupo inexistente retorna `404`.
- [ ] **GRP-API-04** Produto inexistente em `e210est` retorna `404` na validação.
- [ ] **GRP-API-05** INSERT ok + sync falhou retorna sucesso parcial (`synced: false`) + mensagem acordada.
- [ ] **GRP-API-06** Rotas rejeitam non-ADMIN com `403`.
- [ ] **GRP-API-07** `GET .../validar` e `POST /mapeamentos` aplicam `trim` + `uppercase` em `produtoCodigo` antes de qualquer query ERP.

### UI cadastro

- [ ] **GRP-UI-01** Página lista grupos em cards com produtos A→Z.
- [ ] **GRP-UI-02** Modal Cadastrar: select grupo + input + Buscar + Salvar.
- [ ] **GRP-UI-03** Salvar disabled até validação ok.
- [ ] **GRP-UI-04** Mensagens de erro exatas (tabela grilling).
- [ ] **GRP-UI-05** Pós-save: toast + modal limpo + listagem atualizada.
- [ ] **GRP-UI-06** Empty state quando não há vínculos.
- [ ] **GRP-UI-07** Item navbar visível só para ADMIN.
- [ ] **GRP-UI-08** Select de grupo: label = `DESGRP`; se `DESGRP` repetido, exibir `DESGRP (CODGRP)` (ex.: `Linha X (G003)`).

---

## Delivery Slices (order)

1. **Slice 1 — Mirror + sync core**  
   Prisma migration `produto_grupo_map` + staging + `grppro_sync_run` + `GrpProSyncPipeline` (staging + swap atômico) + scheduler (`0 3 * * *`).  
   **Tarefa Slice 1:** medir tamanhos reais de `CODGRP`, `DESGRP`, `CODPRO` no ERP e documentar nos tipos mssql.

2. **Slice 2 — Sync admin API + sub-aba**  
   API `/api/grppro/sync/*` + extensão UI `/overview/sync` com abas + paridade visual Overview.

3. **Slice 3 — Cadastro backend**  
   GET listagens, GET validar, POST mapeamento (INSERT 9.8 + sync sob demanda).  
   Inclui **GRP-API-07** (`trim` + `uppercase`).

4. **Slice 4 — Cadastro frontend**  
   `/grupos-produto/cadastro` + modal + navbar link.  
   Inclui **GRP-UI-08** (label select com ref ` (G00N)` quando `DESGRP` duplicado).

---

## Out of Scope

- Análise 5+5 por grupo na tela do cliente
- `GET /clientes/:id/grupos-produto` (seleção por cliente)
- Cadastro de grupo novo (`novo_grupo` / SQL 9.7)
- Update `DESGRP` (SQL 9.9) e delete/desvínculo
- Consulta live ao ERP na abertura de telas de análise futura
- Dropdown/autocomplete de produtos (busca é por digitação + Buscar)
- Exibir saldo de estoque na UI

---

## Open Items for Implementation (repo-specific)

- Componente Tabs: adicionar shadcn `tabs` se ainda não existir no projeto (Slice 2).
- Impacto futuro em `/api/produtos` (`HAVING COUNT(*) > 1`) — **não alterar neste PRD**; revisitar na fase análise por grupo.

---

## Traceability

| ID | Story / criterion |
|----|-------------------|
| GRP-SYNC-01..04 | Stories 11–14, sync acceptance |
| GRP-API-01..07 | Stories 4–6, 10, API contract, normalização CODPRO |
| GRP-UI-01..08 | Stories 1–3, 7–9, UI spec, select DESGRP duplicado |

---

*Origem: contrato `contrato-grppro-sync-e-analise.md` + grilling session 2026-09-18. Análise 5+5 explicitamente deferida.*
