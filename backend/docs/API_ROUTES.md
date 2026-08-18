# WorkaPool — Documentação de Rotas da API

Documentação das rotas do backend para importação e testes no Postman.

| Item | Valor |
|------|-------|
| **Base URL (dev)** | `http://localhost:3005` |
| **Porta padrão** | `3005` |
| **Swagger UI** | `GET /api/docs` |
| **Health check** | `GET /health` |

---

## Índice

1. [Autenticação e headers](#autenticação-e-headers)
2. [Resumo: rotas protegidas vs públicas](#resumo-rotas-protegidas-vs-públicas)
3. [Sistema](#sistema)
4. [Auth (`/api/auth`)](#auth-apiauth)
5. [Usuários (`/api/users`)](#usuários-apiusers)
6. [Cargas (`/api/cargo`)](#cargas-apicargo)
7. [Pedidos / perda (`/api/orders`)](#pedidos--perda-apiorders)
8. [Metas novas (`/api/goals`)](#metas-novas-apigoals)
9. [Metas legado (`/api/metas`)](#metas-legado-apimetas)
10. [Departamentos (`/api/departamentos`)](#departamentos-apidepartamentos)
11. [Ordem de serviço (`/api/os`)](#ordem-de-serviço-apíos)
12. [Checklist e vistoria](#checklist-e-vistoria)
13. [Fretes e caminhões](#fretes-e-caminhões)
14. [Integração Sapiens / analytics](#integração-sapiens--analytics)

---

## Autenticação e headers

### Obter token

```http
POST /api/auth/login
Content-Type: application/json

{
  "user": "seu_usuario",
  "password": "sua_senha"
}
```

**Resposta 200:**

```json
{
  "token": "<JWT>",
  "mustChangePassword": false
}
```

O JWT expira em **1 hora**. Payload inclui: `id`, `role`, `name`, `codRep`, `mustChangePassword`, `departamentos`, `user`.

### Usar token nas rotas protegidas

```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Roles disponíveis

| Role | Descrição |
|------|-----------|
| `ADMIN` | Administrador |
| `USER` | Usuário genérico |
| `VENDAS` | Vendedor |
| `LOGISTICA` | Logística |
| `ALMOX` | Almoxarifado |
| `GERENTE_DPTO` | Gerente de departamento |

### Erros de autenticação

| Status | Body |
|--------|------|
| 401 | `{ "error": "Token ausente" }` |
| 401 | `{ "error": "Token inválido" }` |
| 401 | `{ "error": "Usuário não autenticado" }` |
| 403 | `{ "error": "Acesso negado" }` |

### Erro de validação (Zod)

| Status | Body |
|--------|------|
| 400 | `{ "message": "Erro de validação", "errors": [...] }` |

---

## Resumo: rotas protegidas vs públicas

| Módulo | Autenticação |
|--------|----------------|
| `/api/auth/register` | JWT + role `ADMIN` |
| `/api/auth/login` | Pública |
| `/api/auth/change-password-first-login` | Pública |
| `/api/cargo/*` | JWT + roles (ver seção) |
| `/api/orders/*` | JWT + roles (ver seção) |
| **Demais rotas** | **Públicas** (sem JWT) |

> **Postman:** requisições sem header `Origin` são aceitas pelo CORS (comportamento intencional para Postman/curl).

---

## Sistema

### `GET /health` — Pública

Verifica se o servidor está no ar.

| | |
|---|---|
| **Body** | — |
| **Query** | — |

**Resposta 200:**

```json
{
  "status": "OK",
  "environment": "development",
  "port": 3005,
  "timestamp": "2026-05-20T12:00:00.000Z"
}
```

---

### `GET /api/docs` — Pública

Interface Swagger (documentação parcial — principalmente usuários).

---

### `GET /uploads/{filename}` — Pública

Arquivos estáticos de upload (imagens de OS). Ex.: `GET /uploads/1716123456789-foto.jpg`

---

## Auth (`/api/auth`)

### `POST /api/auth/login` — Pública

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `user` | string | Sim | min 1 |
| `password` | string | Sim | min 1 |

**Resposta 200:** `{ token, mustChangePassword }`

---

### `POST /api/auth/register` — Autenticada (ADMIN)

| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <token>` |

| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `user` | string | Sim | min 3 caracteres |
| `password` | string | Sim | min 6 caracteres |
| `name` | string | Sim | — |
| `role` | enum | Não | `USER` |
| `codRep` | number | Não | `999` |

**Roles aceitas:** `ADMIN`, `USER`, `VENDAS`, `LOGISTICA`, `ALMOX`, `GERENTE_DPTO`

**Resposta 201:** objeto do usuário criado (sem senha)

---

### `POST /api/auth/change-password-first-login` — Pública

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `user` | string | Sim |
| `newPassword` | string | Sim (min 6) |

**Resposta 200:** mensagem de sucesso

---

## Usuários (`/api/users`)

> Todas as rotas abaixo são **públicas** (sem JWT).

### `GET /api/users`

| Query | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `user` | string | Não | Filtro por login |
| `name` | string | Não | Filtro por nome |
| `role` | enum | Não | Filtro por role |
| `codRep` | number | Não | Código representante |
| `mustChangePassword` | boolean | Não | — |
| `page` | number | Não | Página (default implícito) |
| `pageSize` | number | Não | Máx. 100 |

**Resposta 200:**

```json
{
  "data": [{ "id", "name", "user", "role", "createdAt", "departamentos?" }],
  "pagination": { "page", "pageSize", "total", "totalPages", "hasNextPage", "hasPreviousPage" }
}
```

---

### `GET /api/users/:id`

| Path | Tipo |
|------|------|
| `id` | UUID |

**Resposta 200:** `{ id, name, user, role, codRep, mustChangePassword }`

---

### `GET /api/users/:id/departamentos`

| Path | Tipo |
|------|------|
| `id` | UUID |

**Resposta 200:** array de vínculos usuário-departamento

---

### `PUT /api/users/:id/update`

| Path | Tipo |
|------|------|
| `id` | UUID |

| Body (todos opcionais) | Tipo |
|------------------------|------|
| `name` | string |
| `role` | enum |
| `codRep` | number (positivo) |
| `mustChangePassword` | boolean |

**Resposta 200:** usuário atualizado

---

### `POST /api/users/:id/delete`

| Path | Tipo |
|------|------|
| `id` | UUID |

**Resposta 204:** sem corpo

---

## Cargas (`/api/cargo`)

> **Todas as rotas exigem JWT.**

| Operação | Roles permitidas |
|----------|------------------|
| **Leitura** (GET) | `ADMIN`, `USER`, `VENDAS`, `LOGISTICA`, `ALMOX`, `GERENTE_DPTO` |
| **Escrita** (POST, PUT, PATCH) | `ADMIN`, `LOGISTICA`, `GERENTE_DPTO`, `VENDAS` |

### `POST /api/cargo/`

Cria nova carga.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `destino` | string | Sim | — |
| `pesoMax` | number | Sim | Positivo |
| `previsaoSaida` | string | Sim | Data ISO válida |
| `situacao` | enum | Não | Ver valores abaixo |

**`situacao`:** `ABERTA` | `FECHADA` | `CANCELADA` | `SOLICITADA` | `ENTREGUE`

**Resposta 201:** objeto `CargaResponseDTO`

---

### `POST /api/cargo/close-carga`

Fecha uma carga.

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `codCar` | number | Sim |

**Resposta 200:**

```json
{
  "message": "Carga fechada com sucesso",
  "carga": { ... },
  "pedidosSalvos": 0
}
```

---

### `PATCH /api/cargo/:codCar/situacao`

| Path | Tipo |
|------|------|
| `codCar` | number |

| Body | Tipo | Obrigatório |
|------|------|-------------|
| `situacao` | enum | Sim |

**Resposta 200:** `{ "message": "Situação atualizada com sucesso." }`

---

### `PUT /api/cargo/update-carga/:id`

| Path | Tipo |
|------|------|
| `id` | string (ID interno da carga) |

| Body | Igual a `POST /api/cargo/` |

**Resposta 200:** carga atualizada

---

### `GET /api/cargo/listar-cargas`

| Query | Tipo | Descrição |
|-------|------|-----------|
| `situacao` | string ou array | Filtra por situação (uppercase) |

**Resposta 200:** array de cargas

---

### `PUT /api/cargo/update-pedido/:numPed`

Associa pedido à carga.

| Path | Tipo |
|------|------|
| `numPed` | number/string |

| Body | Tipo | Obrigatório |
|------|------|-------------|
| `codCar` | number | Sim |
| `posCar` | number | Sim |

**Resposta 200:** `{ "message": "Pedido atualizado com sucesso." }`

---

### `GET /api/cargo/pedidos-fechados`

Lista pedidos fechados (todos os vendedores).

| Query | Tipo | Descrição |
|-------|------|-----------|
| `codRep` | number | Opcional — filtra por vendedor |

---

### `GET /api/cargo/pedidos-fechados/:codRep`

Mesmo que acima, com `codRep` no path.

---

### `GET /api/cargo/cargas-fechadas`

| Query | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `page` | number | 1 | Página |
| `pageSize` | number | 100 | Máx. 100 |
| `destino` | string | — | Filtro |
| `previsaoSaida` | string | — | Data ISO |

**Resposta 200:** cargas fechadas com pedidos salvos

---

### `GET /api/cargo/:codCar/pedidos`

| Path | Tipo |
|------|------|
| `codCar` | number |

| Query | Tipo | Descrição |
|-------|------|-----------|
| `codRep` | number | Opcional; `999` = sem filtro |

**Resposta 200:** array de pedidos da carga

---

## Pedidos / perda (`/api/orders`)

> **Todas as rotas exigem JWT.**

| Operação | Roles permitidas |
|----------|------------------|
| Leitura e escrita | `ADMIN`, `GERENTE_DPTO`, `LOGISTICA`, `VENDAS` |

**Comportamento especial:** usuários com role `VENDAS` têm `codRep` forçado pelo JWT em `GET /lost-sapiens` (não podem ver pedidos de outros vendedores).

### Enums

| Campo | Valores |
|-------|---------|
| `status` | `NEGOTIATING`, `LOST`, `WON`, `CANCELLED` |
| `code` (motivo perda) | `FREIGHT`, `PRICE`, `MARGIN`, `STOCK`, `OTHER` |

---

### `GET /api/orders/lost-sapiens`

Pedidos perdidos no Sapiens (`sitped = 5`).

| Query | Tipo | Formato |
|-------|------|---------|
| `page` | number | default 1 |
| `pageSize` | number | default 100, máx. 100 |
| `codRep` | string | Opcional (forçado para VENDAS) |
| `startDate` | string | `DD-MM-YYYY` |
| `endDate` | string | `DD-MM-YYYY` |

**Resposta 200:** lista de pedidos perdidos

---

### `POST /api/orders/`

Cria pedido no banco local.

| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `orderNumber` | number | Sim | — |
| `status` | enum | Não | `NEGOTIATING` |
| `idUser` | UUID | Sim | — |
| `codRep` | string | Sim | — |

**Resposta 201:** `{ id, orderNumber, status, idUser, codRep, createdAt, updatedAt }`

---

### `GET /api/orders/`

| Query | Tipo | Default |
|-------|------|---------|
| `page` | number | 1 |
| `pageSize` | number | 100 |

**Resposta 200:** `{ data, pagination }` com pedidos e motivos de perda

---

### `GET /api/orders/seller/:codRep`

| Path | Tipo | Nota |
|------|------|------|
| `codRep` | string | Path ignorado pelo controller — usa apenas query |

| Query | Igual a `GET /lost-sapiens` |

---

### `GET /api/orders/:id`

| Path | Tipo |
|------|------|
| `id` | UUID |

**Resposta 200:** pedido com produtos e motivo de perda

---

### `PATCH /api/orders/:id/status`

| Path | Tipo |
|------|------|
| `id` | UUID |

| Body | Tipo | Obrigatório |
|------|------|-------------|
| `status` | enum | Sim |

**Resposta 200:** pedido atualizado

---

### `POST /api/orders/loss-reason`

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `orderId` | UUID | Sim | — |
| `code` | enum | Sim | FREIGHT, PRICE, etc. |
| `description` | string | Sim | min 10 caracteres |
| `submittedBy` | string | Sim | Para VENDAS: deve ser o próprio `codRep` |

**Resposta 201:** motivo de perda criado

---

### `PUT /api/orders/loss-reason`

Mesmo body de `POST /loss-reason`. Atualização permitida apenas dentro de janela de 7 dias.

**Resposta 200:** motivo atualizado

---

## Metas novas (`/api/goals`)

> Todas **públicas**.

### `POST /api/goals/`

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `product` | string | Sim |
| `productGoal` | number | Sim |
| `codRep` | number | Sim (min 1) |
| `monthGoal` | number | Sim (1–12) |
| `yearGoal` | number | Sim |
| `averagePrice` | number | Sim (≥ 0) |
| `cod_grp` | string | Não |

**Resposta 201:** meta criada

---

### `GET /api/goals/`

**Resposta 200:** array de todas as metas

---

### `GET /api/goals/:id`

| Path | Tipo |
|------|------|
| `id` | string |

**Resposta 200:** meta única

---

### `DELETE /api/goals/:id`

| Path | Tipo |
|------|------|
| `id` | string |

**Resposta 204**

---

### `GET /api/goals/search/by-product`

| Query | Obrigatório |
|-------|-------------|
| `codRep` | Sim |
| `monthGoal` | Sim |
| `cod_grp` | Sim |

> **Atenção:** esta rota está registrada **depois** de `GET /:id`. O Express pode interpretar `search` como `:id`. Prefira chamar com cuidado ou corrigir ordem no código.

---

### `GET /api/goals/search/by-year`

| Query | Obrigatório |
|-------|-------------|
| `codRep` | Sim |
| `monthGoal` | Sim |
| `yearGoal` | Sim |

> Mesmo problema de ordem de rotas que `search/by-product`.

---

## Metas legado (`/api/metas`)

> Todas **públicas**. API legada (Prisma `metas`), diferente de `/api/goals`.

### `POST /api/metas/`

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `codRep` | number | Sim |
| `mesMeta` | number | Sim |
| `anoMeta` | number | Sim |
| `metas` | array | Sim (não vazio) |

Cada item de `metas[]`:

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `produto` | string | Sim |
| `cod_grp` | string | Sim |
| `metaProduto` | number | Sim |

**Resposta 200:** `{ "message": "Metas salvas com sucesso!" }`

---

### `GET /api/metas/`

| Query | Obrigatório |
|-------|-------------|
| `codRep` | Sim |
| `mesMeta` | Sim |
| `anoMeta` | Sim |

**Resposta 200:** array de registros `metas`

---

## Departamentos (`/api/departamentos`)

> Todas **públicas**.

### `POST /api/departamentos/`

| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `name` | string | Sim | — |
| `recebe_os` | boolean | Não | `false` |

**Resposta 201:** departamento criado

---

### `GET /api/departamentos/`

**Resposta 200:** lista de departamentos

---

### `GET /api/departamentos/:id`

| Path | UUID |

---

### `PUT /api/departamentos/:id`

| Path | UUID |
| Body | `name?`, `recebe_os?` |

---

### `DELETE /api/departamentos/:id`

| Path | UUID |

**Resposta 204**

---

### `GET /api/departamentos/filter/aceita-os`

Departamentos que aceitam ordem de serviço.

> **Atenção:** registrada após `GET /:id` — pode ser capturada como `id=filter`. Testar comportamento real.

---

### `POST /api/departamentos/users/add`

| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `userId` | UUID | Sim | — |
| `departamentoId` | UUID | Sim | — |
| `funcao` | enum | Não | `FUNCIONARIO` |

**`funcao`:** `GERENTE` | `FUNCIONARIO`

---

### `DELETE /api/departamentos/users/remove`

| Body | Tipo | Obrigatório |
|------|------|-------------|
| `userId` | UUID | Sim |
| `departamentoId` | UUID | Sim |

**Resposta 204**

---

### `GET /api/departamentos/:departamentoId/users`

| Path | UUID |

---

### `PUT /api/departamentos/users/function`

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `userId` | UUID | Sim |
| `departamentoId` | UUID | Sim |
| `funcao` | enum | Sim (`GERENTE` ou `FUNCIONARIO`) |

---

### `GET /api/departamentos/:departamentoId/managers`

| Path | UUID |

---

## Ordem de serviço (`/api/os`)

> Todas **públicas**.

### `POST /api/os/`

**Content-Type:** `multipart/form-data`

| Campo | Tipo | Obrigatório | Valores |
|-------|------|-------------|---------|
| `descricao` | string | Sim | — |
| `problema` | string | Sim | — |
| `prioridade` | enum | Sim | `BAIXA`, `MEDIA`, `ALTA` |
| `status` | enum | Não | `ABERTA`, `EM_ANDAMENTO`, `FINALIZADA`, `CANCELADA` |
| `email_solicitante` | string | Não | email válido |
| `id_solicitante` | UUID | Não | — |
| `id_vistoria` | UUID | Não | — |
| `id_departamento` | UUID | Não | — |
| `localizacao` | string | Não | — |
| `imagens` | file[] | Não | campo `imagens` (múltiplos arquivos) |

**Resposta 201:** ordem de serviço criada

---

### `GET /api/os/`

Lista todas as OS.

---

### `GET /api/os/:id`

| Path | UUID |

---

### `PUT /api/os/:id`

| Path | UUID |

| Body (todos opcionais) | Tipo |
|------------------------|------|
| `descricao` | string |
| `problema` | string |
| `status` | enum |
| `prioridade` | enum |
| `data_conclusao` | date |
| `localizacao` | string |
| `imagens` | any |

---

### `DELETE /api/os/:id`

| Path | UUID |

**Resposta 204**

---

## Checklist e vistoria

> Todas **públicas**.

### Itens de checklist — `/api/item-checklist`

| Método | Path | Body |
|--------|------|------|
| `POST` | `/` | `{ "descricao": string }` (min 3) |
| `GET` | `/` | — |
| `GET` | `/:id` | — |
| `PUT` | `/:id` | `{ "descricao": string }` |
| `DELETE` | `/:id` | — |

---

### Modelos de checklist — `/api/checklist-modelo`

| Método | Path | Body |
|--------|------|------|
| `POST` | `/` | `{ "nome": string, "departamento_id?": string, "itens": string[] }` (min 1 item) |
| `GET` | `/` | — |
| `GET` | `/:id` | — |
| `PUT` | `/:id` | `{ "nome": string }` |
| `DELETE` | `/:id` | — |

---

### Vistorias — `/api/vistoria`

| Método | Path | Body / Params |
|--------|------|---------------|
| `POST` | `/` | `{ "data_vistoria": date/ISO, "responsavel_id": UUID, "departamento_id": UUID }` |
| `GET` | `/` | — |
| `GET` | `/:id` | — |
| `GET` | `/departamento/:departamento_id` | — |
| `PUT` | `/:id` | `{ "departamento_id", "data_vistoria", "responsavel_id" }` |
| `DELETE` | `/:id` | — |

> **Atenção:** `GET /departamento/:id` está após `GET /:id` — pode haver conflito de rota.

---

### Checklist de vistoria — `/api/checklist-vistoria`

| Método | Path | Body |
|--------|------|------|
| `POST` | `/` | Ver abaixo |
| `GET` | `/` | — |
| `GET` | `/:id` | — |
| `PUT` | `/:id` | `{ "responsavel_id", "data_vistoria" }` |
| `DELETE` | `/:id` | — |

**Body `POST /`:**

```json
{
  "vistoria_id": "string",
  "checklistModeloId": "string",
  "ordemServicoId": "string | null (opcional)",
  "itens": [
    {
      "checklistItemId": "string",
      "checked": true,
      "observacao": "string | null (opcional)"
    }
  ]
}
```

Mínimo 1 item em `itens`.

---

## Fretes e caminhões

> Todas **públicas**.

### Caminhões — `/api/caminhoes`

#### `POST /api/caminhoes/`

| Campo | Tipo |
|-------|------|
| `modelo` | string |
| `eixos` | number |
| `eixos_carregado` | number |
| `eixos_vazio` | number |
| `pneus` | number |
| `capacidade_kg` | number |
| `consumo_medio_km_l` | number |

**Resposta 201**

#### `GET /api/caminhoes/`

**Resposta 200:** array

---

### Parâmetros globais de frete — `/api/parametrosFretes`

| Método | Path | Body (todos numéricos) |
|--------|------|------------------------|
| `POST` | `/create` | `valor_diesel_s10_sem_icms`, `valor_diesel_s10_com_icms`, `valor_salario_motorista_dia`, `valor_refeicao_motorista_dia`, `valor_ajuda_custo_motorista`, `valor_chapa_descarga`, `valor_desgaste_pneus` |
| `PATCH` | `/` | Mesmos campos (atualiza registro `id: 2`) |
| `GET` | `/` | — (retorna registro `id: 2`) |

---

### Fretes — `/api/fretes`

#### `POST /api/fretes/rota-base`

| Campo | Tipo |
|-------|------|
| `origem` | string |
| `destino` | string |
| `total_km` | number |
| `dias_viagem` | number |

---

#### `POST /api/fretes/caminhao-rota`

| Campo | Tipo |
|-------|------|
| `rota_base_id` | number |
| `caminhao_id` | number |
| `pedagio_ida` | number |
| `pedagio_volta` | number |
| `custo_combustivel` | number |
| `custo_total` | number |
| `salario_motorista_rota` | number |
| `refeicao_motorista_rota` | number |
| `ajuda_custo_motorista_rota` | number |
| `chapa_descarga_rota` | number |
| `desgaste_pneus_rota` | number |

---

#### `POST /api/fretes/solicitacao-rota`

| Campo | Tipo |
|-------|------|
| `peso` | number |
| `origem` | string |
| `destino` | string |
| `status` | string |
| `solicitante_user` | string |

---

#### `GET /api/fretes/rotas`

Lista todas as rotas base.

---

#### `GET /api/fretes/fretes-solicitados`

Solicitações com `status: PENDENTE`.

---

#### `GET /api/fretes/caminhaoRota/:rotaId`

| Path | `rotaId` (number) — filtra por `rota_base_id` |

---

#### `PUT /api/fretes/caminhao-rota`

| Campo | Tipo | Nota |
|-------|------|------|
| `rota_id` | number | ID do registro `caminhaoRota` |
| `caminhao_id` | number | — |
| `pedagio_ida` | number | — |
| `pedagio_volta` | number | — |
| `custo_combustivel` | number | — |
| `custo_total` | number | — |
| `salario_motorista_rota` | number | — |
| `refeicao_motorista_rota` | number | — |
| `ajuda_custo_motorista_rota` | number | — |
| `chapa_descarga_rota` | number | — |
| `desgaste_pneus_rota` | number | — |

---

#### `PUT /api/fretes/solicitacao-rota/:solicitacaoId`

Atualiza status para `FINALIZADO`.

| Path | `solicitacaoId` (number) |

---

## Integração Sapiens / analytics

> Todas **públicas**. Consultam banco SQL Server (Sapiens) salvo indicação contrária.

### `GET /api/teste/`

Testa conexão com SQL Server.

**Resposta 200:** `{ "conectado": true, "resultado": [...] }`  
**Resposta 500:** `{ "conectado": false, "erro": ... }`

---

### `POST /api/faturamento/`

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `codRep` | number | Sim |
| `dataInicio` | string/date | Sim |

**Resposta 200:** dados de faturamento

---

### `POST /api/rankingProdutos/`

| Campo | Tipo | Obrigatório | Padrão |
|-------|------|-------------|--------|
| `codRep` | number | Sim | — |
| `dataInicio` | string/date | Sim | — |
| `top` | number | Não | 10 |

**Resposta 200:** ranking de produtos

---

### `GET /api/produtos/`

Lista produtos do Sapiens.

---

### `GET /api/vendedores/`

Lista vendedores do Sapiens.

---

### `POST /api/clientes-inativos/`

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `dataInicio` | string | Sim |
| `dataFim` | string | Sim |
| `codRep` | number | Sim |
| `diasSCompra` | number | Sim |

**Resposta 200:** clientes inativos

---

### `GET /api/produ tosEstoque/`

> **Atenção:** o path no código contém um espaço (`produ tosEstoque`). Use exatamente:  
> `GET http://localhost:3005/api/produ%20tosEstoque/`

Produtos com estoque ≤ 5 unidades.

---

## Configuração Postman

### Variáveis de ambiente sugeridas

| Variável | Valor exemplo |
|----------|---------------|
| `baseUrl` | `http://localhost:3005` |
| `token` | *(preencher após login)* |

### Fluxo recomendado

1. `POST {{baseUrl}}/api/auth/login` → salvar `token` da resposta
2. Nas pastas **Cargo** e **Orders**, header: `Authorization: Bearer {{token}}`
3. Para `POST /api/auth/register`, mesmo header + usuário ADMIN

### Importação

- **Opção A:** Importar este markdown manualmente criando requests
- **Opção B:** Abrir `{{baseUrl}}/api/docs` e importar OpenAPI (cobertura parcial — usuários)
- **Opção C:** Gerar coleção Postman v2.1 a partir deste documento

### Rotas que exigem autenticação (checklist)

```
POST   /api/auth/register
POST   /api/cargo/*
PATCH  /api/cargo/:codCar/situacao
PUT    /api/cargo/*
GET    /api/cargo/*
POST   /api/orders/*
GET    /api/orders/*
PATCH  /api/orders/:id/status
POST   /api/orders/loss-reason
PUT    /api/orders/loss-reason
```

Todas as demais rotas listadas neste documento são **públicas**.

---

*Gerado a partir do código em `backend/src/app.ts` e routers em `backend/src/features/` e `backend/src/routes/`.*
