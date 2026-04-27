# PR Tecnica - Implantacao Swagger Contract-First (Piloto Users)

## Titulo sugerido
`tech: migrate users to contract-first swagger via zod`

## Contexto
Esta PR tecnica define a implantacao (com refatoracao incremental) da documentacao da API para um modelo de contrato unico, onde:
- o schema valida request/response
- o mesmo schema gera OpenAPI
- a rota consome esse mesmo contrato

Objetivo principal: reduzir divergencia entre codigo real, validacao e documentacao.

## Escopo desta PR tecnica
- Migrar Swagger para builder OpenAPI por imports (sem `@openapi` inline em rotas/controllers).
- Implantar estrutura modular:
  - `src/docs/openapi/*` (builder e tipos de contrato)
  - `src/docs/paths/*` (paths por dominio)
  - `src/docs/schemas/*` (schemas compartilhados e de dominio)
  - `src/docs/swagger.ts` (bootstrap do `/api/docs`)
- Entregar modulo piloto `users` com contrato unico para validacao + documentacao.
- Documentar codigos de erro aplicaveis alem de `200`.

## Proposta tecnica

### 1) Contrato unico por endpoint
- Adotar schema tipado (Zod) para entrada/saida.
- Usar o mesmo contrato no middleware de validacao.
- Gerar OpenAPI a partir dos schemas com `zod-to-json-schema`.

### 2) OpenAPI modular por dominio
- `docs/schemas`: objetos de dominio e erros padrao.
- `docs/paths`: operacoes por recurso (responses, params, security).
- `docs/swagger.ts`: agregacao e publicacao do documento em `/api/docs`.
- `features/users/contracts`: contrato de rota (request/response + metadata OpenAPI).

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
2. Migracao do modulo piloto `users`.
3. Ajustes de padrao com feedback do time.
4. Migracao incremental dos demais modulos.

## Criterios de aceite
- Swagger em `/api/docs` gerado por contratos tipados.
- Endpoints de `users` com request/response/erros documentados no novo padrao.
- Erros alem de `200` visiveis e consistentes com comportamento runtime.
- Rotas permanecem limpas, sem annotations inline.

## Test plan (checklist)
- [x] Build TypeScript do backend passa.
- [x] Swagger monta documento a partir de imports modulares.
- [x] Validacao de `params/query/body` ligada via contrato no modulo `users`.
- [x] OpenAPI inclui respostas `2xx` e `4xx/5xx` aplicaveis para `users`.
