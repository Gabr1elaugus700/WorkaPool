# IBC — Inspeção por checklist Specification

Issue: #272 (epic `epic/272-ibc-inspecao`, aninhada na #31). Fatias: #302 (modelo + avaliação), #303 (use-case + aptidão), #304 (POST), #305 (histórico + alerta), #306 (tela de inspeção), #307 (histórico e alertas na UI). Decisões fechadas: comentário de plano na #272.

## Problem Statement

Os checklists de IBC já são cadastráveis e vinculáveis a cada container (#35), mas não há como registrar a inspeção: dar nota a cada item, saber se o IBC está Apto ou Inapto e consultar o que foi avaliado. Sem isso, um IBC com problema de qualidade continua alocável e o alerta "Sem inspeção" (#271) nunca some.

## Goals

- [ ] ALMOX/ADMIN registram inspeção de um checklist vinculado, com nota inteira 0–10 por item ativo, e obtêm APROVADA/REPROVADA pela regra híbrida do checklist.
- [ ] Inspeção reprovada torna o IBC Inapto (`INSPECAO_REPROVADA`) e bloqueia alocação; aprovação em todos os checklists inspecionados devolve Apto.
- [ ] Histórico de inspeções consultável com snapshot dos limites e dos itens; alerta `INSPECAO_REPROVADA` detalhado.
- [ ] Fluxo demoável na UI: inspecionar com "Checklist Soda", reprovar, ver alerta, reinspecionar, voltar a Apto.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Fechar expedição barrar IBC Inapto alocado | Hoje a expedição não checa aptidão; fora da #272 |
| Entrada no pátio / destino de `AGUARDANDO_INSPECAO` | Issue #273 |
| Editar ou excluir inspeção registrada | Não pedido; histórico é imutável |
| Escala 0–5 estrelas | Decisão fechada: nota inteira 0–10 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Escala da nota | Inteira 0–10 por item ativo | Fecha o "Scale TBD" do `CONTEXT.md` | y (#272) |
| Regra de aprovação | Todo crítico ≥ `notaMinimaCritico` **e** média dos não críticos ≥ `mediaMinima`; sem não críticos só vale o crítico; limite exato aprova | Limites pertencem ao checklist | y (#272) |
| Média sem itens não críticos | `mediaObtida = null` | Não há média a comparar | y (#272) |
| Retorno a Apto | Só checklists vinculados que já têm inspeção contam; a última de cada um precisa estar aprovada | Vínculo nunca inspecionado não bloqueia | y (#272) |
| IBC alocado reprovado | Grava, vira `INAPTO`/`INSPECAO_REPROVADA`, alocação mantida, resposta traz `aviso: { code: "IBC_ALOCADO_INAPTO", codCar, numPed }` | ALMOX decide o que fazer com a alocação | y (#272) |
| DATA_LIMITE | Prevalece (já marcado ou vencendo agora): inspeção gravada, aptidão `INAPTO`/`DATA_LIMITE` | Data limite é bloqueio definitivo | y (#272) |
| Aprovação limpa motivos | Limpa `INSPECAO_REPROVADA` e `AGUARDANDO_INSPECAO` | Prepara a #273 | y (#272) |
| `primeiraInspecaoEm` | Gravado só na primeira inspeção aprovada | Remove "Sem inspeção" | y (#272) |
| Snapshots | Por inspeção: `notaMinimaCritico`, `mediaMinima`, `mediaObtida`; por resposta: `critico` e `descricao` | Alterar checklist/item depois não reescreve histórico | y (#272) |
| Concorrência | Grava e recalcula aptidão na mesma transação, com `SELECT ... FOR UPDATE` na linha do `Ibc` | Duas inspeções simultâneas não deixam aptidão inconsistente | y (#272) |
| Permissões | Escrita ADMIN/ALMOX; leitura ADMIN/ALMOX/LOGISTICA/GERENTE_DPTO; escopo no use-case | Mesmo split de `/api/ibc/checklists` | y (#272) |
| Tabelas | `IbcInspecao` e `IbcInspecaoResposta` próprias, com FK para `ChecklistModelo`/`ChecklistItem`; migration aditiva sem tocar Vistoria | Isola o IBC do módulo de Vistoria | y (#302) |

**Open questions:** none — todas as decisões foram fechadas no comentário de plano da #272.

---

## User Stories

### P1: Modelo persistente e regra de avaliação ⭐ MVP (fatia 1, #302)

**User Story**: Como sistema, preciso guardar inspeções com snapshots e avaliar notas de forma determinística para que todas as fatias usem a mesma regra.

**Why P1**: Base de todas as outras fatias.

**Acceptance Criteria**:

1. WHEN todas as notas de itens críticos são ≥ `notaMinimaCritico` e a média dos não críticos é ≥ `mediaMinima` THEN `avaliarInspecaoIbc` SHALL retornar `APROVADA` com a média obtida.
2. IF algum item crítico tem nota < `notaMinimaCritico` THEN `avaliarInspecaoIbc` SHALL retornar `REPROVADA`.
3. IF a média dos itens não críticos é < `mediaMinima` THEN `avaliarInspecaoIbc` SHALL retornar `REPROVADA`.
4. WHEN só há itens críticos THEN `avaliarInspecaoIbc` SHALL retornar `mediaObtida = null` e avaliar apenas a regra do crítico.
5. The schema SHALL ter `IbcInspecao` (snapshots de limites, média, inspetor com `Restrict`, índice `(ibcId, checklistModeloId, inspecionadoEm)`) e `IbcInspecaoResposta` (cascade da inspeção, unique `(inspecaoId, checklistItemId)`, snapshots `critico` e `descricao`), além do valor `INSPECAO_REPROVADA` em `IbcMotivoInaptidao`.

**Independent Test**: Unit da função pura com 4 exemplos literais; `npx prisma validate`.

---

### P1: Registrar inspeção e recalcular aptidão ⭐ MVP (fatias 2 e 3, #303 e #304)

**User Story**: Como ALMOX/ADMIN, quero registrar a inspeção de um checklist vinculado ao IBC para que a aptidão dele reflita a qualidade do container.

**Why P1**: Objetivo central da #272.

**Acceptance Criteria**:

1. WHEN `POST /api/ibc/:id/inspecoes` recebe `{ checklistModeloId, respostas: [{ checklistItemId, nota }], observacao? }` válido THEN o sistema SHALL gravar a inspeção e as respostas com snapshots e responder 201 com o DTO da inspeção e `ibc: { aptidao, motivoInaptidao, primeiraInspecaoEm }`.
2. IF o papel não é ADMIN nem ALMOX THEN o sistema SHALL responder 403.
3. IF o corpo é inválido ou alguma nota está fora de 0–10 ou não é inteira THEN o sistema SHALL responder 400 `IBC_INSPECAO_INVALID_BODY`.
4. IF o IBC não existe, está baixado ou `:id` não é UUID THEN o sistema SHALL responder 404 `IBC_NOT_FOUND`.
5. IF o IBC está Em viagem THEN o sistema SHALL responder 409 `IBC_EM_VIAGEM`.
6. IF o checklist não está vinculado ao IBC THEN o sistema SHALL responder 422 `IBC_CHECKLIST_NAO_VINCULADO`.
7. IF o checklist está inativo THEN o sistema SHALL responder 422 `IBC_CHECKLIST_INATIVO`.
8. IF falta nota de algum item ativo, ou há item estranho ou duplicado THEN o sistema SHALL responder 422 `IBC_INSPECAO_RESPOSTAS_INCOMPLETAS`.
9. WHEN várias recusas se aplicam THEN o sistema SHALL responder com a primeira na ordem 403, 400, 404, 409, 422 não vinculado, 422 inativo, 422 incompleta.
10. WHEN a inspeção é reprovada THEN o sistema SHALL marcar o IBC `INAPTO`/`INSPECAO_REPROVADA`, e a alocação SHALL ser recusada com `IBC_INAPTO`.
11. WHEN a última inspeção de cada checklist vinculado já inspecionado está aprovada THEN o sistema SHALL marcar o IBC `APTO` e limpar `INSPECAO_REPROVADA` e `AGUARDANDO_INSPECAO`.
12. WHILE o IBC tem `DATA_LIMITE` marcado ou vencendo agora THEN o sistema SHALL gravar a inspeção e manter `INAPTO`/`DATA_LIMITE`.
13. WHEN a inspeção é a primeira aprovada do IBC THEN o sistema SHALL gravar `primeiraInspecaoEm`; inspeção reprovada SHALL NOT gravá-lo.
14. WHEN o IBC reprovado tem `AlocacaoIbc` aberta THEN o sistema SHALL manter a alocação e responder com `aviso: { code: "IBC_ALOCADO_INAPTO", codCar, numPed }`.
15. WHEN duas inspeções do mesmo IBC são registradas ao mesmo tempo THEN o sistema SHALL gravar cada inspeção e recalcular a aptidão na mesma transação, com `SELECT ... FOR UPDATE` na linha do `Ibc`, de modo que a aptidão final reflita as duas.

**Independent Test**: Unit de `resolverAptidaoIbc` e do use-case; integração HTTP do POST.

---

### P1: Histórico e alerta de reprovação na API ⭐ MVP (fatia 4, #305)

**User Story**: Como ALMOX/LOGISTICA/GERENTE_DPTO/ADMIN, quero consultar as inspeções de um IBC e ver alerta das reprovadas.

**Why P1**: Critérios de histórico e alerta da #272.

**Acceptance Criteria**:

1. WHEN `GET /api/ibc/:id/inspecoes` é chamado THEN o sistema SHALL responder 200 com as inspeções, mais recente primeiro, com limites, média, inspetor, observação e respostas com `descricao`, `critico` e `nota` do momento da inspeção.
2. IF o IBC não existe THEN o sistema SHALL responder 404 `IBC_NOT_FOUND`; IBC baixado SHALL ser listado normalmente.
3. IF o papel não tem leitura do módulo THEN o sistema SHALL responder 403.
4. WHEN a última inspeção de algum checklist vinculado está reprovada THEN `ListIbcAlerts` SHALL listar `INSPECAO_REPROVADA` com identificador e `detalhes: { checklists: [{ checklistModeloId, nome, mediaObtida, mediaMinima, itensAbaixoDoMinimo: [{ descricao, nota, notaMinima }] }], alocacao?: { codCar, numPed } }`, em consulta em lote (sem N+1).
5. WHEN o checklist é reinspecionado e aprovado THEN o alerta `INSPECAO_REPROVADA` daquele checklist SHALL deixar de aparecer.
6. WHEN o IBC também está Inapto por `DATA_LIMITE` THEN `ListIbcAlerts` SHALL listar os dois alertas (`DATA_LIMITE` e `INSPECAO_REPROVADA`).

**Independent Test**: Unit de `ListIbcAlerts`/`ListIbcInspecoes`; integração do GET com snapshot preservado após alterar item e limites.

---

### P2: Tela de inspeção no Controle do ativo (fatia 5, #306)

**User Story**: Como ALMOX, quero inspecionar um IBC a partir do pool, escolhendo o checklist e dando nota a cada item.

**Why P2**: Depende da API; é a entrada operacional do fluxo.

**Acceptance Criteria**:

1. WHEN o operador abre "Inspecionar" em um IBC no pátio THEN a UI SHALL listar os checklists vinculados ativos e, ao escolher um, os itens ativos com marca de crítico e limites visíveis.
2. WHILE alguma nota de item ativo está vazia ou fora de 0–10 THEN a UI SHALL manter o botão de salvar desabilitado.
3. WHEN a inspeção é salva THEN a UI SHALL mostrar o resultado (Aprovada/Reprovada e média) e atualizar pool e alertas.
4. WHEN a resposta traz `aviso.code = IBC_ALOCADO_INAPTO` THEN a UI SHALL mostrar a carga e o pedido afetados.
5. IF o IBC está Em viagem ou foi substituído THEN a UI SHALL ocultar o botão "Inspecionar".

**Independent Test**: Unit dos utils de inspeção; demo manual no pool.

---

### P2: Histórico e alertas na UI (fatia 6, #307)

**User Story**: Como ALMOX/LOGISTICA/GERENTE_DPTO/ADMIN, quero ver o histórico de inspeções e os detalhes do alerta de reprovação no Cadastro IBC.

**Why P2**: Fecha a demo da #272.

**Acceptance Criteria**:

1. WHEN o usuário abre "Inspeções" de um IBC THEN a UI SHALL listar as inspeções (mais recente primeiro) com checklist, resultado, média vs mínima, nota mínima do crítico, notas por item com crítico e abaixo do mínimo sinalizados, inspetor, data e observação.
2. WHEN há alerta `INSPECAO_REPROVADA` THEN o painel de alertas SHALL mostrar identificador, checklist, itens abaixo do mínimo e a alocação (carga/pedido) quando houver.

**Independent Test**: Unit dos utils de apresentação; demo manual.

---

## Edge Cases

- WHEN o checklist ou um item muda depois da inspeção THEN o histórico SHALL manter os valores do snapshot.
- WHEN o IBC tem dois checklists vinculados e só um foi inspecionado (aprovado) THEN o sistema SHALL considerar o IBC Apto.
- WHEN um item inativo é enviado nas respostas THEN o sistema SHALL tratá-lo como item estranho (422 `IBC_INSPECAO_RESPOSTAS_INCOMPLETAS`).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| IBCINSP-01 | P1: Modelo persistente (tabelas, enum, migration aditiva) | Execute (#302) | Implementing |
| IBCINSP-02 | P1: Regra de avaliação `avaliarInspecaoIbc` | Execute (#302) | Implementing |
| IBCINSP-03 | P1: Resolução de aptidão `resolverAptidaoIbc` | Execute (#303) | Pending |
| IBCINSP-04 | P1: Use-case `RegistrarIbcInspecao` + recusas | Execute (#303) | Pending |
| IBCINSP-05 | P1: `POST /api/ibc/:id/inspecoes` transacional | Execute (#304) | Pending |
| IBCINSP-06 | P1: `GET /api/ibc/:id/inspecoes` com snapshots | Execute (#305) | Pending |
| IBCINSP-07 | P1: Alerta `INSPECAO_REPROVADA` | Execute (#305) | Pending |
| IBCINSP-08 | Documentação de domínio (`CONTEXT.md`; escala 0–10 já em #302) | Execute (#305) | Pending |
| IBCINSP-09 | P2: Tela de inspeção no Controle do ativo | Execute (#306) | Pending |
| IBCINSP-10 | P2: Histórico e alertas na UI | Execute (#307) | Pending |

**Coverage:** 10 total, 10 mapped to slices, 0 unmapped

---

## Success Criteria

- [ ] Fluxo demoável: inspecionar IBC com "Checklist Soda" → reprovar → ver alerta → reinspecionar → Apto.
- [ ] `npm test` e `npm run test:integration` verdes no backend; lint, testes e typecheck do frontend verdes.
