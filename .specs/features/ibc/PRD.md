# PRD — Domínio IBC e Disponibilização de Cargas

**Status:** Aprovado para decomposição em tasks  
**Issues:** [User Story EDA #73](https://github.com/Gabr1elaugus700/WorkaPool/issues/73), [Suíte de testes #74](https://github.com/Gabr1elaugus700/WorkaPool/issues/74)

## Objetivo

Permitir que a IBC descubra automaticamente quando uma carga foi fechada pela Gestão de Cargas, mantendo a API como fonte de consulta do estado atual e eliminando a dependência de refresh manual.

## Contexto de domínio

A carga percorre etapas de processamento pertencentes a contextos diferentes. A Gestão de Cargas é responsável por fechar a carga. A IBC é responsável por sua própria etapa de processamento de containers.

O evento comunica que uma etapa terminou. Ele não substitui consultas nem carrega a estrutura completa da carga.

## Primeira entrega

O primeiro fluxo do domínio IBC será:

```text
CARGA_FECHADA
  → Consumer IBC
  → SSE
  → View Expedição IBC
  → refetch da API
```

A rota existente será preservada:

```text
GET /api/ibc/cargas-expedicao
```

A resposta da rota deve ser construída pela API consultando o PostgreSQL. O RabbitMQ não será consultado pelo frontend e não armazenará a lista de cargas.

## Evento recebido

A IBC consumirá o evento de domínio:

```json
{
  "eventId": "uuid",
  "eventType": "CARGA_FECHADA",
  "occurredAt": "2026-08-28T11:00:00.000Z",
  "payload": {
    "cargaId": "uuid",
    "codCar": 11
  }
}
```

O processamento deve ser idempotente por `consumerName + eventId`.

Uma mensagem duplicada não deve criar nova carga, alterar novamente o domínio ou enviar notificações duplicadas.

## Disponibilidade na View

Ao receber `CARGA_FECHADA`, o backend notifica os clientes IBC conectados por SSE.

A mensagem realtime conterá somente:

```json
{
  "event": "CARGA_FECHADA",
  "cargaId": "uuid",
  "codCar": 11
}
```

O frontend:

1. Mantém uma conexão SSE autenticada.
2. Recebe a notificação.
3. Agrupa eventos próximos por debounce.
4. Invalida a query da listagem.
5. Executa novamente `GET /api/ibc/cargas-expedicao`.

Ao reconectar depois de uma queda, o frontend deve refazer a consulta para recuperar o estado atual do PostgreSQL.

## Regras de autorização

O endpoint SSE deve reutilizar o modelo atual de JWT e permitir somente usuários com acesso de leitura à IBC.

O stream deve rejeitar:

- ausência de token;
- token inválido;
- usuário sem autorização para leitura da IBC.

## Separação das responsabilidades

### Gestão de Cargas

- Fecha a carga.
- Persiste o estado `FECHADA`.
- Gera o evento `CARGA_FECHADA` por meio da Outbox.
- Não conhece a implementação interna da IBC.

### IBC

- Consome `CARGA_FECHADA`.
- Notifica a View por SSE.
- Consulta a API para obter cargas e dados atuais.
- Não mantém uma lista paralela no RabbitMQ.

### Frontend

- Escuta somente o stream SSE.
- Não consulta RabbitMQ.
- Não substitui a listagem com dados recebidos no evento.
- Usa a API como fonte da resposta atual.

## Contrato futuro da etapa IBC

Quando a IBC finalizar sua própria etapa, poderá publicar:

```text
CARGA_IBC_FINALIZADA
```

Esse evento será tratado em uma evolução posterior e permitirá que o próximo departamento inicie sua etapa sem chamada direta da IBC.

## Consulta de itens Sapiens

A consulta batch de itens de pedidos é uma preocupação separada do fluxo de notificação EDA. Ela não faz parte da primeira slice de EDA.

Quando essa consulta for retomada, deverá ser uma query específica do contexto IBC, sem alterar `QUERY_GET_PEDIDOS_BY_CARGA`. O contrato deverá:

- receber vários códigos de carga em uma única execução;
- não aplicar `sitped = 1`;
- retornar linhas de item com embalagem, volume, quantidade e inclusão;
- permitir agrupamento posterior por `COD_CAR` e `NUMPED`;
- usar parâmetros SQL, sem interpolação insegura;
- ser representado por um DTO específico de linha IBC, não pela entidade genérica `Pedido`.

## Fora de escopo

- Implementação de `CARGA_IBC_FINALIZADA`.
- Regras detalhadas de alocação de containers.
- Redesenho das entidades de pedidos.
- Nova fonte de dados ou projeção paralela de cargas.
- Cache no cliente.
- WebSocket.
- E2E de navegador.
- Migração automática da arquitetura antiga de polling.

## Critérios de sucesso

- Uma nova carga fechada torna-se visível sem refresh manual.
- O frontend refaz a consulta oficial da API.
- O estado exibido vem do PostgreSQL.
- Eventos duplicados não geram notificações duplicadas.
- A indisponibilidade temporária do navegador não causa perda permanente do estado.
- A implementação não cria acoplamento HTTP direto entre Gestão de Cargas e IBC.
