# Especificações por Componente — Overview Customer Detail

Contratos propostos para implementação. Tipos referenciam `overviewCustomerDetail.types.ts` e tipos lazy existentes.

---

## `OverviewCustomerDetailPageHeader`

**Responsabilidade:** chrome superior — breadcrumb, título da superfície, ação de retorno.

```tsx
type OverviewCustomerDetailPageHeaderProps = {
  tradeName: string;
  customerCode: number;
};
```

**Comportamento:**

- Breadcrumb: Home (/) → Carteira de clientes (`/overview/customers`) → `{tradeName}` (current, não link)
- Título fixo: “Análise Comercial 360°”
- Botão outline “Voltar para carteira”

**Estados:** nenhum async.

---

## `OverviewCustomerDetailHero`

**Responsabilidade:** confirmar identidade da conta com tratamento visual premium.

```tsx
type OverviewCustomerDetailHeroProps = {
  customer: OverviewCustomerIdentity;
  commercialSignals: {
    marginPercentWeightedByRevenue: number | null;
    purchaseFrequencyDays: number | null;
    daysSinceLastPurchase: number | null;
  };
};
```

**Layout:**

- Iniciais derivadas de `tradeName` (primeiras letras de até 2 palavras)
- Título `tradeName`; subtítulo `#customerCode · city/state`
- Badges: `branchIndicator`, `segment` (se non-null)
- Coluna direita “Sinais rápidos” (substitui score 360): 3 mini-stat textuais
- Footer bar: document, primaryCodRep, registrationDate, first/last purchase

**Formatters:** `overviewCustomerFormatters` para percentuais e números.

---

## `OverviewCustomerDetailTabs`

**Responsabilidade:** navegação entre painéis; não possui dados.

```tsx
type OverviewCustomerDetailTabId =
  | "overview"
  | "history"
  | "products"
  | "motion";

type OverviewCustomerDetailTabsProps = {
  activeTab: OverviewCustomerDetailTabId;
  onTabChange: (tab: OverviewCustomerDetailTabId) => void;
  productCount: number | null; // null while not loaded
  overviewPanel: ReactNode;
  historyPanel: ReactNode;
  productsPanel: ReactNode;
  motionPanel: ReactNode;
};
```

**Constantes** (`overviewCustomerDetailTabs.constants.ts`):

```tsx
export const OVERVIEW_CUSTOMER_DETAIL_TABS = {
  overview: { id: "overview", label: "Visão Geral 360°" },
  history: { id: "history", label: "Histórico & Gráficos" },
  products: { id: "products", label: "Produtos & Mix" },
  motion: { id: "motion", label: "Movimentação Recente" },
} as const;
```

---

## `OverviewCustomerKpiTile` + `OverviewCustomerKpiGrid`

**Responsabilidade:** apresentar KPIs escaneáveis.

```tsx
type OverviewCustomerKpiTileProps = {
  label: string;
  value: string;
  subLabel?: string;
};

type OverviewCustomerKpiGridProps = {
  summary: OverviewCustomerDetailResponse["commercialSummary"];
};
```

**Mapeamento interno do grid (6 tiles):**

| label | value source | subLabel |
|-------|--------------|----------|
| Faturamento (desde Jan/2024) | formatCurrency(revenueSinceJan2024) | Últimos 12m: formatCurrency(revenueLast12Months) |
| Volume (desde Jan/2024) | formatNumber(volumeSinceJan2024) | Últimos 12m: … |
| Pedidos (desde Jan/2024) | formatNumber(orderCountSinceJan2024) | Ticket médio: formatCurrency(averageTicketSinceJan2024) |
| Margem ponderada | formatPercent(margin) ou “Não informado” | — |
| Frequência média (dias) | formatNumber ou “Não informado” | — |
| Dias desde última compra | formatNumber ou “Não informado” | — |

**Testes:** migrar asserções de `OverviewCustomerCommercialSummaryCard.test.ts`.

---

## `OverviewCustomerMonthlyEvolutionChart`

**Responsabilidade:** visualizar série mensal.

```tsx
type OverviewCustomerMonthlyEvolutionChartProps = {
  rows: OverviewCustomerMonthlyEvolutionRow[];
  isLoading: boolean;
  isError: boolean;
  variant?: "compact" | "full"; // compact na Visão Geral
};
```

**Dados chart:** `{ month, revenue, volume, orderCount, marginPercent }`

**Estados:**

- loading → skeleton retangular dentro do SectionCard
- error → StateMessage destructive
- empty → StateMessage neutro
- loaded → ComposedChart

**Sem fetch interno.**

---

## `OverviewCustomerAbcConcentrationCard`

```tsx
type OverviewCustomerAbcConcentrationCardProps = {
  products: OverviewCustomerPurchasedProduct[];
  isLoading: boolean;
  isError: boolean;
  maxItems?: number; // default 5
};
```

**Lógica:** slice top N by `revenueShare`; bar width = share / top1 share (ou 100% scale).

---

## `OverviewCustomerMarginRangeCard`

```tsx
type OverviewCustomerMarginRangeCardProps = {
  margins: Array<number | null>; // product or monthly margins
  isLoading: boolean;
  isError: boolean;
};
```

**Lógica pura em `overviewCustomerAnalytics.utils.ts`:**

```tsx
export function computeMarginRange(values: Array<number | null>): {
  min: number | null;
  max: number | null;
  avg: number | null;
};
```

---

## `OverviewCustomerMonthlyEvolutionTable`

Extrair corpo de `OverviewCustomerMonthlyEvolutionSection` — mesmas colunas atuais.

```tsx
type Props = {
  rows: OverviewCustomerMonthlyEvolutionRow[];
  isLoading: boolean;
  isError: boolean;
};
```

---

## `OverviewCustomerPurchasedProductsTable`

```tsx
type OverviewCustomerPurchasedProductsTableProps = {
  rows: OverviewCustomerPurchasedProduct[];
  searchTerm: string;
};
```

**Nota:** busca pode ficar no panel pai; tabela só filtra recebendo `searchTerm`.

**Colunas MVP:**

| Coluna | Campo |
|--------|-------|
| Produto | productName + productCode |
| Qtd. | quantity |
| Volume | volume |
| Faturamento | revenue |
| Preço médio | averagePrice |
| Margem | marginPercentWeightedByRevenue |
| Última compra | lastPurchaseAt |
| Mix | revenueShare + Progress bar |

---

## `OverviewCustomerProductsToolbar`

```tsx
type Props = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  productCount: number;
};
```

---

## `OverviewCustomerCommercialMotionSummary`

```tsx
type Props = {
  lastInvoicedPurchaseAt: string | null;
  lastLostOrderAt: string | null;
  lastCommercialMovementAt: string | null;
};
```

Grid 3 colunas — extrair do topo de `RecentCommercialMotionSection`.

---

## `OverviewCustomerRecentInvoicedOrdersTable`

```tsx
type Props = {
  rows: OverviewCustomerRecentInvoicedOrder[];
  isLoading: boolean;
  isError: boolean;
};
```

| Coluna | Campo |
|--------|-------|
| Pedido | orderNumber |
| Data | occurredAt |
| Filial | branchCode |
| Rep | codRep |

---

## `OverviewCustomerRecentLostOrdersTable`

Mesma estrutura; incluir coluna `sitped` (sempre 5, pode omitir visualmente).

---

## `OverviewCustomerRecentOrdersTeaser`

```tsx
type Props = {
  invoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  onViewAll: () => void; // switch tab to motion
};
```

Mostra até 3 linhas; link “Ver movimentação completa”.

---

## `OverviewCustomerDetailSyncFooter`

```tsx
type Props = {
  lastSuccessfulSyncAt: string | null;
};
```

---

## Painéis compositores

Cada panel agrupa SectionCards e repassa props; **sem hooks**.

| Panel | Filhos |
|-------|--------|
| `OverviewCustomerDetailOverviewPanel` | KpiGrid, AnalyticsRow (chart + sidecars), RecentOrdersTeaser |
| `OverviewCustomerDetailHistoryPanel` | Chart full, MonthlyTable |
| `OverviewCustomerDetailProductsPanel` | Toolbar, PurchasedProductsTable + estados loading/error/empty |
| `OverviewCustomerDetailMotionPanel` | MotionSummary, InvoicedTable, LostTable |

---

## Ajustes nos hooks (view layer)

Proposta de extensão opcional nos hooks existentes:

```tsx
// useOverviewCustomerMonthlyEvolution.ts
export function useOverviewCustomerMonthlyEvolution(
  customerCode: number | null,
  enabled: boolean,
) { ... }
```

Substituir padrão atual `enabled: isOpen` por `enabled` derivado da aba ativa.

Matriz de fetch:

| Tab | monthly | products | motion |
|-----|---------|----------|--------|
| overview | ✓ | ✓ | ✓ |
| history | ✓ | — | — |
| products | — | ✓ | — |
| motion | — | — | ✓ |

Na aba overview, fetch paralelo após first paint (não bloqueia hero/KPI).

---

## Matriz de estados por painel

| Painel | Loading | Empty | Error |
|--------|---------|-------|-------|
| Overview KPI | skeleton 6 tiles | N/A (summary always on first paint) | herda view-level |
| Chart | skeleton | “Sem dados de evolução” | StateMessage |
| ABC | skeleton | “Sem produtos no mix” | StateMessage |
| Products table | SectionCard + message | “Nenhum produto…” | destructive message |
| Motion tables | por tabela | por tabela | por tabela |

---

## Arquivos de teste sugeridos

| Teste | Foco |
|-------|------|
| `OverviewCustomerKpiGrid.test.ts` | labels Jan/2024, null handling |
| `OverviewCustomerDetailTabs.test.ts` | troca de aba chama onTabChange |
| `overviewCustomerAnalytics.utils.test.ts` | ABC ordering, margin range |
| Manter suites de integração documentadas em `docs/test-suites/` |

---

## Checklist de conformidade (writing-typescript)

- [ ] Um export por arquivo
- [ ] Sem `index.ts` barrel novo
- [ ] View sem JSX massivo (> ~40 linhas de markup → extrair)
- [ ] Componentes filhos sem `fetch`/`useQuery`
- [ ] Tipos colocalizados ou em `types/` quando compartilhados
- [ ] Sem `any`
