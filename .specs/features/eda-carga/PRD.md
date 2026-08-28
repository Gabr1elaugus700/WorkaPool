# PRD — Arquitetura Orientada a Eventos para o Ciclo de Cargas

**Status:** Aprovado para decomposição em tasks  
**Issues:** [Infraestrutura #72](https://github.com/Gabr1elaugus700/WorkaPool/issues/72), [User Story EDA #73](https://github.com/Gabr1elaugus700/WorkaPool/issues/73), [Suíte de testes #74](https://github.com/Gabr1elaugus700/WorkaPool/issues/74)

## Objetivo

Migrar gradualmente o processamento de cargas para uma arquitetura orientada a eventos, usando RabbitMQ como transporte e PostgreSQL como fonte de verdade.

O fechamento de uma etapa deve gerar um fato de negócio. O próximo processo reage ao evento sem que o processo anterior precise chamar diretamente sua tela, controller ou caso de uso.

## Problema

O fluxo atual acopla a descoberta da próxima etapa à consulta ou atualização manual de telas. Isso dificulta a evolução independente dos departamentos e exige refresh manual para que a IBC perceba que uma nova carga foi fechada.

## Princípios

- PostgreSQL é a fonte de verdade do estado atual.
- RabbitMQ transporta eventos, mas não mantém listas ou projeções de negócio.
- Eventos representam fatos de negócio, não operações técnicas.
- Alteração de estado e registro do evento devem ser atômicos.
- Consumidores devem ser idempotentes.
- Falhas devem permitir retry e reprocessamento.
- A migração será incremental e orientada por slices verticais.

## Escopo da primeira entrega

Implementar o fluxo:

```text
Gestão de Cargas
  → PostgreSQL
  → Transactional Outbox
  → RabbitMQ
  → Consumer IBC
  → SSE
  → Browser IBC
  → React Query invalidate/refetch
  → GET /api/ibc/cargas-expedicao
```

O browser não consulta RabbitMQ. O evento apenas informa que o conjunto de cargas pode ter mudado; a API consulta o estado atual no PostgreSQL.

## Evento `CARGA_FECHADA`

O evento é gerado quando uma carga é fechada com sucesso no fluxo de Gestão de Cargas.

Contrato mínimo:

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

O evento não deve transportar pedidos, itens, clientes ou a listagem completa de cargas.

## Transactional Outbox

O fechamento deve persistir, na mesma transação PostgreSQL:

1. A alteração de `Cargas` para `FECHADA`.
2. Os registros já existentes do fechamento, incluindo despacho e snapshot quando aplicável.
3. Um `OutboxEvent` para `CARGA_FECHADA`.

O modelo deve ser genérico para eventos futuros e conter, no mínimo:

- `id`
- `eventType`
- `aggregateType`
- `aggregateId`
- `payload`
- `occurredAt`
- `createdAt`
- `publishedAt`
- `attempts`
- `lastError`
- `lockedAt`

Índices obrigatórios:

- `publishedAt`
- `eventType`
- `[aggregateType, aggregateId]`

O publisher seleciona eventos pendentes, publica com confirmação do RabbitMQ e somente depois preenche `publishedAt`.

## RabbitMQ

- Exchange durável para eventos de domínio.
- Routing key inicial: `carga.fechada`.
- Fila durável do consumidor IBC.
- ACK somente após processamento bem-sucedido.
- Retry para falhas transitórias.
- Dead-letter queue para mensagens inválidas ou que excederem o limite de tentativas.

O RabbitMQ será adicionado ao Docker Compose. O worker será um container separado e hospedará o publisher da Outbox. O backend HTTP continuará hospedando a API e as conexões SSE, além de consumir a fila necessária para notificar os clientes.

## Configuração

Desenvolvimento e produção devem fornecer por ambiente:

- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_USER`
- `RABBITMQ_PASSWORD`
- `RABBITMQ_VHOST`

Credenciais, vhost, exchange e filas de integração devem ser isolados do ambiente de desenvolvimento.

## Idempotência

O consumidor deve registrar o processamento em `ProcessedEvent`, com unicidade por:

```text
consumerName + eventId
```

Uma entrega duplicada não pode produzir novo processamento de negócio nem nova notificação SSE.

## Realtime

O SSE será autenticado usando JWT no header `Authorization`, consumido pelo frontend via `fetch` com leitura de stream.

A notificação enviada aos clientes conterá somente:

- evento `CARGA_FECHADA`;
- `cargaId`;
- `codCar`.

Ao receber o evento, o frontend deve invalidar a query da listagem IBC. Eventos próximos podem ser agrupados por debounce. Ao reconectar o SSE, o frontend deve refazer a listagem.

## Responsabilidades

### Gestão de Cargas

- Montar e fechar a carga.
- Persistir o estado.
- Registrar `CARGA_FECHADA` na Outbox.
- Não chamar diretamente a IBC.

### EDA/Worker

- Publicar eventos pendentes da Outbox.
- Controlar confirmação, tentativas e falhas de publicação.

### IBC/Backend

- Consumir `CARGA_FECHADA`.
- Aplicar idempotência.
- Notificar clientes SSE.
- Continuar consultando a API para obter o estado atual.

### Frontend IBC

- Manter conexão SSE autenticada.
- Receber notificações.
- Invalidar e refazer `/api/ibc/cargas-expedicao`.
- Não tratar RabbitMQ como fonte de dados.

## Fora de escopo

- `CARGA_IBC_FINALIZADA`.
- Novos estados de carga além dos existentes.
- Regras detalhadas de containers IBC.
- Redesenho do snapshot de pedidos.
- Consulta batch de itens Sapiens.
- Cache de negócio no cliente.
- WebSocket.
- Consumidores de outros departamentos.

## Evolução posterior

Depois da primeira entrega, o domínio IBC poderá publicar `CARGA_IBC_FINALIZADA` pela mesma infraestrutura. O próximo departamento poderá consumir esse fato sem acoplamento direto à implementação da IBC.
