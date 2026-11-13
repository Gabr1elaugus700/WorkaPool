# Gestão IBC Containers — estado dos modais Specification

## Problem Statement

Na view `/gestao-ibc/containers`, depois de fechar qualquer painel (Inspecionar, ações do menu "Mais ações", detalhe do identificador), nenhum outro botão da tela responde: `document.body.style.pointerEvents` fica `"none"`.

**Causa raiz (confirmada em teste jsdom):** `@radix-ui/react-dialog` e `@radix-ui/react-menu` instalam cópias distintas de `@radix-ui/react-dismissable-layer` (cada uma em `node_modules` próprio), então cada uma tem o seu contexto de camadas e o seu "valor original" de `pointer-events`. O menu "Mais ações" é modal: ao abrir, guarda `""` e põe `"none"`. O item do menu abre o painel ainda com o menu montado; a cópia do Dialog vê pilha vazia e guarda `"none"` como original. O menu fecha e restaura `""`; o painel fecha e restaura `"none"` — tela travada. Os painéis abertos direto (Inspecionar, detalhe) só travavam depois de um painel aberto pelo menu.

O `open` fixo dentro de condicional (`{estado ? <Sheet open …/> : null}`) **não** causa o travamento sozinho (desmontar o Dialog restaura o ponteiro), mas foi trocado por `open` controlado para manter o padrão do `NovoIbcDrawer` e permitir a animação de saída.

## Goals

- [ ] Abrir, fechar e reabrir qualquer painel da view sem recarregar a página.
- [ ] `document.body` volta a aceitar ponteiro após fechar qualquer painel.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Redesenho visual dos drawers/diálogos | Correção de estado, não de UI |
| Outras views IBC (expedição, entrada pátio, checklists) | Fora da rota reportada; revisar em issue própria se o padrão se repetir |
| Mudança no wrapper `components/ui/sheet.tsx` / `dialog.tsx` / `dropdown-menu.tsx` | Correção restrita à view reportada |
| Deduplicar `@radix-ui/react-dismissable-layer` | Exige alinhar versões de vários pacotes Radix; outras telas com menu → diálogo podem ter o mesmo defeito |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Forma da correção | `DropdownMenu modal={false}` no "Mais ações" (o menu não trava o ponteiro, então não há dois locks concorrentes) | Correção local; deduplicar as dependências Radix afeta o app inteiro e fica para issue própria | y |
| Padrão dos painéis | Manter `Sheet`/`Dialog` sempre montado e controlar `open={estado != null}`; renderizar o conteúdo só quando houver IBC selecionado | Padrão já usado por `NovoIbcDrawer` | y |
| Conteúdo durante a animação de saída | Conteúdo pode sumir junto com o estado | Evita guardar "último IBC" só para animação; prioridade é destravar a tela | y |
| Painéis cobertos | Inspeção, Inspeções, Histórico, Checklists, Mudança (converter/mudar produto) e detalhe do identificador | São todos os painéis abertos a partir da tabela de containers | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Reabrir painéis após fechar ⭐ MVP

**User Story**: As a usuário do almox/logística na Gestão IBC, I want abrir outro painel depois de fechar o anterior so that eu consiga inspecionar e gerenciar vários containers em sequência.

**Why P1**: Hoje a tela trava após o primeiro fechamento; o fluxo de inspeção em lote fica inviável.

**Acceptance Criteria**:

1. WHEN o usuário fecha o painel de Inspecionar THEN a view SHALL restaurar `document.body.style.pointerEvents` para valor diferente de `"none"`.
2. WHEN o usuário fecha o painel de Inspeções, Histórico ou Checklists THEN a view SHALL restaurar `document.body.style.pointerEvents` para valor diferente de `"none"`.
3. WHEN o usuário fecha o diálogo de Converter ou Mudar produto THEN a view SHALL restaurar `document.body.style.pointerEvents` para valor diferente de `"none"`.
4. WHEN o usuário fecha o detalhe do identificador THEN a lista SHALL restaurar `document.body.style.pointerEvents` para valor diferente de `"none"`.
5. WHEN o usuário fecha um painel e clica em Inspecionar ou em outra ação do menu "Mais ações" THEN a view SHALL abrir o painel correspondente ao IBC clicado.
6. The view SHALL manter cada `Sheet`/`Dialog` da tabela montado e controlado por `open`, sem `open` fixo dentro de renderização condicional.

**Independent Test**: Abrir Inspecionar de um IBC, fechar (Esc, overlay ou X), abrir "Mais ações" → Histórico de outro IBC; o painel abre e `document.body.style.pointerEvents` não é `"none"`.

---

## Edge Cases

- IF o usuário fecha o painel com Esc THEN a view SHALL liberar o ponteiro igual ao fechamento pelo botão X.
- IF o usuário fecha o painel clicando no overlay THEN a view SHALL liberar o ponteiro igual ao fechamento pelo botão X.
- WHILE a conversão está pendente o diálogo de mudança SHALL permanecer aberto (comportamento atual preservado).
- WHEN a inspeção é registrada com sucesso e o drawer fecha via `onClose` THEN a view SHALL liberar o ponteiro.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| IBCMOD-01 | P1: Reabrir painéis | Execute | Done |
| IBCMOD-02 | P1: Reabrir painéis | Execute | Done |
| IBCMOD-03 | P1: Reabrir painéis | Execute | Done |
| IBCMOD-04 | P1: Reabrir painéis | Execute | Done |
| IBCMOD-05 | P1: Reabrir painéis | Execute | Done |
| IBCMOD-06 | P1: Reabrir painéis | Execute | Done |

**Coverage:** 6 total, 6 done. Teste: `frontend/src/features/ibc/components/IbcDrawersReabrir.test.ts` (jsdom).

---

## Success Criteria

- [x] Zero travamentos ao abrir/fechar painéis em sequência na `/gestao-ibc/containers`.
- [x] Teste automatizado cobre fechar → reabrir para pelo menos Inspecionar e um item do menu "Mais ações".

## Arquivos afetados

- `frontend/src/features/ibc/views/CadastroIbcView.tsx`
- `frontend/src/features/ibc/views/EntradaPatioIbcView.tsx` (novo contrato do `IbcInspecaoDrawer`)
- `frontend/src/features/ibc/components/CadastroIbcPoolList.tsx` (menu não modal + detalhe)
- `frontend/src/features/ibc/components/IbcInspecaoDrawer.tsx`
- `frontend/src/features/ibc/components/IbcInspecoesDrawer.tsx`
- `frontend/src/features/ibc/components/IbcChecklistsVinculoDrawer.tsx`
