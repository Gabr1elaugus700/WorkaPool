# Refatoração — Overview Customer Detail (360°)

Documentação de proposta para refatorar a tela de detalhe do cliente comercial, alinhada ao mock **Análise Comercial 360°**, ao `DESIGN.md` e aos padrões de componentização do WorkaPool.

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [01-master-plan.md](./01-master-plan.md) | Fases, ordem de entrega, riscos, critérios de aceite |
| [02-component-decomposition.md](./02-component-decomposition.md) | Árvore de componentes, arquivos novos vs. legados |
| [03-visual-spec.md](./03-visual-spec.md) | Mapeamento mock → tokens DESIGN.md, layout, tipografia |
| [04-component-specs.md](./04-component-specs.md) | Especificação por componente (props, dados, estados) |

## Surface brief Impeccable

Brief canônico da superfície: [`.impeccable/surfaces/overview-customer-detail.md`](../../../../../.impeccable/surfaces/overview-customer-detail.md)

## Estado atual (baseline)

A view [`OverviewCustomerDetailView.tsx`](../../views/OverviewCustomerDetailView.tsx) empilha cinco blocos monolíticos:

1. Card de identidade (`<dl>` simples)
2. `OverviewCustomerCommercialSummaryCard` (grid de 11 pares label/valor)
3. `OverviewCustomerRecentCommercialMotionSection` (listas `<ul>`)
4. `OverviewCustomerMonthlyEvolutionSection` (toggle + tabela)
5. `OverviewCustomerPurchasedProductsSection` (tabela)

Problemas principais:

- Hierarquia visual plana — tudo parece mesma prioridade.
- KPIs não escaneáveis (sem tiles, sem destaque numérico).
- Identidade não funciona como “hero” de confirmação de conta.
- Gráficos ausentes; evolução mensal escondida atrás de botão.
- Desalinhamento com a listagem (`OverviewCustomerPortfolioView`), que já usa header, badges e cards métricos.

## Princípios da refatoração

1. **View orquestra; componentes apresentam** — manter hooks na view, zero fetch nos filhos.
2. **Uma responsabilidade por arquivo** — extrair antes de crescer.
3. **Dados existentes primeiro** — visual rico sem inventar métricas fora do PRD.
4. **Lazy load preservado** — first paint continua leve.
5. **DESIGN.md manda** — verde só para ação/ênfase; sem gamificação.

## Próximo passo sugerido

Implementar **Fase 1** do master plan: extrair page chrome + hero + KPI grid, mantendo tabelas atuais temporariamente atrás das novas abas.
