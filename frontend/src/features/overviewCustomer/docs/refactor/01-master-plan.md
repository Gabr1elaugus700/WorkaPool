# Master Plan — Refatoração Overview Customer Detail

## Objetivo

Transformar a tela de detalhe de um stack vertical homogêneo em uma **superfície de análise comercial 360°** escaneável, compondo identidade, KPIs, visualizações e tabelas — respeitando contratos de API, lazy loading e `DESIGN.md`.

## Fases de entrega

### Fase 1 — Estrutura e hierarquia (sem novos endpoints)

**Meta:** usuário percebe mudança imediata na scanabilidade.

| # | Entrega | Arquivos |
|---|---------|----------|
| 1.1 | Page chrome (breadcrumb, título, voltar, sync footer) | `OverviewCustomerDetailPageHeader.tsx`, `OverviewCustomerDetailSyncFooter.tsx` |
| 1.2 | Hero de identidade | `OverviewCustomerDetailHero.tsx` |
| 1.3 | Sistema de abas | `OverviewCustomerDetailTabs.tsx` + enum/const de tab ids |
| 1.4 | KPI grid (6 tiles) substituindo grid `<dl>` do resumo | `OverviewCustomerKpiGrid.tsx`, `OverviewCustomerKpiTile.tsx` |
| 1.5 | Rewire da view | `OverviewCustomerDetailView.tsx` enxuta |

**Critérios de aceite Fase 1:**

- First paint inalterado em payload (mesmo hook `useOverviewCustomerDetail`).
- Labels “desde Jan/2024” preservados nos KPIs de cutoff.
- Testes existentes de `OverviewCustomerCommercialSummaryCard` migrados ou adaptados para KPI grid.
- Lint frontend passa.

### Fase 2 — Visualizações e sidecars (dados lazy existentes)

| # | Entrega | Dependência de dados |
|---|---------|----------------------|
| 2.1 | Gráfico evolução mensal (bar + line) | `useOverviewCustomerMonthlyEvolution` — fetch ao ativar aba |
| 2.2 | Sidecar concentração ABC (top 5 produtos) | `useOverviewCustomerPurchasedProducts` |
| 2.3 | Sidecar faixa de margem (min / média / max) | derivado de produtos ou monthly |
| 2.4 | Remover toggle “Carregar evolução”; fetch por aba | hook + view state |

**Critérios de aceite Fase 2:**

- Monthly não dispara na first paint.
- Gráfico usa `@/components/ui/chart` + tokens `--primary`.
- Empty/error isolados por sidecar.

### Fase 3 — Tabelas densas e movimentação

| # | Entrega | Notas |
|---|---------|-------|
| 3.1 | Tabela produtos: barra de participação, busca local, header com contagem | colunas atuais + visual mix % |
| 3.2 | Tabelas pedidos faturados/perdidos (substituir `<ul>`) | expandir tipos se backend acrescentar valor/margem depois |
| 3.3 | Teaser “últimos pedidos” na Visão Geral | link para aba Movimentação |

### Fase 4 — Polish e alinhamento carteira (opcional)

- Skeletons consistentes (hero, KPIs, chart).
- Deep-links para Order Loss filtrado por cliente.
- Placeholder desabilitado “Exportar relatório” com tooltip “Em breve”.
- Surface brief → atualizar `DESIGN.md` sidecar se nascer componente reutilizável “Overview Section Card” evoluído.

## Fora de escopo (registrar como follow-up)

| Item do mock | Motivo | Ação |
|--------------|--------|------|
| Score Saúde 360° | Sem modelo de dados | Não renderizar; issue futura se produto definir fórmula |
| Oportunidades & Churn | PRD out of scope | Aba omitida ou badge “Em breve” |
| Limite de crédito / inadimplência | Sem API | Omitir |
| Nova Cotação / Pedido | Rota não definida | Botão omitido na Fase 1–3 |
| Export PDF/XLS | Sem API | Omitir ou disabled |

## Migração de componentes legados

| Componente atual | Destino |
|------------------|---------|
| `OverviewCustomerCommercialSummaryCard` | **Deprecar** após KPI grid; manter arquivo até testes migrarem |
| `OverviewCustomerSectionCard` | **Manter** como shell de seções internas (chart card, tabelas) |
| `OverviewCustomerMonthlyEvolutionSection` | **Dividir** em `Chart` + `Table` |
| `OverviewCustomerPurchasedProductsSection` | **Refatorar** in-place ou extrair `ProductsTable` |
| `OverviewCustomerRecentCommercialMotionSection` | **Dividir** em summary + duas tabelas |
| `OverviewCustomerStateMessage` | **Manter** |
| `OverviewCustomerAccessDeniedState` | **Manter** (polish visual separado) |

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Regressão de labels Jan/2024 | Testes unitários no KPI grid espelhando suite commercial-summary |
| First paint mais pesado | Code-split abas Histórico/Produtos se bundle crescer |
| Gráfico quebra mobile | `ChartContainer` responsivo; scroll horizontal só na tabela |
| Duplicação de formatters | Continuar `overviewCustomerFormatters.ts` |
| Visual divergir da carteira | Reutilizar padrões de `OverviewCustomerPortfolioView` (max-width, badges, card density) |

## Ordem de implementação recomendada

```
Fase 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → (merge)
Fase 2.1 ∥ 2.2 → 2.3 → 2.4
Fase 3.1 ∥ 3.2 → 3.3
```

## Checklist de verificação manual

- [ ] VENDAS vê só clientes da carteira; 403 intacto
- [ ] Cliente sem produtos: empty state na aba Produtos
- [ ] Cliente sem evolução mensal: chart empty na aba Histórico
- [ ] `lastSuccessfulSyncAt` visível no footer
- [ ] Tab keyboard navigation funcional
- [ ] KPIs com valores null mostram “Não informado”, não “0” enganoso

## Estimativa de arquivos novos

~12–15 componentes em `components/detail/` + 1 hook opcional `useOverviewCustomerDetailTabs.ts` se lógica de aba crescer.
