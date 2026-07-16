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

### Causa raiz 2: comparação float vs histórico arredondado

O histórico é persistido com `Math.round`:

```125:125:backend/src/features/pedidos/repositories/PedidosRepository.ts
        peso: Math.round(peso), // Garantir que seja inteiro
```

Mas a comparação usa o valor bruto do SQL:

```78:82:backend/src/features/pedidos/services/PedidoService.ts
    const pesoAnterior = historico.peso;
    const diferenca = pesoAtual - pesoAnterior;

    return {
      mudou: pesoAnterior !== pesoAtual,
```

Quando o SQL retorna fracionário (ex.: `1234.6`) e o histórico guarda `1235`, `mudou` fica `true` a cada ciclo, geralmente caindo no branch `reducao` (que só regrava histórico), produzindo **vários registros com peso praticamente igual** e sem reposicionar.

## Goals

- `getPedidoWeight` retornar o **peso total agregado** do pedido, consistente com `mapRawToPedidos`.
- `verificarMudancaPeso` comparar peso atual e histórico na **mesma granularidade** usada na persistência (inteiro arredondado).
- Preservar assinaturas públicas (`IPedidosRepository`, `PedidoService`, `CargaProcessor`) e o contrato de retorno.
- Reposicionamento e histórico passarem a refletir mudanças reais de peso.

## Out of Scope

- Alterar a regra de negócio de reposicionamento (mover para o final / remover) em si.
- Alterar o schema Prisma de `HistoricoPesoPedidos` (tipo `Int` permanece).
- Mudar a periodicidade do watchdog.
- Refatorar `PesoCargaCalculator` além do necessário para consumir peso correto.
- Deduplicar registros já existentes na tabela (limpeza de dados legados fica fora).

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

### D2 - Comparar peso na mesma granularidade da persistência

Como o histórico é gravado com `Math.round`, a comparação em `verificarMudancaPeso` deve arredondar ambos os lados antes de decidir `mudou`/`aumentou`/`reducao`/`diferenca`.

Arquivo: [backend/src/features/pedidos/services/PedidoService.ts](../../../backend/src/features/pedidos/services/PedidoService.ts)

Proposta (dentro de `verificarMudancaPeso`, após obter `pesoAtual` e `historico`):

```typescript
const pesoAtualComparavel = Math.round(pesoAtual);
const pesoAnterior = Math.round(historico.peso);
const diferenca = pesoAtualComparavel - pesoAnterior;

return {
  mudou: diferenca !== 0,
  pesoAnterior,
  pesoAtual: pesoAtualComparavel,
  aumentou: diferenca > 0,
  reducao: diferenca < 0,
  diferenca,
};
```

**Rationale**: evita `mudou` falso por diferença fracionária que desaparece no `Math.round` da persistência, eliminando os registros repetidos.

> Decisão de granularidade: adota-se `Math.round` (inteiro) para alinhar com a coluna `peso Int` do Prisma e com `createHistoricoPeso`. Não se altera a persistência; apenas a comparação passa a usar a mesma unidade.

## Componentes afetados

| Arquivo | Mudança | Story |
| --- | --- | --- |
| [PedidosRepository.ts](../../../backend/src/features/pedidos/repositories/PedidosRepository.ts) | `getPedidoWeight` agrega via `mapRawToPedidos` | FIX-01 |
| [PedidoService.ts](../../../backend/src/features/pedidos/services/PedidoService.ts) | `verificarMudancaPeso` compara peso arredondado | FIX-02 |

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

### P2: FIX-02 — Histórico não é regravado sem mudança real

**User Story**: Como operação logística, eu quero que o histórico de peso só registre mudanças reais, para não poluir `HistoricoPesoPedidos` com pesos repetidos.

**Acceptance Criteria**:

1. WHEN o peso atual difere do histórico apenas por fração que some no `Math.round` THEN `verificarMudancaPeso` SHALL retornar `mudou: false`.
2. WHEN `mudou: false` THEN o `CargaProcessor` SHALL pular o pedido sem chamar `salvarHistoricoPeso`.
3. WHEN há mudança inteira real THEN `mudou: true` com `aumentou`/`reducao` coerentes com o sinal da diferença.

## Edge Cases

- `peso = 0` continua válido (não vira erro) — coerente com [pedidos-error-standardization/spec.md](../pedidos-error-standardization/spec.md).
- Pedido sem histórico (`getLastHistoricoPeso` retorna `null`) mantém o branch de registro inicial em `verificarMudancaPeso` e `CargaProcessor`.
- Pedido com uma única linha no resultset: `mapRawToPedidos` retorna o mesmo peso, sem regressão.
- Peso fracionário exatamente em `.5`: segue o comportamento de `Math.round` (arredonda para cima), consistente entre comparação e persistência.

## Requirement Traceability

| Requirement ID | Story | Arquivo | Test IDs | Status |
| --- | --- | --- | --- | --- |
| FIX-01 | Peso atual agregado | `PedidosRepository.ts` | TC-G1.*, TC-S1.*, TC-P1.1/1.2 | Pending |
| FIX-02 | Comparação sem falso positivo | `PedidoService.ts` | TC-S2.*, TC-P1.4 | Pending |

## Success Criteria

- `getPedidoWeight` de um pedido multi-derivação retorna o peso total (verificável via TC-G1 + inspeção do valor gravado no histórico).
- Após uma alteração real de peso de um pedido em carga aberta, o watchdog reposiciona (novo `poscar`) e grava histórico com o novo peso.
- Ciclos consecutivos do watchdog **sem** alteração real de peso não geram novos registros em `HistoricoPesoPedidos`.
- Suíte de testes da [test-cases.md](./test-cases.md) passa integralmente.
- Sem alteração nas assinaturas de `IPedidosRepository`, `PedidoService` e `CargaProcessor`.

## Plano de validação manual (pós-deploy)

1. Selecionar um pedido multi-item vinculado a uma carga aberta.
2. Alterar no Sapiens a quantidade de um item que **não** seja o primeiro do resultset.
3. Aguardar o próximo ciclo do watchdog (2 min) e conferir no log `peso aumentou X -> Y`.
4. Verificar no banco: novo `poscar` para o pedido e um novo registro em `HistoricoPesoPedidos` com o peso total correto (distinto do anterior).
5. Aguardar mais um ciclo sem alterar nada e confirmar que **nenhum** novo registro de histórico é criado para aquele pedido.
