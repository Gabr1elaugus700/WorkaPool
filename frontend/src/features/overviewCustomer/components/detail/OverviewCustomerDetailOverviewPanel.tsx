import type { OverviewCustomerMonthlyEvolutionRow } from "../../types/overviewCustomerMonthlyEvolution.types";
import type { OverviewCustomerPurchasedProduct } from "../../types/overviewCustomerPurchasedProducts.types";
import type { OverviewCustomerRecentInvoicedOrder } from "../../types/overviewCustomerRecentCommercialMotion.types";
import { OverviewCustomerAbcConcentrationCard } from "./OverviewCustomerAbcConcentrationCard";
import { OverviewCustomerMarginRangeCard } from "./OverviewCustomerMarginRangeCard";
import { OverviewCustomerMonthlyEvolutionChart } from "./OverviewCustomerMonthlyEvolutionChart";
import { OverviewCustomerRecentOrdersTeaser } from "./OverviewCustomerRecentOrdersTeaser";
import type { OverviewCustomerDetailTabId } from "./overviewCustomerDetailTabs.constants";
import { OverviewCustomerGroupAnalysisSection } from "./OverviewCustomerGroupAnalysisSection";
import { OverviewCustomerGroupQuotesPanel } from "./OverviewCustomerGroupQuotesPanel";

type OverviewCustomerDetailOverviewPanelProps = {
  customerCode: number;
  activeTab: OverviewCustomerDetailTabId;
  monthlyRows: OverviewCustomerMonthlyEvolutionRow[];
  isMonthlyLoading: boolean;
  isMonthlyError: boolean;
  products: OverviewCustomerPurchasedProduct[];
  isProductsLoading: boolean;
  isProductsError: boolean;
  invoicedOrders: OverviewCustomerRecentInvoicedOrder[];
  invoicedCountLast12Months: number | null;
  isMotionLoading: boolean;
  isMotionError: boolean;
  onViewAllMotion: () => void;
};

export function OverviewCustomerDetailOverviewPanel({
  customerCode,
  activeTab,
  monthlyRows,
  isMonthlyLoading,
  isMonthlyError,
  products,
  isProductsLoading,
  isProductsError,
  invoicedOrders,
  invoicedCountLast12Months,
  isMotionLoading,
  isMotionError,
  onViewAllMotion,
}: OverviewCustomerDetailOverviewPanelProps) {
  const productMargins = products.map((product) => product.marginPercentWeightedByRevenue);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OverviewCustomerMonthlyEvolutionChart
            rows={monthlyRows}
            isLoading={isMonthlyLoading}
            isError={isMonthlyError}
            variant="compact"
          />
        </div>
        <div className="space-y-4">
          <OverviewCustomerAbcConcentrationCard
            products={products}
            isLoading={isProductsLoading}
            isError={isProductsError}
          />
          <OverviewCustomerMarginRangeCard
            margins={productMargins}
            isLoading={isProductsLoading}
            isError={isProductsError}
          />
        </div>
      </div>
      <OverviewCustomerRecentOrdersTeaser
        invoicedOrders={invoicedOrders}
        invoicedCountLast12Months={invoicedCountLast12Months}
        isLoading={isMotionLoading}
        isError={isMotionError}
        onViewAll={onViewAllMotion}
      />
      <OverviewCustomerGroupAnalysisSection customerCode={customerCode} activeTab={activeTab}>
        {({ grupoCodigo }) => (
          <OverviewCustomerGroupQuotesPanel
            customerCode={customerCode}
            grupoCodigo={grupoCodigo}
          />
        )}
      </OverviewCustomerGroupAnalysisSection>
    </div>
  );
}
