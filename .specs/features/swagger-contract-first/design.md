# Design - Swagger Contrato Unico

## Context
Estado atual:
- Swagger configurado em `backend/src/swagger.ts` via `swagger-jsdoc`.
- Coleta por glob (`apis`) favorece annotations dispersas.
- Nao ha garantia de reaproveitamento do mesmo contrato para validacao e OpenAPI.

Direcao:
- Migrar para modelo contract-first com schemas tipados reutilizados por rota e docs.
- Manter compatibilidade com rotas atuais durante migracao incremental.

## Design Decisions

### D1 - Single Source of Truth com schema tipado
- Adotar `zod` para contratos de request/response.
- Gerar OpenAPI a partir desses schemas (ex.: `zod-to-openapi` ou equivalente compativel).
- Middleware de validacao usa o mesmo schema declarado no contrato da rota.

**Rationale**: elimina duplicacao e previne drift entre implementacao e documentacao.

### D2 - Estrutura modular de documentacao por recurso
- `src/docs/schemas/<dominio>.schemas.ts`
- `src/docs/paths/<dominio>.paths.ts`
- `src/docs/swagger.ts` (registro, merge e publish do documento)

**Rationale**: facilita ownership por modulo e escalabilidade com crescimento da API.

### D3 - Catalogo de erros padrao
- Criar schemas compartilhados para erros comuns:
  - `BadRequestError`
  - `UnauthorizedError`
  - `ForbiddenError`
  - `NotFoundError`
  - `ConflictError`
  - `UnprocessableEntityError`
  - `InternalServerError`
- Cada endpoint referencia somente os codigos aplicaveis.

**Rationale**: consistencia de payload e reducao de retrabalho na documentacao.

## Proposed Components

### 1) Contratos de endpoint
Arquivo por recurso contendo:
- schema de entrada (`params/query/body`)
- schema de saida (`responses`)
- metadados OpenAPI (operationId, tags, summary, security)

### 2) Middleware de validacao
Recebe contrato da rota e valida:
- `req.params`
- `req.query`
- `req.body`
Retorna erro padrao documentado em caso de falha.

### 3) Builder OpenAPI
Registra contratos e monta:
- `paths`
- `components.schemas`
- `components.securitySchemes` (quando aplicavel)

### 4) Bootstrap Swagger UI
Publica documento consolidado em `/api/docs`.

## Sequence (request flow)
1. Requisicao chega na rota.
2. Middleware valida contra schema da rota.
3. Controller executa regra de negocio.
4. Resposta serializada conforme schema de sucesso.
5. Mesmo contrato usado para expor endpoint no OpenAPI.

## Migration Plan (incremental)
1. Fase base:
   - criar estrutura `docs/paths` e `docs/schemas`
   - configurar geracao OpenAPI por contratos
   - manter endpoint `/api/docs`
2. Piloto:
   - migrar 1 modulo de alto uso e baixo risco
   - documentar erros aplicaveis completos
3. Escala:
   - migrar modulos restantes por lotes pequenos
   - deprecar annotations antigas apos cobertura minima definida

## Risks and Mitigations
- **Risco**: conflitos entre formato atual de erro e schema padrao.
  - **Mitigacao**: adapter temporario e normalizacao gradual do envelope.
- **Risco**: custo inicial para migrar muitos endpoints.
  - **Mitigacao**: rollout incremental com pilotos e checklist repetivel.
- **Risco**: regressao em validacoes existentes.
  - **Mitigacao**: testes de contrato por endpoint migrado e smoke no Swagger.

## Non-Functional Considerations
- Build: evitar geracao custosa em runtime para todos ambientes.
- DX: contratos simples de declarar e reaproveitar.
- Governance: PR checklist exigindo respostas de erro documentadas.
