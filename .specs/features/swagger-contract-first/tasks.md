# Tasks - Swagger Contrato Unico

## T1 - Infra base de Swagger modular
**Depends on**: none  
**What**:
- Criar `src/docs/swagger.ts` para consolidar paths/schemas.
- Preparar registro central de componentes e paths.
- Garantir publicacao em `/api/docs` mantendo compatibilidade.

**Done when**:
- Swagger sobe sem erro no ambiente local.
- Documento consolidado aparece no Swagger UI.

**Tests / Verification**:
- Subir backend e abrir `/api/docs`.
- Validar que documento contem `openapi`, `paths` e `components`.

**Gate**: Pass

---

## T2 - Schemas compartilhados de erro
**Depends on**: T1  
**What**:
- Criar `docs/schemas/error.schemas.ts` com envelope padrao.
- Expor schemas de `400/401/403/404/409/422/500`.

**Done when**:
- Schemas de erro reutilizaveis registrados em `components.schemas`.
- Endpoint piloto consegue referenciar os schemas sem duplicacao.

**Tests / Verification**:
- Inspecionar JSON OpenAPI e confirmar referencias dos erros.

**Gate**: Pass

---

## T3 - Contrato unico para endpoint piloto
**Depends on**: T1, T2  
**What**:
- Escolher endpoint piloto.
- Definir schema unico de entrada/saida com Zod.
- Aplicar middleware de validacao usando o mesmo contrato.
- Registrar docs em `docs/paths` e `docs/schemas` do dominio.

**Done when**:
- Validacao runtime usa schema unico do endpoint.
- Swagger do endpoint piloto apresenta sucesso e erros aplicaveis.

**Tests / Verification**:
- Teste de request valido (2xx).
- Teste de payload invalido (400/422 conforme regra).
- Verificacao visual no Swagger UI dos codigos de erro.

**Gate**: Pass

---

## T4 - Guia de padrao para novas rotas
**Depends on**: T3  
**What**:
- Documentar template de contrato por rota.
- Adicionar checklist de PR:
  - request schema
  - response schema
  - erros aplicaveis
  - exemplos

**Done when**:
- Time consegue criar nova rota sem annotations duplicadas.

**Tests / Verification**:
- Revisao por par usando rota de exemplo.

**Gate**: Pass

---

## T5 - Plano de migracao dos modulos existentes
**Depends on**: T4  
**What**:
- Listar modulos/rotas por prioridade.
- Definir lotes pequenos de migracao.
- Registrar riscos por modulo (autenticacao, erro legado, alta criticidade).

**Done when**:
- Backlog de migracao com ordem de execucao e criterio de pronto.

**Tests / Verification**:
- Revisao tecnica do backlog com o time.

**Gate**: Pass
