# Spec Técnica — Refatoração da Feature de Pedidos

---

## 1. Título
**Centralização e padronização do domínio de Pedidos**

---

## 2. Contexto

Atualmente o sistema possui lógica relacionada a pedidos distribuída entre as features:

- `/features/orderLoss`
- `/features/cargo`

Ambas consomem dados de pedidos vindos do ERP da empresa, por meio de consultas SQL.  
Esses dados são processados localmente e utilizados em contextos diferentes.

No módulo `orderLoss`, o pedido não é persistido automaticamente no banco da aplicação. O registro local só ocorre quando existe uma justificativa de venda perdida.

No módulo `cargo`, existem types, entidades, processors e use cases relacionados a pedidos que hoje estão acoplados à feature, dificultando reutilização, manutenção e evolução do domínio.

---

## 3. Problema

A lógica de pedidos está espalhada entre features diferentes, gerando:

- acoplamento entre módulos
- duplicação de tipos e regras <- Esse é o mais importante. 
- dificuldade de reaproveitamento
- maior risco de inconsistência
- manutenção mais cara
- risco de aumento desnecessário de consultas ao ERP

---

## 4. Objetivo

Criar uma nova feature centralizada de **Pedidos**, responsável por concentrar tudo o que for compartilhado e reutilizável entre `cargo`, `orderLoss` e futuras features.

Essa nova feature deve padronizar:

- types
- entities
- processors
- queries
- contratos de retorno
- regras compartilhadas de processamento de pedidos

Também deve reduzir o acoplamento entre as features atuais e preparar o sistema para crescimento com melhor organização de domínio.

---

## 5. Escopo

Esta refatoração deve:

1. Criar uma nova feature em `/features/Pedidos`
2. Mover para essa feature tudo que for relacionado ao domínio compartilhado de pedidos
3. Remover responsabilidades de pedidos que hoje estão dentro de `cargo`, quando forem genéricas/reutilizáveis
4. Manter em `cargo` e `orderLoss` apenas as regras específicas de cada contexto
5. Padronizar types, processors, queries e classes relacionadas a pedidos. Com base nas features: `cargo` e `orderLoss`, Existem Valores distintos sobre o Type `Pedido`, identifique os iguais, e os diferentes, devem ser Extensões do Base, porém, dentro do Dominio que for ser usado. 
6. Atualizar imports e dependências para que `cargo` e `orderLoss` passem a consumir a nova feature
7. Minimizar duplicidade de lógica e facilitar futura otimização de consultas ao ERP

---

## 6. Fora de escopo

Esta refatoração **não** deve:

- alterar regras de negócio específicas de `orderLoss`
- alterar regras específicas de fechamento/fluxo de `cargo`
- mudar contratos de API externos sem necessidade
- alterar comportamento funcional já validado no sistema, exceto quando necessário para corrigir acoplamento
- implementar cache ou nova estratégia de infraestrutura nesta etapa, salvo se for indispensável para a reorganização da feature

---

## 7. Estrutura alvo esperada

Criar a feature:
/features/Pedidos


Estrutura mínima sugerida:
Pedidos/
├── controller/
├── entities/
├── types/
├── processors/
├── queries/
├── useCases/
├── mappers/
├── services/
└── index.ts


> A estrutura pode ser adaptada ao padrão atual do projeto, mas deve manter separação clara de responsabilidades.

---

## 8. Referências existentes para extração/refatoração

### Arquivos e pontos de referência

1. `features/cargo/service/PedidoProcessor`  
   Contém métodos de processamento e validação que devem ser desacoplados de `cargo`.

2. `features/Cargo/entities/Pedido.ts`  
   Criar na nova feature os types relacionados a `HistoricoPesoPedido`.

3. `features/cargo/useCases/GetPedidosFechadosVendedor.use-case.ts`  
   Avaliar e migrar ou adaptar para utilizar a nova feature.

---

## 9. Regras arquiteturais

- `Pedidos` pode ser dependência de `cargo` e `orderLoss`
- `Pedidos` **não pode depender** de `cargo` nem de `orderLoss`
- regras genéricas devem ficar em `Pedidos`
- regras específicas permanecem nas respectivas features
- queries devem ser centralizadas quando forem reutilizáveis
- types compartilhados devem ter uma única fonte de verdade

---

## 10. Diretriz de modelagem

A modelagem deve separar claramente:

### Núcleo compartilhado
- `PedidoBase`

### Extensões por contexto
- `PedidoCargo`
- `PedidoOrderLoss`

### Estruturas auxiliares
- `HistoricoPesoPedido`

> A separação deve garantir reutilização sem acoplamento.

---

## 11. Entregáveis esperados

- Nova feature `/features/Pedidos` criada
- Types compartilhados centralizados
- `HistoricoPesoPedido` definido na nova feature
- Processors desacoplados de `cargo`
- Use cases reorganizados conforme necessidade
- Queries centralizadas
- `cargo` e `orderLoss` utilizando a nova feature
- Remoção de duplicidade e acoplamento indevido

---

## 12. Critérios de aceitação

- A feature `/features/Pedidos` existe e está organizada
- Não há duplicação de lógica de pedidos entre `cargo` e `orderLoss`
- `HistoricoPesoPedido` está centralizado
- Processors compartilhados não estão mais em `cargo`
- Nenhum arquivo de `Pedidos` depende de `cargo` ou `orderLoss`
- `cargo` e `orderLoss` consomem os contratos da nova feature
- O comportamento atual do sistema continua funcional
- A estrutura final deixa claro o domínio de pedidos

---

## 13. Riscos e pontos de atenção

- mover código sem separar responsabilidade corretamente
- centralização excessiva criando um módulo “Deus”
- quebra de contratos existentes
- aumento de complexidade nas queries SQL
- impacto indireto em performance se não houver cuidado

---

## 14. Observações finais

O objetivo principal desta refatoração é:

- melhorar organização do domínio
- reduzir acoplamento
- permitir reutilização
- preparar o sistema para escalar

Não se trata apenas de mover arquivos, mas de **estruturar corretamente o domínio de pedidos**.

---