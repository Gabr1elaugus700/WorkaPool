# Overview Customer — Histórico de observações Context

**Gathered:** 2026-09-21
**Spec:** `.specs/features/overview-customer-observation-chat/spec.md`
**Status:** Approved — design.md and tasks.md registered; GitHub issues created

---

## Feature Boundary

No detalhe da Overview Customer, ícone de conversa no hero abre um modal com o histórico interno de observações daquele cliente. Persistência no WorkaPool. Quem participa: vendedor responsável, ADMIN e GERENTE_DPTO. Visual de chat (Grok/WhatsApp): minhas bolhas à direita. Sem Sapiens, sem WhatsApp real, sem anexo, sem tempo real, sem badge, sem apagar.

---

## Implementation Decisions

### Ciclo de vida da mensagem

- O autor edita a própria observação a qualquer momento.
- A bolha mostra `editado` depois do PATCH.
- Ninguém apaga mensagem neste slice (nem o autor, nem admin).

### Alinhamento das bolhas

- Direita: só `authorUserId` = usuário autenticado.
- Esquerda: qualquer outro autor, inclusive o vendedor responsável quando quem está logado é gestor ou admin.

### Atualização

- GET ao abrir o modal.
- POST/PATCH com sucesso recarrega ou concatena o resultado; sem polling e sem WebSocket.

### Conteúdo

- Só texto. Sem imagem e sem arquivo.

### Sinal no ícone

- Ícone simples, sem contagem e sem ponto de não lida.

### Profundidade do histórico

- Primeira carga: 50 mais recentes, renderizadas em ordem cronológica crescente.
- Scroll/controle no topo carrega a página anterior (mais antigas), no máximo 50 por página.

### Agent's Discretion

- Posição exata do ícone no hero: ao lado do nome fantasia, acessível, contraste no fundo escuro.
- Copy de vazio: `Nenhuma observação neste cliente`.
- Limite de corpo: 1–2000 após trim.
- Composer: Enter envia; Shift+Enter quebra linha.
- Visual Grok: densidade de chat, bolhas, composer fixo no rodapé do modal; tokens do DESIGN.md na implementação.

### Declined / Undiscussed Gray Areas → Assumptions

- Sem TTL, sem rate limit extra, sem chave de idempotência, last-write-wins na edição, log HTTP existente. Registrado na tabela de assumptions do spec.

---

## Specific References

- Print do hero (card escuro QUIBRAS): o ícone mora nesse card, não numa aba nova.
- “Trilogia similar ao WhatsApp” + “layout que é usado pelo Grok / Grokbot”.
- “Tabela auxiliar” = persistência do histórico, não uma data-grid na UI.

---

## Deferred Ideas

- Anexos, tempo real, não lidas, apagar, notificação, busca no thread, exportar, campo ERP.
