# Overview Customer — Histórico de observações (chat)

## Problem Statement

No detalhe da Overview, o time comercial não tem um rastro compartilhado das observações sobre o cliente. O vendedor responsável, a gerência e o admin precisam registrar e reler o que foi combinado, com autoria e data, sem misturar isso com fato de Sapiens. O acesso entra no hero do cliente, por ícone de conversa, num modal no padrão de bolhas (próprio à direita, demais à esquerda).

## Goals

- [ ] Persistir observações de texto por `customerCode` no Postgres do WorkaPool, com autor, timestamps e marca de edição.
- [ ] Expor listagem (50 mais recentes, depois página anterior) e criação/edição só para quem tem permissão.
- [ ] Abrir o histórico a partir de um ícone de conversa no hero do detalhe, em modal estilo Grok/WhatsApp.

## Out of Scope

Explicitamente excluído para não crescer o slice.

| Feature | Reason |
| ------- | ------ |
| Integração WhatsApp / disparo externo | É histórico interno do WorkaPool |
| Campo de observação do Sapiens | Sapiens continua verdade comercial; isto é anotação operacional |
| Anexos (imagem, PDF) | Confirmado: só texto |
| Tempo real / WebSocket / polling | Confirmado: carrega ao abrir; envio atualiza a lista |
| Badge de não lidas | Confirmado: ícone simples |
| Apagar mensagem | Confirmado: autor edita; ninguém apaga neste slice |
| Notificação (e-mail, push, sino) | Fora do recorte |
| Busca, menção `@`, exportar conversa | Fora do recorte |
| Chat na listagem/busca sem detalhe aberto | O ícone vive no hero do cliente filtrado |
| Roles `USER`, `LOGISTICA`, `ALMOX` | Já não entram no detalhe da Overview |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | --------------- | --------- | ---------- |
| Fonte de dados | Tabela nova no Postgres WorkaPool, chave `customerCode` | Observação não é fato ERP | y |
| Quem lê e escreve | `ADMIN`, `GERENTE_DPTO`, e `VENDAS` cujo `codRep` = `primaryCodRep` do cliente | Mesmo recorte do GET de detalhe + pedido do usuário | y |
| Alinhamento das bolhas | Mensagens cujo `authorUserId` = usuário logado à direita; as demais à esquerda | WhatsApp clássico; confirmado | y |
| Edição | Só o autor edita a própria, a qualquer momento; UI mostra marca de editado | Confirmado | y |
| Exclusão | Não existe neste slice | Confirmado via escolha de edição sem delete | y |
| Conteúdo | Texto simples, 1–2000 caracteres após trim | Observação comercial; limite testável | n |
| Atualização | GET ao abrir o modal; POST/PATCH bem-sucedido recarrega a conversa; sem polling | Confirmado | y |
| Profundidade | 50 mensagens mais recentes; scroll no topo pede a página anterior (mais antigas) | Confirmado | y |
| Ordem na thread | Cronológica crescente no viewport: mais antiga no topo, mais recente embaixo, próximo do composer | Padrão WhatsApp/Grok | n |
| Ícone | Botão de conversa no hero, ao lado do nome fantasia, sem badge | Pedido + default aceito ao fechar o spec | n |
| Estado vazio | Composer visível + copy `Nenhuma observação neste cliente` | Default aceito ao fechar o spec | n |
| Nome do autor na bolha | `User.name`; se vazio, `User.user` | Já existe no cadastro | n |
| Concorrência na edição | Last-write-wins no PATCH; resposta traz o texto persistido | App interno, baixo conflito | n |
| Idempotência de POST | Sem chave de idempotência; UI desabilita enviar enquanto a request está pendente | Slice simples | n |
| Rate limit dedicado | N/A: autenticação JWT + disable de duplo submit | Tráfego interno | n |
| TTL / arquivamento | Sem expiração; histórico permanece | Auditoria comercial | n |
| Observabilidade extra | N/A além do log HTTP já existente | Sem métrica nova neste slice | n |
| Falha de dependência externa | N/A: não chama Sapiens | Persistência só WorkaPool | n |
| Duplo submit / retry | IF o POST falhar THEN o composer mantém o texto e a UI mostra erro; o cliente pode reenviar | Evita perda da digitação | n |

**Open questions:** none - all resolved or logged above.

**Registered:** 2026-09-21 — `validate_spec.py` PASS; `design.md` + `tasks.md` approved; GitHub epic [#159](https://github.com/Gabr1elaugus700/WorkaPool/issues/159).

---

## User Stories

### P1: Abrir o histórico no hero ⭐ MVP

**User Story**: Como vendedor, gerente ou admin no detalhe do cliente, quero um ícone de conversa no hero para abrir o histórico de observações daquele cliente.

**Why P1**: Sem entrada no card o restante não é usável.

**Acceptance Criteria**:

1. WHEN the detail hero is rendered for an authorized caller THEN the system SHALL render a conversation-icon button next to the customer trade name with accessible name `Histórico de observações`.
2. WHEN the caller activates that button THEN the system SHALL open a modal titled with the customer trade name and SHALL request the observation thread for that `customerCode`.
3. WHILE the modal is open the system SHALL keep the detail view behind it and SHALL close the modal when the caller dismisses it (overlay, close control, or Escape).
4. IF the thread request fails THEN the system SHALL keep the modal open, SHALL NOT render fabricated messages, and SHALL show the error copy `Não foi possível carregar o histórico`.

**Independent Test**: Abrir um cliente na Overview, clicar o ícone no hero, ver o modal; fechar e confirmar que o detalhe permanece.

---

### P1: Ler o thread (50 mais recentes) ⭐ MVP

**User Story**: Como participante autorizado, quero ver as observações mais recentes em ordem de conversa, com autor e horário.

**Why P1**: O valor é reler o rastro, não só gravar.

**Acceptance Criteria**:

1. WHEN an authorized caller requests the thread THEN the system SHALL return at most 50 observations for that `customerCode`, selecting the newest 50 by `createdAt`, ordered ascending by `createdAt` in the payload.
2. WHEN the thread has no observations THEN the system SHALL return an empty list and the UI SHALL show `Nenhuma observação neste cliente` with the composer visible.
3. WHEN an observation is rendered THEN the system SHALL show author display name, body text, and `createdAt` in pt-BR.
4. IF the caller is `VENDAS` and `codRep` is not the customer's `primaryCodRep` THEN the system SHALL respond HTTP 403 with code `OVERVIEW_CUSTOMER_FORBIDDEN` and SHALL NOT return observations.
5. IF the caller role is not `ADMIN`, `GERENTE_DPTO`, or `VENDAS` THEN the system SHALL respond HTTP 403 with code `OVERVIEW_CUSTOMER_FORBIDDEN`.
6. IF the customer is unknown to Overview identity THEN the system SHALL respond HTTP 404 with code `OVERVIEW_CUSTOMER_NOT_FOUND`.

**Independent Test**: Fixtures com 0, 1 e 51 mensagens; VENDAS de outro `codRep` recebe 403; lista visível no modal.

---

### P1: Registrar observação ⭐ MVP

**User Story**: Como vendedor responsável, gerente ou admin, quero enviar um texto no composer para gravar a observação com a minha autoria.

**Why P1**: Sem escrita o histórico não nasce.

**Acceptance Criteria**:

1. WHEN an authorized caller submits a body of 1 to 2000 characters after trim THEN the system SHALL persist the observation with `customerCode`, `authorUserId` of the authenticated user, `createdAt`, `updatedAt` equal to `createdAt`, and `editedAt` null.
2. WHEN persist succeeds THEN the system SHALL return HTTP 201 with the created observation and the UI SHALL append it to the thread and clear the composer.
3. WHILE a create request is in flight the composer submit control SHALL be disabled.
4. IF the trimmed body is empty THEN the system SHALL respond HTTP 400 with code `OBSERVATION_INVALID_BODY` and SHALL NOT persist.
5. IF the body length after trim exceeds 2000 THEN the system SHALL respond HTTP 400 with code `OBSERVATION_INVALID_BODY` and SHALL NOT persist.
6. IF a `VENDAS` caller whose `codRep` is not `primaryCodRep` attempts create THEN the system SHALL respond HTTP 403 with code `OVERVIEW_CUSTOMER_FORBIDDEN` and SHALL NOT persist.
7. IF create fails after the caller submitted THEN the system SHALL keep the typed text in the composer and SHALL show `Não foi possível enviar a observação`.

**Independent Test**: POST válido como VENDAS dono, ADMIN e GERENTE_DPTO; 400 em vazio e >2000; 403 para VENDAS de outro cliente; UI limpa o composer só no 201.

---

### P1: Bolhas no padrão WhatsApp/Grok ⭐ MVP

**User Story**: Como usuário logado, quero ver as minhas mensagens à direita e as dos outros à esquerda, no visual denso de chat (Grok).

**Why P1**: Pedido explícito de layout; sem isso a tela não é o produto combinado.

**Acceptance Criteria**:

1. WHEN an observation's `authorUserId` equals the logged-in user id THEN the system SHALL render that bubble on the right.
2. WHEN an observation's `authorUserId` differs from the logged-in user id THEN the system SHALL render that bubble on the left.
3. The system SHALL place the composer at the bottom of the modal and SHALL keep the newest message above the composer after a successful send.
4. The system SHALL NOT place another author's bubbles on the right solely because that author is the customer's salesperson.

**Independent Test**: Logar como vendedor e como gerente no mesmo thread; inverter quem está à direita conforme o usuário, não conforme o papel.

---

### P2: Editar a própria observação

**User Story**: Como autor, quero corrigir o texto da minha observação e deixar visível que foi editada.

**Why P2**: Pedido confirmado, mas o MVP já funciona só-acrescentando.

**Acceptance Criteria**:

1. WHEN the author submits a PATCH with a trimmed body of 1 to 2000 characters THEN the system SHALL persist the new body, set `editedAt` and `updatedAt` to the request time, and keep `createdAt` and `authorUserId` unchanged.
2. WHEN `editedAt` is not null THEN the UI SHALL show the copy `editado` on that bubble.
3. IF a caller who is not the author attempts PATCH THEN the system SHALL respond HTTP 403 with code `OBSERVATION_EDIT_FORBIDDEN` and SHALL NOT change the row, including when the caller is `ADMIN` or `GERENTE_DPTO`.
4. IF the observation id does not belong to the `customerCode` in the route THEN the system SHALL respond HTTP 404 with code `OBSERVATION_NOT_FOUND`.
5. IF the PATCH body is empty after trim or longer than 2000 THEN the system SHALL respond HTTP 400 with code `OBSERVATION_INVALID_BODY`.

**Independent Test**: Autor edita e vê `editado`; outro usuário (inclusive admin) recebe 403; createdAt permanece.

---

### P2: Página anterior no topo

**User Story**: Como leitor, quero carregar observações mais antigas quando chego ao topo da lista.

**Why P2**: Confirmado; o P1 já entrega as 50 mais recentes.

**Acceptance Criteria**:

1. WHEN the thread has more observations older than the oldest item already loaded THEN the system SHALL expose a cursor or `before` token for the next older page of at most 50 items ordered by `createdAt` ascending.
2. WHEN the caller requests the older page THEN the system SHALL prepend those items in the modal without dropping the already loaded newer messages.
3. IF there is no older page THEN the system SHALL NOT request another page and SHALL NOT show a load-older control.

**Independent Test**: 60 mensagens: primeiro GET traz as 50 mais novas (em ordem crescente); o segundo GET com cursor traz as 10 mais antigas e a UI as coloca no topo.

---

## Edge Cases

- IF two observations share the same `createdAt` THEN the system SHALL order them by `id` ascending as a stable tie-break.
- IF the logged-in user is both `GERENTE_DPTO` and not the salesperson THEN the system SHALL still put only that user's own bubbles on the right.
- IF Overview identity has `primaryCodRep` null THEN the system SHALL allow `ADMIN` and `GERENTE_DPTO` to read and write and SHALL deny `VENDAS`.
- IF the modal is closed and opened again THEN the system SHALL fetch the newest page again and SHALL NOT reuse a stale in-memory thread from a previous open.
- IF the user presses Enter in the composer THEN the system SHALL submit; IF the user presses Shift+Enter THEN the system SHALL insert a newline and SHALL NOT submit.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| OBSCHAT-01 | P1: Abrir o histórico no hero | Execute | T13 |
| OBSCHAT-02 | P1: Ler o thread (50 mais recentes) | Execute | T4, T6, T8, T12 |
| OBSCHAT-03 | P1: Registrar observação | Execute | T5, T6, T8, T9 |
| OBSCHAT-04 | P1: Bolhas no padrão WhatsApp/Grok | Execute | T10, T11, T13 |
| OBSCHAT-05 | P2: Editar a própria observação | Execute | T14, T15 |
| OBSCHAT-06 | P2: Página anterior no topo | Execute | T2, T4, T16 |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped

**Artifacts:** `.specs/features/overview-customer-observation-chat/design.md`, `.specs/features/overview-customer-observation-chat/tasks.md`

---

## Success Criteria

- [ ] No detalhe de um cliente, o ícone abre o modal e mostra o histórico daquele `customerCode`.
- [ ] Vendedor de outro `codRep` não lê nem grava; dono, admin e gerente leem e gravam.
- [ ] Bolha da pessoa logada à direita; demais à esquerda, inclusive a do vendedor quando o gestor está logado.
- [ ] Envio persiste autor e data; edição só do autor, com marca `editado`.
- [ ] Primeira página = 50 mais recentes; mais antigas só com página anterior.
