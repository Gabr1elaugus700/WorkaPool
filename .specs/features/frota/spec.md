# Frota — Cadastro de caminhões (`Trucks`)

**Status:** Implementado (set/2026)  
**Relacionado:** Epic #236 · `CargaDespacho` · IBC Camada 2 (#31)

## Problem Statement

O fechamento de carga exige `CargaDespacho` com caminhão (`Trucks`) ativo; motorista não é registrado no sistema na v1 (#89). Sem cadastro operacional de caminhões, a logística não consegue cumprir o AC #1 da expedição IBC. O modelo legado `Caminhao` (fretes) permanece no banco, mas está **depreciado** — novos fluxos usam `Trucks`.

## Goals

- [x] Cadastrar e editar caminhões com placa única, capacidade e flag `active`
- [x] Expor CRUD autenticado em `/api/trucks`
- [x] Tela **Frota** para logística gerenciar caminhões
- [x] Listagem de despacho (`/api/cargo/trucks`) retorna apenas caminhões **ativos**
- [x] Fechar carga rejeita caminhão **inativo** (`CARGO_CAMINHAO_INATIVO`)
- [x] Dropdown de fechamento exibe nome + placa

## Out of Scope

| Item | Motivo |
| ---- | ------ |
| Remover modelo/tabela `Caminhao` (fretes) | Depreciação gradual; fora desta fatia |
| Motoristas na tela Frota | Despacho v1 não usa motorista (#89); cadastro permanece em **Usuários** (role `MOTORISTA`) |
| Validação de formato de placa Mercosul | v1: string 1–10 chars, normalizada em uppercase no backend |
| Histórico de viagens por caminhão | Domínio IBC / relatórios futuros |

## Actors

| Papel | Permissão |
| ----- | --------- |
| **LOGISTICA** | CRUD caminhões |
| **ADMIN** | Idem |
| **GERENTE_DPTO** | Idem |
| **ALMOX / VENDAS / MOTORISTA** | Sem acesso à rota `/frota` nem `/api/trucks` |

> **Nota:** Fechar carga (`POST /api/cargo/.../close`) continua permitindo ADMIN e GERENTE_DPTO além de LOGISTICA (comportamento pré-existente do módulo Cargo).

## Modelo `Trucks`

| Campo | Tipo | Regras |
| ----- | ---- | ------ |
| `id` | UUID | PK |
| `name` | string | Obrigatório; rótulo operacional (ex. "Volvo FH") |
| `capacity` | int | Obrigatório; kg; > 0 |
| `plate` | string | Obrigatório; único; uppercase no persist |
| `type` | string? | Opcional (ex. "Cavalo", "Carreta") |
| `axles` | int? | Opcional; > 0 |
| `active` | boolean | Default `true`; inativos não aparecem no despacho |
| `codRep` | int | Default 0; legado |
| `createdAt` | datetime | Auditoria |

### Migração de linhas existentes

Linhas pré-existentes recebem backfill `plate = 'LEGACY-' || id` antes do `NOT NULL`. Operador deve corrigir placas reais via Frota ou API.

## API `/api/trucks`

Todas as rotas exigem JWT + roles `ADMIN | LOGISTICA | GERENTE_DPTO`.

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| GET | `/api/trucks?active=true\|false` | Lista; sem query = todos |
| GET | `/api/trucks/:id` | Detalhe |
| POST | `/api/trucks` | Cria |
| PUT | `/api/trucks/:id` | Atualização parcial |

Erros tipados:

- `TRUCK_NOT_FOUND` (404)
- `TRUCK_PLATE_CONFLICT` (409)

## Integração com Cargo / despacho

1. **`GET /api/cargo/trucks`** — lista `{ id, name, plate, active }` filtrando `active: true` (uso no modal Fechar Carga).
2. **`CloseCargaUseCase`** — após resolver caminhão por id, rejeita se `active === false` com `CARGO_CAMINHAO_INATIVO` (400).
3. **Frontend** — `FecharCargaDespachoFields` exibe `{name} ({plate})` no select.

`GET /api/cargo/motoristas` foi removido: o fechamento envia só o caminhão (#89).

## UI Frota (`/frota`)

- Nav: link **Frota** visível para `ADMIN`, `LOGISTICA`, `GERENTE_DPTO`.
- Rota `/frota`: `PrivateRoute` com `allowedRoles` — demais roles autenticados redirecionam para `/`.
- **Métricas:** caminhões ativos, inativos e em viagem (`GET /api/trucks/stats`).
- **Caminhões:** tabela + dialog criar/editar (`TruckForm`, `TrucksTable`).

## User Stories

### FROTA-01: CRUD de caminhões ⭐

**Acceptance Criteria:**

1. WHEN operador autorizado cadastra caminhão THEN sistema SHALL persistir com placa única normalizada
2. WHEN placa duplicada THEN SHALL retornar `TRUCK_PLATE_CONFLICT` (409)
3. WHEN operador desativa caminhão (`active: false`) THEN SHALL sumir de `/api/cargo/trucks`
4. WHEN logística tenta fechar carga com caminhão inativo THEN SHALL rejeitar com `CARGO_CAMINHAO_INATIVO`

**Independent Test:** Cadastrar caminhão → aparece no fechamento → desativar → some do dropdown → tentar close com id antigo → erro 400.

---

### FROTA-02: Tela Frota ⭐

**Acceptance Criteria:**

1. WHEN LOGISTICA acessa `/frota` THEN SHALL ver métricas e tabela de caminhões
2. WHEN cria/edita caminhão THEN SHALL refletir na listagem sem reload manual da página

---

## Depreciação `Caminhao`

| Estado | Descrição |
| ------ | --------- |
| **Depreciado** | Modelo Prisma `Caminhao` / fluxo fretes |
| **Substituto** | `Trucks` + `CargaDespacho.caminhaoId` → FK `Trucks` |
| **Pendente** | Remoção física de `Caminhao` e telas de fretes legadas |

## Testes

- `backend/test/unit/features/trucks/*`
- `backend/test/unit/features/cargo/useCases/CloseCargaUseCase.test.ts` (caminhão inativo)
