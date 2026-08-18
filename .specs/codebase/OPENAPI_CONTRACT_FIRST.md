# Convenções — API contract-first (Swagger / OpenAPI + Zod)

Este documento fixa o padrão adotado no backend para evitar divergência entre **código**, **validação** e **documentação OpenAPI**. Use-o em toda feature nova e ao migrar rotas existentes.

---

## 1. Princípios

- **Uma fonte de verdade**: o mesmo contrato em **Zod** descreve entrada (`params` / `query` / `body`), saída (`responses` quando fizer sentido) e o que o Swagger exibe.
- **Rotas e controllers limpos**: **não** inserir blocos `@openapi`, JSDoc de paths ou anotações de Swagger dentro de arquivos de rota ou controller.
- **Módulo por módulo**: documentação e contratos crescem **por feature**; migração **incremental** (não precisa fechar tudo de uma vez).
- **Alinhado ao time**: o que o Swagger documenta deve refletir o comportamento real (status, corpo e erros).
- **Build**: em linha com as regras do projeto, **não** usar `build` automático pós-mudança para “validar” — revisar contrato, tipos e consistência.

---

## 2. Estrutura de pastas (referência)

```
backend/src/
  docs/
    openapi/          # Tipos de contrato + geração do documento OpenAPI
    paths/            # Reexporta contratos do domínio para o agregador (sem lógica de negócio)
    schemas/          # Schemas compartilhados (ex.: erros padrão)
    swagger.ts        # Registro do Swagger UI + montagem do spec
  features/<domínio>/
    routes/           # Só: router, middleware validate, controller
    schemas/          # Zod: request + response do domínio (fonte única por domínio)
    contracts/        # RouteContract[] por feature (metadata OpenAPI + ligação aos Zods)
  swagger.ts          # Pode reexportar setup a partir de docs/swagger.ts
```

- **`features/<domínio>/schemas`**: reúne **tudo** o que o domínio precisa de Zod (incluindo shapes de resposta usados no OpenAPI e, quando aplicável, validação de saída).
- **`docs/schemas`**: reservar para o que for **transversal** (ex.: envelope de erro comum), não duplicar modelos de domínio que já estão no feature.

---

## 3. Fluxo de uma feature

1. Definir ou estender **schemas Zod** em `features/<domínio>/schemas/*.ts` (params, query, body e, se existir no contrato, responses).
2. Definir **`RouteContract[]`** em `features/<domínio>/contracts/<domínio>.contracts.ts`:
   - `method`, `path` (incluindo prefixo `/api/...` como na app),
   - `summary`, `tags`,
   - `validationSchema` (objeto com `body` / `query` / `params` como já usado com o middleware `validate`),
   - `request`: `params`, `query`, `body` a partir de `.shape` dos schemas, quando fizer sentido para o OpenAPI,
   - `responses`: sucesso (2xx) + **erros aplicáveis** (não só 200).
3. **Registrar** a lista de contratos em `docs/paths/<domínio>.paths.ts` (reexport) e somar no `buildOpenApi` em `docs/swagger.ts`.
4. Na **rota**: usar `validate(<contrato>.validationSchema!)` (ou equivalente) **sem** documentação inline no arquivo.
5. No **controller**: manter parsing/handlers; idealmente o schema de request já ter sido aplicado no middleware; responses podem ser inferidas do contrato conforme a equipe for evoluindo o padrão.

---

## 4. O que nunca fazer

- Não manter **dois** lugares com o mesmo shape (ex.: `user.schemas` em `docs` **e** em `features/users/schemas` com campos duplicados).
- Não gerar OpenAPI só com comentários ou `swagger-jsdoc` espalhado — o **documento** deve nascer do **contrato importado** e dos Zods.
- Não documentar só `200` em endpoints reais: incluir códigos de erro **relevantes** (ver seção 5).

---

## 5. Erros no OpenAPI (mínimo esperado)

Para cada operação, documentar os status **aplicáveis** ao negócio e à autenticação, por exemplo:

| Status | Uso típico |
|--------|------------|
| `400` | Validação de entrada (Zod) |
| `401` | Não autenticado |
| `403` | Autenticado, sem permissão |
| `404` | Recurso não encontrado |
| `409` | Conflito de estado / regra de domínio |
| `422` | Regra de negócio / semântica (quando fizer distinção de 400) |
| `500` | Erro interno |

Reutilizar schemas de erro comuns (ex. em `docs/schemas/error.schemas.ts`) e referenciar os mesmos **component names** estáveis no contrato (ex.: `ValidationError`, `NotFoundError`) para o Swagger listar `components.schemas` de forma previsível.

---

## 6. Pontos de extensão

- **Novo módulo**: copiar o padrão do piloto (contratos + `docs/paths` + entrada no `buildOpenApi`).
- **Mudança de contrato**: alterar o Zod no feature → validação e spec acompanham se o contrato e as rotas estiverem alinhados.
- **Exemplos no Swagger** (futuro): podem ser adicionados no builder OpenAPI ou nos contratos, **sem** poluir as rotas.

---

## 7. Rastreabilidade

- Especificação de produto do padrão: [`.specs/features/swagger-contract-first/spec.md`](../features/swagger-contract-first/spec.md)
- Regras gerais de backend (incl. Swagger e “não rodar build”): [`.cursor/skills/rules/backend-role.md`](../../.cursor/skills/rules/backend-role.md)
