# OrderLoss - Atualizar Justificativa de Venda Perdida (PUT)

## Problem Statement
Hoje o sistema permite registrar uma justificativa de venda perdida (loss reason) para um pedido, mas não suporta a atualização controlada dessa justificativa quando ela já existe.

Precisamos de uma rota `PUT` para permitir atualização **apenas** quando:
1. Já existe uma justificativa cadastrada para aquele pedido perdido; e
2. A justificativa inicial foi feita nos **últimos 7 dias**.

## Goals
- Permitir que o vendedor/gestor corrija a justificativa de perda em uma janela de 7 dias.
- Garantir integridade do domínio: não permitir “inventar” justificativa via update e não permitir updates após expiração.
- Manter rastreabilidade via retorno do `submittedAt` e retorno dos dados atualizados.

## Out of Scope
- Criar justificativa quando não existe (isso deve continuar sendo via endpoint de criação existente).
- Alterações em regras de listagem (`GET`) e filtros.
- Mudanças em modelos/entidades além do necessário para suportar a atualização.

## User Stories

### P1: Atualizar justificativa recente 
**User Story**: Como um usuário autorizado, eu quero atualizar o motivo e a descrição da perda de um pedido, desde que essa justificativa já exista e tenha sido feita nos últimos 7 dias, para corrigir informações sem comprometer o histórico.

**Why P1**: É o caminho principal para manter a qualidade dos dados de justificativa.

**Acceptance Criteria**:
1. WHEN chega um `PUT` com `orderId` que **já possui** uma `LossReason` THEN a API SHALL validar que o `order.status` é `LOST` (pedido perdido).
2. WHEN a `LossReason` existente possui `submittedAt` com idade `<= 7 dias` THEN a API SHALL atualizar `code` e `description`, atualizar `submittedBy` para o responsável atual e retornar a justificativa atualizada mantendo `submittedAt` como a data original de submissão.
3. WHEN o usuário é `VENDAS` THEN a API SHALL permitir apenas se `submittedBy` enviado no body corresponder ao `codRep` do usuário logado (mesma regra já aplicada no registro inicial).

**Independent Test**: Enviar `PUT` para um `orderId` perdido com justificativa criada há poucos dias e verificar que o response retorna a justificativa com `code/description` novos.

---

### P2: Não permitir update sem justificativa
**User Story**: Como um usuário autorizado, eu quero que a atualização falhe quando não houver justificativa previamente registrada, para evitar criação implícita e manter o fluxo correto.

**Why P2**: Previna alterações inconsistentes e preserve a regra “update somente quando já existe”.

**Acceptance Criteria**:
1. WHEN chega um `PUT` para um `orderId` que **não possui** `LossReason` THEN a API SHALL retornar `404` (ou equivalente) indicando que não existe justificativa para atualizar.

**Independent Test**: Enviar `PUT` para um `orderId` perdido sem `lossReason` e validar que o retorno indica ausência de registro para update.

---

### P3: Não permitir update após 7 dias
**User Story**: Como um usuário autorizado, eu quero que a justificativa não possa ser alterada após 7 dias da submissão inicial, para manter integridade temporal do histórico.

**Why P3**: Controla o “tempo de correção” e reduz risco de reescrita de histórico.

**Acceptance Criteria**:
1. WHEN chega um `PUT` para um `orderId` com `LossReason` existente cuja `submittedAt` é **maior que 7 dias** THEN a API SHALL retornar `403` indicando que a justificativa expirou e não pode ser alterada.
2. WHEN chega um `PUT` para a borda exata (`submittedAt` com idade == 7 dias) THEN a API SHALL permitir a atualização (regra considera “<= 7 dias” permitido).

**Independent Test**: Criar uma `LossReason` com `submittedAt` com idade > 7 dias e validar que o endpoint recusa com o erro de expiração.

---

## Edge Cases
- Descrição com espaços: ao salvar, a API SHALL considerar `trim` (remover espaços nas pontas) antes de validar tamanho.
- Borda de expiração: a regra usa `<= 7 dias` como permitido; `> 7 dias` rejeita.
- Tipo do pedido: quando `order.status` não for `LOST`, a API SHALL recusar o update (ex.: `409` ou `400`, conforme padronização do projeto).
- Validações de enum/campos inválidos: a API SHALL retornar `400` quando `code` e/ou payload não respeitarem o contrato.

## API Contract (proposto)

### Endpoint
`PUT /api/orders/loss-reason`

> Observação (assunção): como o backend atual expõe `POST /api/orders/loss-reason` com `orderId` no body, esta spec assume um `PUT` no mesmo caminho e com payload equivalente.

### Request Body
```json
{
  "orderId": "uuid-do-pedido",
  "code": "FREIGHT",
  "description": "Texto com justificativa (min 10 caracteres; trimmed).",
  "submittedBy": "codRep-ou-id-do-responsavel (conforme regras atuais)"
}
```

### Response (sucesso)
```json
{
  "id": "uuid-da-justificativa",
  "orderId": "uuid-do-pedido",
  "code": "FREIGHT",
  "description": "novo texto",
  "submittedBy": "quem submeteu/atualizou",
  "submittedAt": "2026-01-23T10:30:00Z"
}
```

### Erros esperados
- `400`: payload inválido (schema/enum)
- `401`: não autenticado
- `403`: justificativa expirada (> 7 dias) ou sem permissão para `VENDAS` atualizar o próprio `codRep`
- `404`: pedido sem `LossReason` existente para update

## Requirement Traceability
| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| LRSU-01 | P1: Atualizar justificativa recente | Specify | Pending |
| LRSU-02 | P2: Não permitir update sem justificativa | Specify | Pending |
| LRSU-03 | P3: Não permitir update após 7 dias | Specify | Pending |

## Success Criteria
- Para um `orderId` com justificativa existente recente (`submittedAt` <= 7 dias), o update sempre retorna `200/201` com `code/description` atualizados e `submittedAt` preservado (data original).
- Para `orderId` sem justificativa existente, o update sempre é recusado com `404`.
- Para justificativas com `submittedAt` com idade `> 7 dias`, o update sempre é recusado com `403`.

