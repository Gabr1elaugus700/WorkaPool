# Surface Brief: Análise Comercial 360° (Overview Customer Detail)

## Job and audience

- **Modo Impeccable:** Operate
- **Quem chega:** gestor comercial ou vendedor com carteira, já triou o cliente na listagem e abriu `/overview/customers/:clienteId` para decidir próximo passo comercial.
- **Necessidade:** responder em poucos segundos “como está este cliente?” — identidade confirmada, KPIs consolidados, tendência, mix e movimentação recente.
- **Sucesso:** leitura escaneável top-down (hero → KPIs → gráficos → tabelas), sem scroll infinito de `<dl>` genéricos; dados rotulados “desde Jan/2024” onde aplicável; seções pesadas continuam lazy.

## Outcome and proof

- **Ação primária:** compreender postura comercial e decidir se aprofunda (Order Loss, pedidos, cotação) ou volta à carteira.
- **Prova de valor:** first paint com identidade + resumo comercial; evolução mensal e produtos só após intenção explícita (aba ou expand).
- **Verdade de produto (PRD #92):** read model Postgres; sem score de saúde inventado, sem motor de oportunidades/churn, sem limite de crédito ou export PDF até backend existir.

## Selected direction

- **Autoridade visual:** DESIGN.md — “Operations Greenroom”: neutros dominantes, verde como único canal de ação, cards flat com `shadow-sm`, tipografia Inter compacta.
- **Tese estrutural:** composição em **camadas** espelhando a referência 360° — chrome da página, hero de identidade, navegação por abas, grid de KPIs, bloco analítico (gráfico + sidecars), tabelas densas — sem gamificação (sem gauge 92/100 fake, sem badges laranja decorativos).
- **Momento focal:** faixa hero + primeira linha de KPIs (faturamento, volume, pedidos, margem, frequência).
- **Consequência de implementação:** `OverviewCustomerDetailView` vira orquestrador fino; cada região vira componente irmão em `components/detail/`; reutilizar `OverviewCustomerSectionCard` onde couber, extrair primitivos compartilhados (`OverviewCustomerKpiTile`, `OverviewCustomerPageHeader`).

## Scope and boundaries

### Dentro do escopo (fase visual MVP)

- Header com breadcrumb, título contextual, botão “Voltar para carteira”, metadado de sync.
- Hero de identidade (nome, documento, segmento, filial, datas, representante) com tratamento visual premium em verde primário — **sem** score 360 inventado.
- Abas: **Visão Geral** (default), **Histórico & Gráficos**, **Produtos & Mix**, **Movimentação Recente** — quatro abas alinhadas a dados existentes.
- KPI grid (6 tiles) a partir de `commercialSummary` + campos deriváveis.
- Gráfico combinado faturamento/volume a partir de `monthly` (lazy na aba Histórico ou expand na Visão Geral).
- Sidecars: concentração ABC top-5 produtos (derivado de `purchased-products`), faixa de margem (min/média/max de produtos ou mensal).
- Tabela de produtos enriquecida (colunas existentes + participação visual).
- Tabela/lista de pedidos recentes faturados e perdidos com colunas úteis dos tipos atuais.

### Fora do escopo / adiado (referência visual apenas)

- Score de Saúde 360°, plano de cliente, limite de crédito, inadimplência.
- Radar de oportunidades & churn com CTAs “Contatar cliente” / “Repactuar preço”.
- Export PDF/XLS funcional (botão desabilitado ou omitido até API).
- “+ Nova Cotação / Pedido” (deep-link futuro para módulo de pedidos).
- Painéis logísticos (SLA, frete) e financeiro além do que o read model expõe.
- Semáforo de ciclo de compra (PRD explicitamente adiado).

### Intocável

- Contratos de API e regras de lazy load (first paint ≠ monthly/products/motion).
- Autorização VENDAS vs ADMIN/Gerente.
- Labels “desde Jan/2024” nos totais de cutoff.
- Layer boundaries: view orquestra, hooks fazem fetch, componentes não chamam HTTP.

## States and ranges

| Estado | Comportamento |
|--------|----------------|
| `clienteId` inválido | Mensagem compacta + link lista |
| Loading first paint | Skeleton hero + KPI placeholders |
| 403 | `OverviewCustomerAccessDeniedState` (pode ganhar polish visual depois) |
| 404 not synced | Card com CTA voltar |
| Erro genérico | Retry implícito via refresh; mensagem destrutiva |
| Summary parcial/null | KPI tiles com “Não informado” / zero explícito |
| Monthly/products/motion lazy | Skeleton na aba; erro isolado por seção |
| Cliente sem histórico | Empty states instrutivos por seção |

Ranges típicos: 0–50 produtos no mix; 12–24 meses na evolução; 5 pedidos recentes por tipo.

## Interaction and layout

```
[PageHeader: breadcrumb + actions]
[HeroIdentity: verde primário, metadados em barra inferior]
[Tabs: Visão Geral | Histórico | Produtos | Movimentação]
  Visão Geral:
    [KpiGrid 2x3 / 3x2 responsive]
    [Row: ChartEvolution (lg) | Column: AbcMix + MarginRange]
    [Teaser: últimos 3 pedidos + link aba Movimentação]
  Histórico:
    [ChartEvolution full] + [MonthlyTable existente]
  Produtos:
    [Search local] + [ProductsTable]
  Movimentação:
    [MotionSummary dates] + [InvoicedTable] + [LostTable]
[Footer: lastSuccessfulSyncAt]
```

- **Breakpoints:** mobile empilha KPIs 1 col; tabs scroll horizontal; tabelas com overflow-x.
- **Affordances:** tabs com `aria-selected`; botões outline para secundários; primary só para ação futura de cotação (quando existir rota).

## Constraints and open decisions

- Reutilizar `@/components/ui/chart` + Recharts (já no repo) — não introduzir lib nova.
- Não copiar `StatCard` do Order Loss (cores blue/yellow/red); criar variante neutra alinhada a DESIGN.md ou KPI tile local à feature.
- **Decisão aberta:** evolução mensal abre automaticamente na aba Visão Geral (mini chart) ou só na aba Histórico? **Proposta:** mini sparkline/bar na Visão Geral com fetch lazy ao montar aba ativa; tabela completa só em Histórico.
- **Decisão aberta:** manter botão “Carregar evolução” ou trocar por fetch ao entrar na aba? **Proposta:** fetch ao ativar aba (remove toggle manual).
- Alinhar largura máxima e padding com `OverviewCustomerPortfolioView` (`max-w-[1400px]`).

## Referências

- Mock: Análise Comercial 360° (QUIBRAS) — layout alvo, copy adaptada ao domínio WorkaPool.
- PRD: `docs/prd/overview-customer/PRD.md`
- Test suites: `docs/test-suites/overview-customer-*.md`
- Implementação atual: `frontend/src/features/overviewCustomer/views/OverviewCustomerDetailView.tsx`
