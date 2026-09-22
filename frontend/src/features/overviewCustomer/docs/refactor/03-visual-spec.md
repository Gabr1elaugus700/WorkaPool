# Especificação Visual — Overview Customer Detail

Mapeamento do mock **Análise Comercial 360°** para tokens e regras do `DESIGN.md`, modo **Operate**.

## Princípios aplicados

| Regra DESIGN.md | Aplicação nesta tela |
|-----------------|----------------------|
| Single Accent Channel | Verde primário no hero e CTAs; sem azul/ciano decorativo como na carteira |
| Flat-by-default | Cards com `border` + `shadow-sm`; sem `card-shadow-lg` do Order Loss StatCard |
| Workhorse Type | Inter em todos os níveis; hierarquia por tamanho/peso |
| Sem gamificação | **Não** implementar gauge circular 92/100; usar badges textuais só quando semânticos (filial, sync) |
| KPI compacto | `text-sm` labels, valores `text-2xl`/`text-3xl` `font-semibold` `tabular-nums` |

## Layout global

```
max-w-[1400px] mx-auto px-3 md:px-6 py-6 gap-4 flex-col
```

Alinhar com `OverviewCustomerPortfolioView` para continuidade carteira → detalhe.

## Seção por seção (mock → spec)

### 1. Page header

| Mock | Spec WorkaPool |
|------|----------------|
| Breadcrumb Home > Carteira > Análise 360° | `Link` muted + separador `/`; último item `text-foreground` |
| Botões Voltar / Export / Nova Cotação | **Fase 1:** só `Button variant="outline"` “Voltar para carteira” → `/overview/customers` |
| Título “Análise Comercial 360°” | `text-2xl font-semibold tracking-tight` (Display-lite, não 2rem full) |

```tsx
// classes referência
<header className="space-y-2">
  <nav className="text-xs text-muted-foreground">...</nav>
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <h1 className="text-2xl font-semibold tracking-tight">Análise Comercial 360°</h1>
    <Button variant="outline" asChild>...</Button>
  </div>
</header>
```

### 2. Hero identidade

| Mock | Spec |
|------|------|
| Faixa verde escura full-width dentro do card | `bg-primary text-primary-foreground rounded-lg p-5 md:p-6` |
| Avatar iniciais “QB” | Círculo `bg-primary-foreground/15` `text-lg font-bold` |
| Badge segmento | `Badge variant="secondary"` com contraste sobre verde — usar `bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20` |
| Score 360 gauge | **Omitir** — substituir por bloco de “sinais rápidos” textuais: dias desde última compra, frequência, margem (dados reais do summary) |
| Barra inferior metadados | `bg-primary-foreground/10 rounded-md px-4 py-2 grid md:grid-cols-4 gap-2 text-xs` |

Campos hero (do tipo `OverviewCustomerIdentity`):

- tradeName (título)
- document, segment, city/state
- branchIndicator → badge MGA / CTB / BOTH
- primaryCodRep, registrationDate
- firstInvoicedPurchaseAt, lastInvoicedPurchaseAt

### 3. Tabs

| Mock | Spec |
|------|------|
| 5 abas com badges contagem | **4 abas** MVP; badge contagem só em Produtos (`14 itens`) quando loaded |
| Aba ativa borda verde inferior | `@/components/ui/tabs` + override `data-[state=active]:border-b-2 data-[state=active]:border-primary` |
| “Oportunidades & Churn” | Omitida (PRD) |

Labels propostas:

1. Visão Geral 360°
2. Histórico & Gráficos
3. Produtos & Mix
4. Movimentação Recente

### 4. KPI grid

| Mock (6 cards) | Fonte de dados | Label UI |
|----------------|----------------|----------|
| Faturamento Total | `revenueSinceJan2024` | “Faturamento (desde Jan/2024)” |
| Volume Comprado | `volumeSinceJan2024` | “Volume (desde Jan/2024)” |
| Pedidos & Ticket | `orderCountSinceJan2024` + `averageTicketSinceJan2024` | valor principal: pedidos; sub: ticket médio |
| Margem Média | `marginPercentWeightedByRevenue` | “Margem ponderada” |
| Frequência Compras | `purchaseFrequencyDays` | “Frequência média (dias)” |
| Recência | `daysSinceLastPurchase` | “Dias desde última compra” |

**Nota:** mock mostra “Limite de Crédito” — omitir (sem dado).

Tile anatomy:

```tsx
<Card className="border-border/80 shadow-sm">
  <CardContent className="space-y-1 p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
    {subLabel ? <p className="text-xs text-muted-foreground">{subLabel}</p> : null}
  </CardContent>
</Card>
```

Grid: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`.

Comparativo 12m opcional no sublabel: “Últimos 12m: R$ …” sem duplicar tile.

### 5. Gráfico evolução mensal

| Mock | Spec |
|------|------|
| Barras volume + linha faturamento | `ComposedChart`: `Bar` volume (`fill: hsl(var(--primary) / 0.35)`), `Line` revenue (`stroke: hsl(var(--primary))`) |
| 12 meses | dados de `OverviewCustomerMonthlyEvolutionRow[]` |
| Card título longo | `OverviewCustomerSectionCard title="Evolução mensal de faturamento e volume"` |

Altura: `h-[280px] md:h-[320px]`. Eixo Y direito opcional se escalas divergirem muito.

### 6. Sidecars (coluna direita)

**Concentração ABC (top 5)**

- Input: produtos ordenados por `revenueShare` desc
- Row: nome truncado + barra `bg-primary/20` + fill `bg-primary` proporcional ao share
- Percentual `tabular-nums text-sm`

**Faixa histórica de margem**

- Calcular min/max/média de `marginPercentWeightedByRevenue` dos produtos (ignorar null)
- Barra horizontal com marcadores min / avg / max
- Fallback: usar margens mensais se produtos vazios

### 7. Radar churn / oportunidades

**Não implementar.** Se necessário placeholder na Visão Geral:

```tsx
<OverviewCustomerSectionCard title="Oportunidades" description="Em breve">
  <OverviewCustomerStateMessage message="Análise de churn e expansão será adicionada em versão futura." />
</OverviewCustomerSectionCard>
```

### 8. Tabela produtos

| Mock column | Coluna MVP |
|-------------|------------|
| Código/Nome | productCode + productName |
| Categoria | omitir (sem dado) |
| Nº Pedidos | omitir ou derivar futuro |
| Volume / Faturamento / Preço médio / Margem | existentes |
| Última compra | `lastPurchaseAt` |
| Participação mix | `revenueShare` + barra inline |

Header da seção: contagem + `Input` busca local (filtra `productName` / `productCode`).

Estilo tabela: `TableHeader bg-muted/40`, células numéricas `text-right tabular-nums`.

### 9. Pedidos recentes

| Mock | MVP |
|------|-----|
| Tabela rica com status/logística | Tabela mínima: `#pedido`, data, filial (`branchCode`), rep |
| Status colorido | omitir até backend enriquecer |
| Split faturados / perdidos | duas tabelas empilhadas na aba Movimentação |

### 10. Footer sync

Manter estilo atual, alinhar tipografia:

```tsx
<p className="text-xs text-muted-foreground">
  Última sincronização com sucesso: {formatted || "Não informado"}
</p>
```

## Paleta semântica (estados)

| Estado | Token |
|--------|-------|
| Sucesso / saudável | `text-primary`, badges `border-emerald-200 bg-emerald-50 text-emerald-700` (só filial/positivo) |
| Alerta | `text-destructive`, `bg-destructive/10` — pedidos perdidos, erros |
| Neutro/meta | `text-muted-foreground` |

Evitar `cyan`/`blue` da carteira no detalhe — manter sub-brand da listagem separada da análise.

## Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| `< md` | Hero stack vertical; KPI 1 col; tabs scroll-x; chart full width; sidecars abaixo |
| `md+` | KPI 2 col; analytics row 2/3 + 1/3 |
| `lg+` | KPI 3 col |

## Acessibilidade mínima

- Tablist com `role="tablist"` (ui/tabs já provê)
- Gráfico: `TableCaption sr-only` com resumo dos dados ou `aria-label` no container
- Contraste hero: texto `primary-foreground` sobre `primary`
- Focus ring em botões/links (`ring` token)

## Anti-patterns a evitar

- Copiar StatCard do Order Loss (ícones grandes coloridos)
- Gauge SVG decorativo sem dado
- Badges “5 alertas” laranja sem backend
- Sombras profundas em repouso
- Font display oversized no corpo de tabelas
