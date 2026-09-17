export const OVERVIEW_CUSTOMER_DETAIL_TABS = {
  overview: { id: "overview", label: "Visão Geral 360°" },
  history: { id: "history", label: "Histórico & Gráficos" },
  products: { id: "products", label: "Produtos & Mix" },
  motion: { id: "motion", label: "Movimentação Recente" },
} as const;

export type OverviewCustomerDetailTabId =
  (typeof OVERVIEW_CUSTOMER_DETAIL_TABS)[keyof typeof OVERVIEW_CUSTOMER_DETAIL_TABS]["id"];
