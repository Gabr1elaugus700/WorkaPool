# API Docs Contrato Unico (Swagger + Zod)

## Problem Statement

Hoje a documentacao OpenAPI depende de annotations espalhadas e de varredura por arquivos, o que aumenta divergencia entre:

- validacao real da rota
- contrato de request/response
- documentacao publicada no Swagger

Ja existe `backend/src/swagger.ts`, mas o formato atual nao garante "single source of truth" para schemas de entrada/saida nem cobertura sistematica de erros por endpoint.

## Goals

- Implantar padrao de contrato unico: o mesmo schema valida request/response e gera OpenAPI.
- Refatorar a estrutura de documentacao para `docs/paths` e `docs/schemas`, sem quebrar rotas existentes.
- Garantir documentacao de codigos de erro (4xx/5xx) alem de `200`.
- Definir trilha de migracao incremental por modulo/rota.

## Out of Scope

- Reescrever todas as rotas de uma vez.
- Alterar regras de negocio dos endpoints.
- Trocar framework HTTP atual.

## User Stories

### P1: Contrato unico por rota

**User Story**: Como dev backend, quero definir um schema unico por endpoint para validar payload e gerar OpenAPI, para reduzir duplicacao e inconsistencias.

**Why P1**: Sem contrato unico, codigo, validacao e documentacao divergem com frequencia em manutencao de medio/longo prazo.

**Acceptance Criteria**:

1. WHEN uma rota for migrada THEN a API SHALL usar schema tipado unico para `params`, `query`, `body` e `responses`.
2. WHEN o contrato mudar THEN a validacao em runtime e o OpenAPI SHALL refletir a mudanca sem edicao duplicada em arquivo separado de anotacao.
3. WHEN o schema nao for atendido THEN a API SHALL retornar erro de validacao documentado no OpenAPI.

**Independent Test**: Alterar um campo obrigatorio no schema de uma rota migrada e confirmar que validacao e Swagger mudam de forma consistente.

---

### P2: Estrutura modular de docs por dominio

**User Story**: Como time backend, quero separar `paths` e `schemas` por feature para facilitar navegacao e evolucao da documentacao.

**Why P2**: Estrutura modular evita arquivo monolitico e melhora ownership por modulo.

**Acceptance Criteria**:

1. WHEN a estrutura for implantada THEN o projeto SHALL conter `src/docs/paths/`* e `src/docs/schemas/*` por dominio.
2. WHEN uma nova rota for criada THEN o time SHALL conseguir localizar rapidamente seu contrato e documentacao no modulo correspondente.
3. WHEN o Swagger iniciar THEN o agregador SHALL montar o OpenAPI a partir dos modulos sem depender de annotations avulsas.

**Independent Test**: Criar uma rota piloto documentada no novo padrao e validar que aparece no `/api/docs`.

---

### P3: Padrao minimo de erros documentados

**User Story**: Como consumidor da API, quero ver no Swagger os erros esperados de cada endpoint para implementar tratamento adequado no cliente.

**Why P3**: Documentar somente `200` gera retrabalho em integracao e incidentes por interpretacao incorreta de falhas.

**Acceptance Criteria**:

1. WHEN um endpoint for documentado THEN o OpenAPI SHALL incluir ao menos `400`, `401` (quando autenticado), `403` (quando autorizado), `404` (quando aplicavel), `409` (conflito aplicavel), `422` (validacao semantica aplicavel) e `500`.
2. WHEN existir envelope padrao de erro THEN os responses de erro SHALL reutilizar schema comum no `components/schemas`.
3. WHEN houver erro de validacao THEN a resposta SHALL mapear para schema de erro conhecido e documentado.

**Independent Test**: Para endpoint piloto, validar no Swagger UI presenca dos codigos de erro e exemplos de payload.

---

## Proposed Architecture (high level)

- `src/routes/*.routes.ts` (rotas existentes e registradores)
- `src/docs/schemas/*.schemas.ts` (schemas de dominio + erro padrao)
- `src/docs/paths/*.paths.ts` (operacoes OpenAPI por recurso)
- `src/docs/swagger.ts` (agregador OpenAPI + bootstrap do Swagger UI)
- `src/contracts/`* (opcional: contratos Zod compartilhados entre rota e docs)

## Migration Strategy

1. Criar infraestrutura base (schemas comuns, agregador, setup Swagger).
2. Migrar 1-2 modulos pilotos para validar ergonomia e padrao.
3. Definir checklist de migracao para demais modulos.
4. Migrar incrementalmente sem bloquear entregas de features.

## API Documentation Contract (baseline)

Para cada endpoint migrado:

- Request: schema de `params`, `query`, `body` (quando aplicavel)
- Success: schema de `2xx`
- Error: schemas padrao de `4xx/5xx` aplicaveis
- Security: declaracao de requisitos (bearer/jwt) quando necessario
- Exemplos: ao menos um exemplo de sucesso e um de erro relevante

## Requirement Traceability


| Requirement ID | Story                                     | Phase   | Status  |
| -------------- | ----------------------------------------- | ------- | ------- |
| SWS-01         | P1: Contrato unico por rota               | Specify | Pending |
| SWS-02         | P2: Estrutura modular de docs por dominio | Specify | Pending |
| SWS-03         | P3: Padrao minimo de erros documentados   | Specify | Pending |


## Success Criteria

- Existe estrutura `docs/paths` e `docs/schemas` integrada ao bootstrap Swagger.
- Endpoint(s) piloto(s) migrados usando contrato unico (schema valida + schema documenta).
- Swagger dos endpoints migrados exibe sucesso e erros padronizados alem de `200`.
- Time possui guia de migracao para expandir cobertura com baixo risco.

