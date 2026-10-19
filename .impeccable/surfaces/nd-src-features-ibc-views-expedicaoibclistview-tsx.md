---
version: 1
slug: "nd-src-features-ibc-views-expedicaoibclistview-tsx"
primary_target: "frontend/src/features/ibc/views/ExpedicaoIbcListView.tsx"
related_targets: ["frontend/src/features/ibc/components/IbcPageHeader.tsx","frontend/src/features/ibc/components/IbcPageTabs.tsx"]
---

# Surface Brief: Chrome IBC — Expedição

## Job and audience

- **Modo:** Operate
- **Quem chega:** ALMOX e ADMIN no desktop do almox, rotina diária da viagem.
- **Tarefa:** ver o pátio de cargas e entrar na carga certa sem saltar de tela.
- **Prova:** número da carga, cliente, situação da carga FECHADA, estação (Aguardando / Em viagem / Entrada no pátio).
- **Restrição:** Sapiens é verdade. Uma ação primária visível. Cor de status só no estado, nunca no canvas. Menu 6→3 é a #367.

## Direction contract

THESIS: O pátio é uma mesa de cards iguais; o status vive numa faixa colorida no topo. Recusa lista cinza sem estado e recusa pintar a página inteira com a cor da estação.

OWN-WORLD: Operations Greenroom — canvas névoa, card branco, Inter, `shadow-sm`, raio médio. Âmbar Aguardando, azul Em viagem, verde-sinal Entrada; verde preenchido fica só na ação primária.

STORY: O operador varre as fichas, lê a estação pela cor e abre a carga para seguir a viagem.

FIRST VIEWPORT: Título Expedição IBC; grade de três colunas; cada card com faixa + rótulo de status, código da carga, cliente e meta FECHADA.

FORM: Grade de cards iguais. Seed 49228608, carta assigned após dois re-rolls; steer do usuário: cards + cor no status.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Approved comp: `.impeccable/mocks/decision/card-grid.png`
