# Fechar viagem por cliente

## Problem Statement

ALMOX fecha a viagem apontando container por container, com seletor de pedido ao lado. O papel do motorista é lido por cliente e por `posCar`. A tela não mostra a placa do container e pede o cadastro do IBC que entrou na troca antes de fechar. Containers que chegaram a mais não têm onde ser contados.

## Goals

- [ ] ALMOX aponta Ficou, Troca ou Retornou por cliente e pedido, na ordem do `posCar`, e fecha a viagem com destino em todo container que saiu.
- [ ] Cada Troca marcada vira uma linha de stage no fechar, sem cadastrar o container que entrou.
- [ ] A viagem guarda o inteiro Chegaram a mais. A tela seguinte não faz parte desta entrega.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Tela de cadastro, checklist e crédito do vendedor | Próximo desenvolvimento. Ela só lê a stage e o inteiro. |
| Saldo de container por vendedor | Esta tela não grava saldo. |
| Cadastro do IBC que entrou na troca | A stage não tem identificador novo, produto escolhido nem checklist. |
| Recolha por cidade ou por outro cliente | O excedente é um inteiro na carga, sem cliente e sem vendedor. |
| Reabrir a conciliação depois do fechar | O destino fica selado. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Custódia do container que saiu em Troca | No fechar, segue a mesma custódia de Ficou no pedido do sub-bloco (venda ou empréstimo). A stage é o container que ainda não existe. | O container que saiu não pode permanecer Em viagem. O que entrou não nasce aqui. | y |
| Momento da stage | A linha nasce na transação do fechar, uma por Troca ainda marcada. Salvar andamento não grava stage. Desmarcar antes do fechar não deixa linha. | O histórico fecha junto com a viagem. | y |
| Ordem do cliente | O bloco do cliente usa o menor `posCar` dos pedidos elegíveis dele. Dentro do bloco, os sub-blocos usam `comparePedidosOrdemEntrega`. | O campo já é a posição da carga. | y |
| Chegaram a mais vazio | O campo vazio grava 0. Inteiro negativo é recusado. Não há teto. | Não trava o fechar e não vira linha de stage. | y |
| Identidade visual | A linha reutiliza `IbcContainerChip` e `IbcPlacaAmostra` da preparação da carga. O nome do produto fica no cabeçalho do grupo, como em `CargaIbcSecaoContainers`. | O chip atual não imprime o nome do produto. | y |
| Papéis | ALMOX e ADMIN, os mesmos do fechar viagem. | Nenhuma mudança de permissão foi pedida. | y |
| Divergência | Ficou + Troca contra a quantidade esperada do pedido, com confirmação no fechar, como hoje. A barra do cliente não usa essa quantidade. | A quantidade esperada continua visível no sub-bloco. | y |

**Open questions:** none

---

## User Stories

### P1: Apontar a viagem por cliente ⭐ MVP

**User Story**: As an ALMOX, I want to mark each outbound container under the client and the pedido, so that the paper and the screen use the same `posCar`.

**Why P1**: Sem esse agrupamento o operador continua escolhendo o pedido ao lado do container.

**Acceptance Criteria**:

1. WHEN a viagem está aberta THEN the system SHALL listar um bloco por cliente, ordenado pelo menor `posCar` dos pedidos elegíveis daquele cliente, e um sub-bloco por pedido com número, selo Incluso quando `quantidadeEsperadaVenda` é maior que 0, e quantidade esperada.
2. WHEN um cliente tem um único pedido elegível THEN the system SHALL mostrar o sub-bloco sem seletor de pedido.
3. WHEN um sub-bloco está visível THEN the system SHALL listar os containers da carga compatíveis com os grupos daquele pedido, container universal incluído, reutilizando `IbcContainerChip` e `IbcPlacaAmostra`.
4. WHILE um container não tem destino the system SHALL repeti-lo em todo sub-bloco compatível.
5. WHEN o operador marca Ficou ou Troca num sub-bloco THEN the system SHALL gravar esse pedido, remover o container dos outros sub-blocos e manter uma única marca.
6. WHEN o operador marca Retornou THEN the system SHALL gravar o destino sem pedido, tirar o container de todos os clientes e mostrá-lo numa lista única no fim.
7. WHEN o operador desmarca o destino THEN the system SHALL devolver o container aos sub-blocos compatíveis.
8. WHEN a viagem está aberta THEN the system SHALL mostrar em cada cliente uma barra com dois trechos, a contagem de Ficou e a contagem de Troca marcados naquele cliente, e a contagem de Retornou só na lista do fim.
9. The system SHALL omitir o painel Retornos sem identificação e o botão Registrar o IBC que entrou.

**Independent Test**: Abrir a carga 383 em fechar viagem, ver os clientes por `posCar`, marcar um hipo em um cliente e conferir que ele sumiu do outro.

---

### P1: Fechar a viagem e deixar a stage

**User Story**: As an ALMOX, I want to close the trip once every outbound container has a destination, so that each Troca waits in a stage row and the extra arrivals are only a number.

**Why P1**: O fechar é o momento que sela o histórico. A tela seguinte depende dessa stage e desse inteiro.

**Acceptance Criteria**:

1. WHEN o operador salva o andamento THEN the system SHALL gravar os destinos e o inteiro Chegaram a mais, sem inserir linha de stage.
2. IF Chegaram a mais é negativo THEN the system SHALL recusar o salvamento com 400.
3. WHEN Chegaram a mais vem ausente THEN the system SHALL gravar 0.
4. IF existe container da carga sem destino THEN the system SHALL recusar o fechar com 409 `IBC_VIAGEM_INCOMPLETA`.
5. WHEN todo container que saiu tem destino e a divergência de pedido está confirmada THEN the system SHALL fechar a viagem numa transação, selar os destinos e aplicar a custódia já definida para Ficou e Retornou.
6. WHEN uma Troca está marcada no fechar THEN the system SHALL gravar uma linha de stage ligada à viagem, ao container que saiu e ao pedido do sub-bloco, e SHALL aplicar nesse container a mesma custódia de Ficou.
7. The stage row SHALL NOT store a new identifier, a chosen product, or a checklist.
8. IF a viagem já está fechada THEN the system SHALL recusar outro fechar com 409 `IBC_VIAGEM_JA_FECHADA` e SHALL NOT insert another stage row.
9. WHILE a viagem está fechada the system SHALL exibir a conciliação e Chegaram a mais só para consulta.
10. WHEN a conciliação é lida THEN the system SHALL devolver, em cada container, identificador, `corHex`, `grupoCodigo`, `universal` e `homologado`, e em cada pedido, `posCar` e `gruposCodigo`.

**Independent Test**: Marcar uma Troca, informar Chegaram a mais 5, fechar, e ler uma linha de stage sem IBC de entrada e o inteiro 5 na viagem.

---

## Edge Cases

- IF o pedido é misto THEN the system SHALL continuar fora da lista elegível.
- IF dois pedidos do mesmo cliente têm o mesmo `posCar` THEN the system SHALL desempatar pelo menor `numPed`.
- IF `posCar` é nulo THEN the system SHALL ordenar pelo menor `numPed`, como `comparePedidosOrdemEntrega`.
- IF o mesmo container compatível está em dois sub-blocos e o operador marca um THEN the system SHALL deixar só essa marca.
- IF o fechar falha no meio da transação THEN the system SHALL não persistir stage, custódia nem `viagemFechadaEm`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| FECHAR-01 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-02 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-03 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-04 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-05 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-06 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-07 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-08 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-09 | P1: Apontar a viagem por cliente | Specify | Pending |
| FECHAR-10 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-11 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-12 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-13 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-14 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-15 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-16 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-17 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-18 | P1: Fechar a viagem e deixar a stage | Specify | Pending |
| FECHAR-19 | P1: Fechar a viagem e deixar a stage | Specify | Pending |

**Coverage:** 19 total, 0 mapped to tasks, 19 unmapped

---

## Success Criteria

- [ ] ALMOX fecha a viagem sem cadastrar o IBC que entrou e sem escolher vendedor.
- [ ] Cada Troca marcada produz uma linha de stage. Chegaram a mais permanece um inteiro na viagem.
- [ ] A ordem dos blocos segue `posCar`. A placa reutiliza o chip da preparação.
