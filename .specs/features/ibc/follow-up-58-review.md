# Follow-up review — Seam Pedido IBC (#58)

**Status**: Draft  
**Parent**: [#58](https://github.com/Gabr1elaugus700/WorkaPool/issues/58)  
**Origin**: code-review `a16bb83...HEAD` (`61ce99c`) — eixos Standards + Spec  
**Type**: refactor / hygiene (sem mudança de comportamento externo)

## Contexto

A implementação do seam pedidos-by-carga (#58) atende os ACs e o Gherkin da slice 2 (#56). O review apontou **0 hard violations** de standards e **0 gaps de spec**, mas registrou melhorias de higiene e um scope creep leve no mesmo commit.

Este documento especifica as **correções e melhorias** a aplicar sem reabrir o escopo de AlocacaoIbc / Fechar expedição (#59+).

## Objetivo

Deixar o código do seam #58 com ownership claro, constante de domínio única e aplicação do DTO de elegibilidade sem cópia manual de campos — mantendo os testes verdes e o comportamento observável idêntico.

## Melhorias e correções citadas

| # | Eixo | Achado | Severidade | Correção |
| - | ---- | ------ | ---------- | -------- |
| 1 | Spec / Standards | `PedidoService` passou de `PedidoCargo` → `PedidoComNumero` no commit de IBC (**Divergent Change** / scope creep) | judgement | Manter o tipo estreito (é o acoplamento certo), mas **documentar o porquê** no serviço e garantir que nenhum comportamento de peso mudou; opcional: commit/mensagem dedicada se ainda não estiver separado |
| 2 | Standards | Magic `251001` duplicado no compute (privado) e no teste (**Duplicated Code**) | judgement | Exportar constante canônica única (ex. `CODIGO_EMBALAGEM_IBC`) do módulo de elegibilidade e importá-la no teste |
| 3 | Standards | Mapper copia 5 campos de `PedidoIbcEligibility` um a um (**Data Clumps**) | judgement (fraco) | Aplicar o resultado em um passo (`applyIbcEligibility` em `PedidoCargo` **ou** spread/`Object.assign` tipado) |

### Fora de escopo desta spec

- Reimplementar fórmula / ACs de #58
- AlocacaoIbc, Fechar expedição, listagem ALMOX, authz (#59–#63)
- Enriquecer `QUERY_GET_PEDIDOS_BASE` / by-rep
- Mudar semântica de `ibcInvalido` + `isContainer: false` em Pedido inválido (já alinhada à UL)

## Escopo técnico

### 1. Constante canônica `CODIGO_EMBALAGEM_IBC`

**Arquivo:** `backend/src/features/pedidos/mappers/computePedidoIbcEligibility.ts`

- Exportar `CODIGO_EMBALAGEM_IBC = 251001` (ou objeto coeso de constantes IBC do pedido, se preferir o padrão “one cohesive typed object” do writing-typescript).
- Manter a regra: só linhas com esse código entram no cálculo.

**Arquivo:** `backend/test/unit/features/pedidos/mappers/PedidoMapper.ibcEligibility.test.ts`

- Remover literal local `251001`; importar a constante exportada.
- Garantir que nenhum teste novo use o termo aposentado `QUANTIDADE_EMBALAGEM`.

### 2. Aplicar `PedidoIbcEligibility` sem field-by-field no mapper

**Opção preferida (SRP no DTO):**

- Em `PedidoCargo`, método `applyIbcEligibility(eligibility: PedidoIbcEligibility): void` que atribui os cinco campos.
- Em `PedidoMapper`, substituir as 5 linhas de assign por `pedido.applyIbcEligibility(eligibility)`.

**Opção alternativa:** helper no mesmo arquivo do compute que retorna props prontas para o construtor — só se o método na entidade for rejeitado por standards (um export por arquivo já satisfeito em `PedidoCargo.types.ts` como classe).

Comportamento externo: inalterado.

### 3. Clarificar `PedidoComNumero` no `PedidoService`

**Arquivo:** `backend/src/features/pedidos/services/PedidoService.ts`

- Manter `PedidoComNumero` / `{ numPed: string }` nas APIs de peso/histórico (evita acoplar cargo `Pedido` aos campos IBC de `PedidoCargo`).
- Adicionar comentário curto de domínio: *peso/histórico só precisam do número do pedido; elegibilidade IBC vive em PedidoCargo via mapper*.
- Não reverter para `PedidoCargo` — isso reintroduziria o conflito estrutural cargo↔IBC.

Se no futuro o time quiser histórico limpo: extrair esse narrowing para um commit `refactor(pedidos): narrow PedidoService weight APIs` (já feito em `61ce99c`; nesta spec basta documentar).

## Critérios de aceite

- [ ] `CODIGO_EMBALAGEM_IBC` (ou objeto coeso) é a única fonte do valor `251001` entre implementação e testes do seam
- [ ] `PedidoMapper` aplica elegibilidade IBC sem listar os cinco campos individualmente
- [ ] `PedidoService` permanece tipado com o mínimo `{ numPed }` e documenta o motivo
- [ ] Suite unitária de pedidos/mapper (incl. `PedidoMapper.ibcEligibility.test.ts`) verde
- [ ] Nenhum AC de #58 / Gherkin slice 2 (#56) muda de comportamento
- [ ] Termo `QUANTIDADE_EMBALAGEM` continua ausente do código novo desta fatia

## Observações

- Review Standards: **0 hard / 3 judgement** (pior: Divergent Change no `PedidoService`).
- Review Spec: **0 missing / 1 creep** (mesmo ponto).
- Trabalho estimado: pequeno (minutos–1h), seguro para agent com TDD nos testes existentes.
