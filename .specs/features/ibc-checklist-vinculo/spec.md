# IBC — Vínculo de checklist no IBC (API) Specification

Issue: #277 (fatia 3/5 de #35, parte de #31). Base: `epic/31-modulo-ibc` após o revert do #283 (PR #285).

## Problem Statement

Um IBC pode receber vários checklists de qualidade (ex.: um por produto que vai no container). Os checklists de IBC já são cadastráveis (#276), mas não há como associá-los a um IBC específico. Sem esse vínculo, a futura Inspeção (#272) não sabe quais checklists aplicar em cada container.

## Goals

- [ ] ALMOX/ADMIN vinculam e desvinculam checklists `tipo = IBC` em um IBC via API, com autor e data gravados.
- [ ] Leitura dos vínculos de um IBC disponível para os papéis de leitura do módulo.
- [ ] Aptidão do IBC idêntica antes e depois de qualquer vínculo/desvínculo.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Tela de vínculo no Controle do ativo | Issue #279 (fatia 5) |
| Tela "Checklists de IBC" | Issue #278 (fatia 4) |
| Inspeção / cálculo de aptidão a partir do checklist | Issue #272 |
| Histórico/auditoria de desvínculos | Não pedido na #277; desvínculo remove a linha |
| Vínculo em lote (vários IBCs ou vários checklists por chamada) | Não pedido; um checklist por requisição |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| IBC inexistente ou baixado nas escritas (POST/DELETE) | 404 `IBC_NOT_FOUND` | Mesmo padrão de `SoftDeleteIbc` (baixado = não encontrado para mutação) | n |
| IBC baixado no GET | Lista normalmente; inexistente → 404 `IBC_NOT_FOUND` | Mesmo padrão de `ListIbcHistorico`: leitura de histórico vale para baixado | n |
| Status de `IBC_CHECKLIST_INATIVO` e `IBC_CHECKLIST_TIPO_INVALIDO` | 422 | Alinha com `IBC_CHECKLIST_ITEM_INATIVO` (422) já usado no módulo | n |
| Checklist inexistente no POST | 404 `IBC_CHECKLIST_NOT_FOUND` | Código já existente no módulo | y (issue) |
| Duplicado no POST | 409 `IBC_CHECKLIST_JA_VINCULADO`, inclusive na corrida (violação de unique P2002) | Unique (`ibcId`, `checklistModeloId`) é a garantia final | y (issue) |
| DELETE de vínculo inexistente | 404 `IBC_CHECKLIST_VINCULO_NOT_FOUND` | Desvincular o que não está vinculado é erro do cliente, não no-op silencioso | n |
| Desvincular checklist que ficou inativo | Permitido | Regra da #35: vínculos existentes permanecem e são geridos normalmente | n |
| Desvínculo | Remove a linha (hard delete) | #277 não pede histórico de vínculo | n |
| Autor | `vinculadoPorId` FK para `User` (`onDelete: Restrict`), vindo do JWT | Padrão de autoria do módulo (ex.: `CargaDespacho.fechadoPor`) | n |
| Permissões | GET: ADMIN/ALMOX/LOGISTICA/GERENTE_DPTO; POST/DELETE: ADMIN/ALMOX (403 para os demais) | Mesmo split de `/api/ibc/checklists`; #35 restringe vínculo a ADMIN/ALMOX | y (#35) |
| Respostas | GET 200 `IbcChecklistVinculoDto[]` ordenado por nome do checklist; POST 201 com o DTO; DELETE 204 | Padrão REST do módulo | n |
| DTO | `{ checklistModeloId, nome, ativo, vinculadoEm (ISO), vinculadoPor: { id, nome } }` | Suficiente para a tela #279 mostrar e desvincular | n |
| Corpo do POST | Zod `{ checklistModeloId: uuid }`; inválido → 400 `IBC_CHECKLIST_VINCULO_INVALID_BODY` | Padrão `invalidBody` do `IbcChecklistController` | n |
| Banco local que aplicou a migration do #283 | Rodar `prisma migrate reset` ou dropar a tabela + linha em `_prisma_migrations` antes da nova migration | O revert remove a migration `20261007100000_ibc_checklist_vinculo` | n |

**Open questions:** none — os itens `Confirmed? n` são defaults propostos para você aprovar junto com o plano.

---

## User Stories

### P1: Listar checklists vinculados a um IBC ⭐ MVP

**User Story**: Como ALMOX/LOGISTICA/GERENTE_DPTO/ADMIN, quero ver quais checklists estão vinculados a um IBC para saber o que será inspecionado nele.

**Why P1**: Base de leitura para a tela #279 e para verificar vínculos/desvínculos.

**Acceptance Criteria**:

1. WHEN `GET /api/ibc/:id/checklists` é chamado para um IBC existente THEN o sistema SHALL responder 200 com a lista de vínculos ordenada por nome do checklist, cada um com `checklistModeloId`, `nome`, `ativo`, `vinculadoEm` e `vinculadoPor { id, nome }`.
2. WHEN o IBC não tem vínculos THEN o sistema SHALL responder 200 com `[]`.
3. IF o IBC não existe THEN o sistema SHALL responder 404 `IBC_NOT_FOUND`.
4. WHEN um checklist vinculado foi desativado depois THEN o sistema SHALL continuar listando o vínculo com `ativo: false`.
5. IF o usuário não tem papel de leitura do módulo THEN o sistema SHALL responder 403.

**Independent Test**: Integração HTTP com vínculos semeados direto no banco.

---

### P1: Vincular checklist a um IBC ⭐ MVP

**User Story**: Como ALMOX/ADMIN, quero vincular um checklist de IBC a um container para que ele seja aplicado nas inspeções daquele IBC.

**Why P1**: Objetivo central da #277.

**Acceptance Criteria**:

1. WHEN `POST /api/ibc/:id/checklists` recebe `{ checklistModeloId }` de um checklist `tipo = IBC` ativo e ainda não vinculado THEN o sistema SHALL criar o vínculo com o usuário do JWT como autor e a data atual, e responder 201 com o DTO.
2. IF o checklist não existe THEN o sistema SHALL responder 404 `IBC_CHECKLIST_NOT_FOUND`.
3. IF o checklist tem `tipo = VISTORIA` THEN o sistema SHALL responder 422 `IBC_CHECKLIST_TIPO_INVALIDO`.
4. IF o checklist está inativo THEN o sistema SHALL responder 422 `IBC_CHECKLIST_INATIVO`.
5. IF o checklist já está vinculado ao IBC THEN o sistema SHALL responder 409 `IBC_CHECKLIST_JA_VINCULADO`.
6. IF duas requisições simultâneas tentam o mesmo vínculo THEN o sistema SHALL criar um único vínculo e responder 409 `IBC_CHECKLIST_JA_VINCULADO` à outra.
7. IF o IBC não existe ou está baixado THEN o sistema SHALL responder 404 `IBC_NOT_FOUND`.
8. IF o corpo não traz `checklistModeloId` UUID THEN o sistema SHALL responder 400 `IBC_CHECKLIST_VINCULO_INVALID_BODY`.
9. IF o papel não é ADMIN nem ALMOX THEN o sistema SHALL responder 403.
10. WHEN o vínculo é criado THEN o sistema SHALL manter `aptidao`, `motivoInaptidao` e `primeiraInspecaoEm` do IBC iguais aos de antes.

**Independent Test**: Integração HTTP: vincular e conferir via GET + leitura da linha do IBC.

---

### P1: Desvincular checklist de um IBC ⭐ MVP

**User Story**: Como ALMOX/ADMIN, quero remover um checklist vinculado por engano ou que não se aplica mais ao container.

**Why P1**: Critério de aceite da #277.

**Acceptance Criteria**:

1. WHEN `DELETE /api/ibc/:id/checklists/:checklistModeloId` é chamado para um vínculo existente THEN o sistema SHALL remover o vínculo e responder 204.
2. IF o vínculo não existe THEN o sistema SHALL responder 404 `IBC_CHECKLIST_VINCULO_NOT_FOUND`.
3. IF o IBC não existe ou está baixado THEN o sistema SHALL responder 404 `IBC_NOT_FOUND`.
4. WHEN o checklist vinculado está inativo THEN o sistema SHALL permitir o desvínculo (204).
5. IF o papel não é ADMIN nem ALMOX THEN o sistema SHALL responder 403.
6. WHEN o vínculo é removido THEN o sistema SHALL manter `aptidao`, `motivoInaptidao` e `primeiraInspecaoEm` do IBC iguais aos de antes.

**Independent Test**: Integração HTTP: vincular, desvincular, GET retorna `[]`.

---

## Edge Cases

- IF `:id` não é UUID válido THEN o sistema SHALL responder 404 `IBC_NOT_FOUND` (sem 500 de cast do Postgres).
- WHEN o mesmo checklist é vinculado a dois IBCs diferentes THEN o sistema SHALL aceitar ambos (unicidade é por par IBC + checklist).
- WHEN um checklist é desvinculado e vinculado de novo THEN o sistema SHALL aceitar e gravar novo autor/data.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| IBCVINC-01 | P1: Persistência do vínculo (tabela + unique + autor/data) | Execute | Done |
| IBCVINC-02 | P1: Listar vínculos (GET) | Execute | Done |
| IBCVINC-03 | P1: Vincular (POST) + recusas | Execute | Done |
| IBCVINC-04 | P1: Desvincular (DELETE) | Execute | Done |
| IBCVINC-05 | P1: Aptidão inalterada | Execute | Done |
| IBCVINC-06 | P1: Autorização por papel | Execute | Done |
| IBCVINC-07 | Documentação de domínio (CONTEXT.md) | Execute | Done |

**Coverage:** 7 total, 7 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Critérios de aceite da #277 cobertos por testes de integração (vincular, desvincular, recusas inativo/VISTORIA/duplicado, aptidão igual).
- [ ] `npm test` e `npm run test:integration` verdes no backend.
