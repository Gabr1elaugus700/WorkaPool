# PR Tecnica - Implantacao Swagger Contract-First

## Titulo sugerido
`tech: implantar swagger contract-first com zod e docs modulares`

## Contexto
Esta PR tecnica define a implantacao (com refatoracao incremental) da documentacao da API para um modelo de contrato unico, onde:
- o schema valida request/response
- o mesmo schema gera OpenAPI
- a rota consome esse mesmo contrato

Objetivo principal: reduzir divergencia entre codigo real, validacao e documentacao.

## Escopo desta PR tecnica
- Definir arquitetura alvo para docs modulares:
  - `src/routes/*.routes.ts` (rotas existentes)
  - `src/docs/paths/*.paths.ts`
  - `src/docs/schemas/*.schemas.ts`
  - `src/docs/swagger.ts`
- Definir padrao de erros documentados por endpoint (alem de `200`).
- Definir estrategia de rollout incremental por modulos.

## Proposta tecnica

### 1) Contrato unico por endpoint
- Adotar schema tipado (Zod) para entrada/saida.
- Usar o mesmo contrato no middleware de validacao.
- Gerar OpenAPI a partir dos schemas.

### 2) OpenAPI modular por dominio
- `docs/schemas`: objetos de dominio e erros padrao.
- `docs/paths`: operacoes por recurso (responses, params, security).
- `docs/swagger.ts`: agregacao e publicacao do documento em `/api/docs`.

### 3) Erros obrigatorios na documentacao
Cada endpoint deve documentar os erros aplicaveis, incluindo:
- `400`, `401`, `403`, `404`, `409`, `422`, `500`

Obs.: nem todos os codigos se aplicam a todas as rotas, mas `500` e erros de entrada/autorizacao aplicaveis nao podem ser omitidos.

## Impacto esperado
- Menos retrabalho ao alterar contratos.
- Menor chance de divergencia entre runtime e Swagger.
- Melhor previsibilidade para clientes da API.

## Riscos e mitigacao
- **Formato de erro legado inconsistente**: criar adapter de transicao.
- **Custo inicial de migracao**: rollout por lotes pequenos com modulo piloto.
- **Regressao de validacao**: testes de contrato por rota migrada.

## Rollout
1. Infra base (`docs/swagger.ts`, schemas de erro compartilhados).
2. Migracao de endpoint/modulo piloto.
3. Ajustes de padrao com feedback do time.
4. Migracao incremental dos demais modulos.

## Criterios de aceite
- Swagger em `/api/docs` gerado por contratos tipados.
- Endpoint piloto com request/response/erros documentados no novo padrao.
- Erros alem de `200` visiveis e consistentes com comportamento runtime.
- Guia/checklist para novas rotas definido.

## Test plan (checklist)
- [ ] Swagger sobe localmente sem erro.
- [ ] Endpoint piloto aceita payload valido e rejeita invalido com erro documentado.
- [ ] OpenAPI contem schemas reutilizaveis de erro.
- [ ] OpenAPI do piloto contem 2xx + erros aplicaveis (4xx/5xx).
