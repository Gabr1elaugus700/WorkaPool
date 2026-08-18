# Peso do Pedido / Reposicionamento - Spec Técnica de Correção

> Spec de test cases relacionada: [test-cases.md](./test-cases.md)

## Problem Statement

No watchdog que roda a cada 2 minutos ([WatchdogScheduler](../../../backend/src/schedulers/watchdog/WatchdogScheduler.ts) -> [CheckPesoPedidoHistoricoUseCase](../../../backend/src/features/cargo/useCases/CheckPesoPedidoHistorico.use-case.ts) -> [CargaProcessor](../../../backend/src/features/cargo/services/CargaProcessor.ts)):

1. **Pedidos com peso alterado não mudam de posição na carga.**
2. **A tabela `HistoricoPesoPedidos` acumula vários registros com o mesmo peso** (o primeiro peso salvo).

A investigação identificou duas causas raiz independentes.

### Causa raiz 1 (principal): `getPedidoWeight` não agrega o peso

A query [`QUERY_GET_PEDIDO_WEIGHT`](../../../backend/src/features/pedidos/queries/pedidosQueries.ts) faz `GROUP BY` por `ipd.codder`/`ipd.qtdped`, retornando **uma linha por produto/derivação**, cada uma com peso parcial.

Na listagem isso é somado corretamente:

```39:39:backend/src/features/pedidos/mappers/PedidoMapper.ts
    pedido.peso += Number(row.PESO);
```

Mas em `getPedidoWeight` apenas a **primeira** linha é usada:

```69:72:backend/src/features/pedidos/repositories/PedidosRepository.ts
    return {
      numPed: Number(result.recordset[0].NUM_PED),
      peso: Number(result.recordset[0].PESO),
    };
```

Como `PedidoService.verificarMudancaPeso` compara `pesoAtualPedido` (peso parcial) com o histórico (também gravado parcial), a mudança real de peso muitas vezes não é detectada -> `mudou: false` -> sem reposicionamento.

### Causa raiz 2: `Math.round` + coluna `Int` colapsa o total exato

O histórico era persistido com `Math.round` em coluna Prisma `Int`. O total vivo do pedido continua fracionário (ex.: `1355.5`). No tick seguinte a comparação via `Math.round` trata `1355.5` vs `1355` como iguais **ou**, se a comparação for bruta contra o inteiro gravado, dispara `mudou` a cada ciclo.

O contrato correto (issues #51/#52): peso do Pedido = soma exata dos itens. Nunca arredondar na comparação, na persistência ou nos fakes.

## Goals

- `getPedidoWeight` retornar o **peso total agregado** do pedido, consistente com `mapRawToPedidos`.
- `verificarMudancaPeso` e `salvarHistoricoPeso` compararem e gravarem o **total exato** (sem `Math.round`).
- `historico_peso_pedidos.peso` persistir `Decimal`, não `Int`.
- Preservar assinaturas públicas (`IPedidosRepository`, `PedidoService`, `CargaProcessor`) e o contrato de retorno.
- Reposicionamento e histórico passarem a refletir mudanças reais de peso.

## Out of Scope

- Alterar a regra de negócio de reposicionamento (mover para o final / remover) em si.
- Deduplicar registros já existentes na tabela (limpeza de dados legados fica fora).
- Mudar a periodicidade do watchdog.
- Reabilitar o boot do watchdog em `server.ts`.
- E2E contra SQL Server Sapiens real (FakeSapiens é o boundary).
- Refatorar `PesoCargaCalculator` além do necessário para consumir peso correto.

## Design Decisions

### D1 - Agregar peso em `getPedidoWeight` reutilizando `mapRawToPedidos`

Trocar o uso de `recordset[0]` pela agregação já existente, garantindo fonte única de verdade com a listagem.

Arquivo: [backend/src/features/pedidos/repositories/PedidosRepository.ts](../../../backend/src/features/pedidos/repositories/PedidosRepository.ts)

Proposta (dentro de `getPedidoWeight`, após validar `recordset.length`):

```typescript
const pedidos = mapRawToPedidos(result.recordset);
const pedido = pedidos[0];

return {
  numPed: Number(pedido.numPed),
  peso: Number(pedido.peso),
};
```

`mapRawToPedidos` já está importado no arquivo. Como a query filtra por um único `@numPed`, `pedidos` terá no máximo 1 item; a checagem de `recordset.length === 0` -> `AppError PEDIDOS_NOT_FOUND` (linhas 60-67) é mantida antes da agregação.

**Rationale**: elimina o peso parcial na origem, corrigindo simultaneamente detecção de mudança, gravação de histórico e cálculo de capacidade em [PesoCargaCalculator](../../../backend/src/features/cargo/services/PesoCargaCalculator.ts) e [UpdatePedidoCarga.use-case.ts](../../../backend/src/features/cargo/useCases/UpdatePedidoCarga.use-case.ts), que também usam `getPedidoWeight`.

### D2 - Comparar e persistir o total exato (sem `Math.round`)

Arquivos:

- [PedidoService.ts](../../../backend/src/features/pedidos/services/PedidoService.ts) — `verificarMudancaPeso` e `salvarHistoricoPeso`
- [PedidosRepository.ts](../../../backend/src/features/pedidos/repositories/PedidosRepository.ts) — `createHistoricoPeso` / `getLastHistoricoPeso`
- [schema.prisma](../../../backend/prisma/schema.prisma) e [schema.dev.prisma](../../../backend/prisma/schema.dev.prisma) — `peso Decimal @db.Decimal(12, 3)`

Comparação:

```typescript
const pesoAnterior = historico.peso;
const diferenca = pesoAtual - pesoAnterior;

return {
  mudou: diferenca !== 0,
  pesoAnterior,
  pesoAtual,
  aumentou: diferenca > 0,
  reducao: diferenca < 0,
  diferenca,
};
```

Idempotência de `salvarHistoricoPeso`: só pula se `ultimoHistorico.peso === peso` (igualdade exata). `1355.5` vs `1355` é mudança real e grava `1355.5` uma vez; o tick seguinte com `1355.5` não faz nada.

Na leitura Prisma, converter `Decimal` com `Number(result.peso)`.

**Rationale**: a coluna `Int` + `Math.round` era o defeito. O total vivo nunca é inteiro por construção; gravar e comparar o mesmo número elimina o loop do watchdog.

## Componentes afetados

| Arquivo | Mudança | Story |
| --- | --- | --- |
| [PedidosRepository.ts](../../../backend/src/features/pedidos/repositories/PedidosRepository.ts) | `getPedidoWeight` agrega via `mapRawToPedidos`; `createHistoricoPeso` grava Decimal sem `Math.round` | FIX-01, FIX-02 |
| [PedidoService.ts](../../../backend/src/features/pedidos/services/PedidoService.ts) | `verificarMudancaPeso` / `salvarHistoricoPeso` usam igualdade exata | FIX-02 |
| [schema.prisma](../../../backend/prisma/schema.prisma) / [schema.dev.prisma](../../../backend/prisma/schema.dev.prisma) | `historico_peso_pedidos.peso` `Int` → `Decimal(12, 3)` | FIX-02 |

Consumidores que se beneficiam sem alteração de assinatura:

- [PesoCargaCalculator.ts](../../../backend/src/features/cargo/services/PesoCargaCalculator.ts) (`calcularPesoUsado`, `simularNovoPeso`, `validarAdicaoPedido`)
- [CargaProcessor.ts](../../../backend/src/features/cargo/services/CargaProcessor.ts) (`processarMudancasPesoPedidos`)
- [UpdatePedidoCarga.use-case.ts](../../../backend/src/features/cargo/useCases/UpdatePedidoCarga.use-case.ts)

## User Stories / Acceptance Criteria

### P1: FIX-01 — Peso atual reflete o total do pedido

**User Story**: Como watchdog de cargas, eu quero que `getPedidoWeight` retorne o peso total do pedido, para detectar mudanças reais e reposicionar corretamente.

**Acceptance Criteria**:

1. WHEN `getPedidoWeight` recebe um pedido com múltiplas linhas (derivações) THEN SHALL retornar `peso` igual à soma de todas as linhas (mesmo valor de `mapRawToPedidos`).
2. WHEN o pedido não existe THEN SHALL manter o `AppError` `404 PEDIDOS_NOT_FOUND` atual, sem regressão.
3. WHEN o peso real do pedido aumenta em relação ao histórico THEN `verificarMudancaPeso` SHALL retornar `aumentou: true` e o `CargaProcessor` SHALL reposicionar o pedido.

### P2: FIX-02 — Histórico persiste e compara o total exato

**User Story**: Como operação logística, eu quero que cada Pedido em carga aberta seja comparado e gravado pela soma exata dos itens (nunca arredondada), para o watchdog só reposicionar, remover ou regravar histórico quando o peso real mudou.

**Acceptance Criteria**:

1. WHEN o peso atual é `1355.5` e o histórico é `1355` THEN `verificarMudancaPeso` SHALL retornar `mudou: true` e `pesoAtual: 1355.5`.
2. WHEN o peso atual é `1355.5` e o histórico é `1355.5` THEN `verificarMudancaPeso` SHALL retornar `mudou: false` e o `CargaProcessor` SHALL pular o pedido sem chamar `salvarHistoricoPeso`.
3. WHEN `salvarHistoricoPeso` recebe `500.4` e o último histórico é `500` THEN SHALL criar um registro com `500.4`.
4. WHEN há mudança real THEN `mudou: true` com `aumentou`/`reducao` coerentes com o sinal da diferença exata.

## Edge Cases

- `peso = 0` continua válido (não vira erro) — coerente com [pedidos-error-standardization/spec.md](../pedidos-error-standardization/spec.md).
- Pedido sem histórico (`getLastHistoricoPeso` retorna `null`) mantém o branch de registro inicial em `verificarMudancaPeso` e `CargaProcessor`.
- Pedido com uma única linha no resultset: `mapRawToPedidos` retorna o mesmo peso, sem regressão.
- Histórico legado arredondado (`1355`) vs total vivo `1355.5`: um tick grava `1355.5`; o seguinte não faz nada.
- Pedido que já tem a maior `posCar` e o peso aumentou cabendo: não bumpa posição; grava histórico se o total exato mudou.

## Requirement Traceability

| Requirement ID | Story | Arquivo | Test IDs | Status |
| --- | --- | --- | --- | --- |
| FIX-01 | Peso atual agregado | `PedidosRepository.ts` | TC-G1.*, TC-S1.*, TC-P1.1/1.2, INT-PESO-01/02/05 | Done |
| FIX-02 | Total exato sem `Math.round` | `PedidoService.ts`, Prisma Decimal | TC-S2.*, TC-P1.3/1.4, INT-PESO-03/04/05/06/07, INT-PRISMA-01 | Done |

### Integrações concluídas

| Integration ID | Cobertura | Status |
| --- | --- | --- |
| INT-PESO-01 | Aumento que cabe: reposiciona e grava o peso total | Done |
| INT-PESO-02 | Aumento que excede: remove e grava o peso total | Done |
| INT-PESO-03 | Redução: preserva posição e grava o novo peso | Done |
| INT-PESO-04 | Sem mudança: não grava histórico nem atualiza carga | Done |
| INT-PESO-05 | Segundo ciclo: não repete histórico nem reposicionamento | Done |
| INT-PESO-06 | Total exato 1355.5 já no histórico: não reposiciona nem grava | Done |
| INT-PESO-07 | Histórico legado 1355 → grava 1355.5 uma vez; tick seguinte estável | Done |
| INT-PRISMA-01 | Histórico isolado em `workapool_test`: persistência Decimal e leitura do mais recente | Done |
| INT-PRISMA-02 | Fluxo misto com Sapiens fake e persistência Prisma | Done |

## Execução automatizada

No diretório `backend`, `npm test` executa somente os testes unitários,
`npm run test:integration` carrega `.env.test` e executa as integrações contra
o banco isolado `workapool_test`, e `npm run test:all` executa as duas suítes em
sequência. Os fluxos Sapiens usam `FakeSapiens`; nenhum dos comandos exige
conexão com o SQL Server Sapiens.

## Success Criteria

- `getPedidoWeight` de um pedido multi-derivação retorna o peso total (verificável via TC-G1 + inspeção do valor gravado no histórico).
- Após uma alteração real de peso de um pedido em carga aberta, o watchdog reposiciona (novo `poscar`) e grava histórico com o novo peso **exato**.
- `1355.5` é gravado como `1355.5`; o tick seguinte contra `1355.5` não reposiciona e não cria histórico.
- Ciclos consecutivos do watchdog **sem** alteração real de peso não geram novos registros em `HistoricoPesoPedidos`.
- Nenhum `Math.round` no peso do Pedido em produção ou fakes.
- Suíte de testes da [test-cases.md](./test-cases.md) passa integralmente.
- Sem alteração nas assinaturas de `IPedidosRepository`, `PedidoService` e `CargaProcessor`.

## Plano de validação manual (pós-deploy)

1. Selecionar um pedido multi-item vinculado a uma carga aberta.
2. Alterar no Sapiens a quantidade de um item que **não** seja o primeiro do resultset.
3. Aguardar o próximo ciclo do watchdog (2 min) e conferir no log `peso aumentou X -> Y`.
4. Verificar no banco: novo `poscar` para o pedido e um novo registro em `HistoricoPesoPedidos` com o peso total correto (distinto do anterior).
5. Aguardar mais um ciclo sem alterar nada e confirmar que **nenhum** novo registro de histórico é criado para aquele pedido.
