# Overview Customer

Customer Overview (visão 360º): read model no Postgres alimentado por sync noturno das consultas Senior versionadas em `docs/prd/overview-customer/sql/`.

## Language

**Sync run**:
Uma execução do pipeline overnight (ou disparada por admin). Tem steps nomeados e status RUNNING | SUCCEEDED | FAILED.
_Avoid_: job genérico, cron tick sem registro

**Sync step**:
Unidade nomeada do pipeline (ex.: dados-gerais-cliente, resumo-comercial, ganhos-por-grupo). Retry budget: até 3 attempts.
_Avoid_: retry do pipeline inteiro neste slice

**Served snapshot**:
O read model publicado que a API serve. Só troca em publish atômico após todos os steps required sucederem.
_Avoid_: servir dados de um run FAILED

**lastSuccessfulSyncAt**:
Timestamp do último publish bem-sucedido. Não avança em falha.
_Avoid_: finishedAt de run failed

## Seams

- `OverviewCustomerSyncPipeline` — orquestração (retry, publish/retain, concurrency, retryFailedStep)
- HTTP `/api/overview/sync/*` — ADMIN-only admin surface (status, list runs, retry failed step)
