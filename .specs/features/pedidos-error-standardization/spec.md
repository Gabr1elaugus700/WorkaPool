# Pedidos - Padronização de Erros com AppError

> Issue de origem: [#16 - refactor: padronizar erros do domínio pedidos com AppError](https://github.com/Gabr1elaugus700/WorkaPool/issues/16)

## Problem Statement

O domínio `pedidos` ainda trata falhas de busca/validação com `throw new Error(...)` em service, repository e entidade.
Sem `AppError`, o consumidor HTTP não recebe `statusCode`, `code` e `details` semânticos de forma consistente.

Arquivos no escopo: 

- `[backend/src/features/pedidos/services/PedidoService.ts](../../../backend/src/features/pedidos/services/PedidoService.ts)`
- `[backend/src/features/pedidos/repositories/PedidosRepository.ts](../../../backend/src/features/pedidos/repositories/PedidosRepository.ts)`
- `[backend/src/features/pedidos/entities/HistoricoPesoPedido.ts](../../../backend/src/features/pedidos/entities/HistoricoPesoPedido.ts)`

## Goals

- Substituir 100% dos `throw new Error(...)` do escopo por `AppError`.
- Padronizar códigos com prefixo `PEDIDOS_`.
- Alinhar `statusCode` ao consumidor HTTP: `404` para pedido não encontrado e `422` para peso inválido.
- Preservar comportamento funcional de cálculo e histórico de peso.

## Out of Scope

- Mudanças de regra de negócio em carga/pedidos.
- Alterar assinaturas de `IPedidosRepository`.
- Refatorar controllers/rotas fora do escopo da issue.
- Criar middleware global de erro.

## User Stories

### P1: PEDS-01 — Pedido não encontrado com erro semântico

**User Story**: Como consumidor do domínio pedidos, eu quero erro tipado quando um pedido não existe, para responder 404 de forma consistente.

**Acceptance Criteria**:

1. WHEN `getPedidoWeight` não encontra pedido THEN SHALL lançar `AppError` com `statusCode: 404`, `code: "PEDIDOS_NOT_FOUND"`, `details: { numPed, source: "getPedidoWeight" }`.
2. WHEN `getPedidoSituacaoSapiens` não encontra pedido THEN SHALL lançar `AppError` com `statusCode: 404`, `code: "PEDIDOS_NOT_FOUND"`, `details: { numPed, source: "getPedidoSituacaoSapiens" }`.

### P2: PEDS-02 — Peso inválido com erro semântico

**User Story**: Como consumidor da lógica de peso, eu quero erro tipado para peso inválido, para separar inconsistência de dado de erro interno.

**Acceptance Criteria**:

1. WHEN `PedidoService.pesoAtualPedido` recebe peso `null`/`NaN` THEN SHALL lançar `AppError` com `statusCode: 422`, `code: "PEDIDOS_INVALID_WEIGHT"`, `details: { numPed, pesoAtual }`.
2. WHEN `PedidosRepository.createHistoricoPeso` recebe peso `null`/`undefined`/`NaN` THEN SHALL lançar `AppError` com `statusCode: 422`, `code: "PEDIDOS_INVALID_WEIGHT"`, `details: { numPed, peso }`.
3. WHEN `HistoricoPesoPedido.pesoAtual()` encontra peso inválido THEN SHALL lançar `AppError` com `statusCode: 422`, `code: "PEDIDOS_INVALID_WEIGHT"`, `details: { numPed, peso }`.

### P3: PEDS-03 — Contrato alinhado com camada HTTP consumidora

**User Story**: Como controller consumidor (ex.: módulo cargo), eu quero receber `AppError` consistente do domínio pedidos para manter `{ error, code, details }` sem parsing de mensagem.

**Acceptance Criteria**:

1. WHEN ocorrer erro de not found ou invalid weight THEN SHALL ser `AppError` com `message`, `statusCode`, `code`, `details`.
2. WHEN o consumidor HTTP tratar erro de pedidos THEN SHALL conseguir reaproveitar o padrão já usado em controllers com `instanceof AppError`.

## Edge Cases

- `peso = 0` continua válido (não deve virar erro).
- `NaN`, `null` e `undefined` em peso devem resultar em `PEDIDOS_INVALID_WEIGHT`.
- Reuso de `PEDIDOS_INVALID_WEIGHT` em service/repository/entity simplifica tratamento no frontend.

## Catálogo de Erros (escopo da issue)


| Origem                                       | Erro atual                      | Novo erro                                                                           |
| -------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| `PedidoService.pesoAtualPedido`              | `Pedido X possui peso inválido` | `422 PEDIDOS_INVALID_WEIGHT` + `details: { numPed, pesoAtual }`                     |
| `PedidosRepository.getPedidoWeight`          | `Pedido X não encontrado`       | `404 PEDIDOS_NOT_FOUND` + `details: { numPed, source: "getPedidoWeight" }`          |
| `PedidosRepository.getPedidoSituacaoSapiens` | `Pedido X não encontrado`       | `404 PEDIDOS_NOT_FOUND` + `details: { numPed, source: "getPedidoSituacaoSapiens" }` |
| `PedidosRepository.createHistoricoPeso`      | `Peso inválido para pedido X`   | `422 PEDIDOS_INVALID_WEIGHT` + `details: { numPed, peso }`                          |
| `HistoricoPesoPedido.pesoAtual`              | `Peso inválido para pedido X`   | `422 PEDIDOS_INVALID_WEIGHT` + `details: { numPed, peso }`                          |


## Requirement Traceability


| Requirement ID | Story                                        | Phase   | Status  |
| -------------- | -------------------------------------------- | ------- | ------- |
| PEDS-01        | P1: Pedido não encontrado sem Error genérico | Specify | Pending |
| PEDS-02        | P2: Peso inválido sem Error genérico         | Specify | Pending |
| PEDS-03        | P3: Alinhamento com consumidor HTTP          | Specify | Pending |


## Acceptance Criteria (issue #16)

- Erros de pedido não encontrado e peso inválido não usam mais `Error` genérico.
- Erros possuem `statusCode` e `code` alinhados à camada HTTP consumidora.
- Comportamento de cálculo/histórico de peso preservado após padronização.

## Success Criteria

- `rg "throw new Error" backend/src/features/pedidos/services/PedidoService.ts backend/src/features/pedidos/repositories/PedidosRepository.ts backend/src/features/pedidos/entities/HistoricoPesoPedido.ts` retorna 0 matches após execução.
- Fluxos de cálculo e histórico continuam com o mesmo comportamento em cenário de sucesso.

