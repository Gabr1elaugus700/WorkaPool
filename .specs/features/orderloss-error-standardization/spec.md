# OrderLoss - Eliminar Error genérico remanescente

> Issue de origem: [#19 - refactor: eliminar Error genérico remanescente em orderLoss](https://github.com/Gabr1elaugus700/WorkaPool/issues/19)

## Problem Statement

O módulo `orderLoss` já é referência de padronização de erro via `OrdersController`, porém ainda existem ocorrências internas de `throw new Error(...)` em camadas de `repository` e `use case`.

Ocorrências mapeadas:

- `[backend/src/features/orderLoss/repositories/OrdersRepository.ts](../../../backend/src/features/orderLoss/repositories/OrdersRepository.ts)` (`getLostOrdersFromSapiens`)
- `[backend/src/features/orderLoss/useCases/UpdateOrderStatusUseCase.ts](../../../backend/src/features/orderLoss/useCases/UpdateOrderStatusUseCase.ts)` (`execute`)

Sem a migração dessas ocorrências para `AppError`, o padrão fim-a-fim continua inconsistente e parte do fluxo pode cair em respostas HTTP sem semântica uniforme.

## Goals

- Eliminar 100% dos `throw new Error(...)` remanescentes no escopo da issue.
- Padronizar ambos os casos com `AppError({ message, statusCode, code, details })`.
- Preservar semântica de negócio das mensagens/códigos já esperados pelo controller consumidor.
- Manter `OrdersController` como referência de contrato uniforme de erro.

## Out of Scope

- Refatorar outros use cases/repositories de `orderLoss` fora dos dois arquivos mapeados.
- Alterar contratos de sucesso dos endpoints.
- Mudar regras de autorização/validação já implementadas no `OrdersController`.
- Introduzir middleware global de erro.

## User Stories

### P1: OLS-01 — Not Found no update de status com AppError

**User Story**: Como consumidor da rota de atualização de status, eu quero receber erro semântico quando o pedido não existe, para tratar o cenário com status e código corretos.

**Acceptance Criteria**:

1. WHEN `UpdateOrderStatusUseCase.execute` não encontra pedido por `orderId` THEN SHALL lançar `AppError` com `statusCode: 404`, `code: "ORDER_NOT_FOUND"` e `details: { orderId }`.
2. WHEN esse erro propagar ao controller THEN a resposta SHALL manter o shape padrão `{ error, code, details }`.

**Independent Test**: chamar update status com `orderId` inexistente e validar `404` com `ORDER_NOT_FOUND`.

---

### P2: OLS-02 — Falha interna ao consultar perdidos no Sapiens com AppError

**User Story**: Como consumidor da listagem de perdidos do Sapiens, eu quero que falhas internas de integração sejam padronizadas, para manter contrato uniforme de erro no endpoint.

**Acceptance Criteria**:

1. WHEN `OrdersRepository.getLostOrdersFromSapiens` falha no bloco `try/catch` THEN SHALL lançar `AppError` com `statusCode: 500`, `code: "ORDER_LOST_SAPIENS_FETCH_ERROR"` e `details` com contexto mínimo de filtros (`{ startDate, endDate, codRep }`).
2. WHEN erro for lançado THEN mensagem para usuário SHALL manter semântica atual (`"Erro ao buscar pedidos perdidos do SAPIENS"`).

**Independent Test**: simular falha no SQL pool/query e validar resposta 500 padronizada no endpoint de perdidos.

---

### P3: OLS-03 — Contrato do OrdersController sem regressão

**User Story**: Como mantenedor do `OrdersController`, eu quero continuar tratando `AppError` de forma centralizada, sem regressão do contrato nas rotas já padronizadas.

**Acceptance Criteria**:

1. WHEN as duas ocorrências internas migrarem para `AppError` THEN `OrdersController.getLostOrdersFromSapiens` SHALL continuar retornando `{ error, code, details }` no catch de `AppError`.
2. WHEN `UpdateOrderStatusUseCase` passar a lançar `AppError` THEN a rota de update status SHALL manter resposta de erro semântica (no ajuste futuro do catch desse método, se aplicável no escopo de execução).

**Independent Test**: executar cenários de erro das duas rotas e comparar shape de resposta com o padrão já existente em outras rotas do controller.

## Edge Cases

- Em `getLostOrdersFromSapiens`, `filters` pode estar `undefined`; `details` deve aceitar valores opcionais sem quebrar tipagem.
- `ORDER_LOST_SAPIENS_FETCH_ERROR` representa erro de infraestrutura/integração (500), não erro de validação do usuário.
- `ORDER_NOT_FOUND` deve manter semântica de negócio de recurso inexistente (404), sem mascarar como erro interno.

## Catálogo de Erros (escopo da issue)


| Origem                                      | Erro atual                                                      | Novo erro padronizado                                                                                                                                                   |
| ------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UpdateOrderStatusUseCase.execute`          | `throw new Error("Pedido não encontrado.")`                     | `AppError({ message: "Pedido não encontrado.", statusCode: 404, code: "ORDER_NOT_FOUND", details: { orderId } })`                                                       |
| `OrdersRepository.getLostOrdersFromSapiens` | `throw new Error("Erro ao buscar pedidos perdidos do SAPIENS")` | `AppError({ message: "Erro ao buscar pedidos perdidos do SAPIENS", statusCode: 500, code: "ORDER_LOST_SAPIENS_FETCH_ERROR", details: { startDate, endDate, codRep } })` |


## Requirement Traceability


| Requirement ID | Story                                             | Phase   | Status  |
| -------------- | ------------------------------------------------- | ------- | ------- |
| OLS-01         | P1: Not Found no update de status com AppError    | Specify | Pending |
| OLS-02         | P2: Falha de integração Sapiens com AppError      | Specify | Pending |
| OLS-03         | P3: Sem regressão no contrato do OrdersController | Specify | Pending |


## Acceptance Criteria (issue #19)

- Casos internos de erro passam a usar estrutura padronizada compatível com `AppError`.
- `OrdersController` continua como referência sem regressão no contrato de erro.
- Mensagens/códigos de erro preservam semântica de negócio.

## Success Criteria

- `rg "throw new Error" backend/src/features/orderLoss/repositories/OrdersRepository.ts backend/src/features/orderLoss/useCases/UpdateOrderStatusUseCase.ts` retorna 0 matches após execução.
- Cenário de pedido inexistente no update retorna erro semântico `ORDER_NOT_FOUND`.
- Falha de consulta Sapiens retorna erro semântico `ORDER_LOST_SAPIENS_FETCH_ERROR` com shape compatível ao padrão do controller.

