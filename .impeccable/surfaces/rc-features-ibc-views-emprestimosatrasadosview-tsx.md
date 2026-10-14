---
version: 1
slug: "rc-features-ibc-views-emprestimosatrasadosview-tsx"
primary_target: "frontend/src/features/ibc/views/EmprestimosAtrasadosView.tsx"
related_targets: ["frontend/src/features/ibc/components/EmprestimosAtrasadosTabela.tsx","frontend/src/routes/index.tsx","frontend/src/layout/navigation/navItems.ts"]
---

# Surface Brief: Empréstimos em atraso

## Job and audience

- **Modo:** Operate
- **Quem chega:** logística, gerente de departamento, admin e vendas (carteira via `codRep`). ALMOX, USER e MOTORISTA não entram.
- **Tarefa:** ver quais IBCs seguem no cliente depois do prazo de devolução gravado.
- **Prova:** identificador, cliente, pedido, carga, representante e a data esperada (dia UTC).
- **Restrição:** somente leitura. Sem devolução, sem “a vencer”, sem filtro. Copia o módulo IBC (Conciliação e Avisos).

## Direction contract

THESIS: Fila de cobrança, não painel de métricas. Cada empréstimo atrasado é uma linha, prazo mais antigo primeiro. Recusa número hero e estado “a vencer”.

OWN-WORLD: Operations Greenroom. Inter, canvas neutro, card branco, borda quieta, `shadow-sm`. Verde só no ícone Clock. A data esperada ganha peso tipográfico, sem badge.

STORY: O visitante lê quem ainda deve o IBC e a data já vencida, e sai para agir em outro fluxo. Esta tela não registra devolução.

FIRST VIEWPORT: Título “Empréstimos em atraso”, uma frase de apoio, uma tabela com scroll horizontal. Vazio no mesmo cartão. Carregando e erro no `ExpedicaoIbcAsyncState`.

FORM: Lista herdada de Conciliação IBC e Avisos IBC, único arranjo. Pedido preciso da #41; concept-seed não roda. Seed: nenhum.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
