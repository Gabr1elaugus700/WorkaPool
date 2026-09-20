import DefaultLayout from "@/layout/DefaultLayout";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OverviewCustomerAccessDeniedState } from "../components/OverviewCustomerAccessDeniedState";
import { OverviewCustomerDetailHero } from "../components/detail/OverviewCustomerDetailHero";
import { OverviewCustomerDetailOverviewPanel } from "../components/detail/OverviewCustomerDetailOverviewPanel";
import { OverviewCustomerDetailPageHeader } from "../components/detail/OverviewCustomerDetailPageHeader";
import { OverviewCustomerDetailSyncFooter } from "../components/detail/OverviewCustomerDetailSyncFooter";
import { OverviewCustomerDetailTabs } from "../components/detail/OverviewCustomerDetailTabs";
import type { OverviewCustomerDetailTabId } from "../components/detail/overviewCustomerDetailTabs.constants";
import { OVERVIEW_CUSTOMER_DETAIL_TABS } from "../components/detail/overviewCustomerDetailTabs.constants";
import { OverviewCustomerMonthlyEvolutionChart } from "../components/detail/OverviewCustomerMonthlyEvolutionChart";
import { OverviewCustomerMonthlyEvolutionSection } from "../components/OverviewCustomerMonthlyEvolutionSection";
import { OverviewCustomerDetailFirstPaintSkeleton } from "../components/detail/OverviewCustomerDetailFirstPaintSkeleton";
import { OverviewCustomerDetailMotionPanel } from "../components/detail/OverviewCustomerDetailMotionPanel";
import { OverviewCustomerDetailProductsPanel } from "../components/detail/OverviewCustomerDetailProductsPanel";
import { OverviewCustomerSectionCard } from "../components/OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../components/OverviewCustomerStateMessage";
import { useOverviewCustomerDetail } from "../hooks/useOverviewCustomerDetail";
import { useOverviewCustomerMonthlyEvolution } from "../hooks/useOverviewCustomerMonthlyEvolution";
import { useOverviewCustomerPurchasedProducts } from "../hooks/useOverviewCustomerPurchasedProducts";
import { useOverviewCustomerRecentCommercialMotion } from "../hooks/useOverviewCustomerRecentCommercialMotion";
import {
  shouldFetchMonthlyEvolution,
  shouldFetchPurchasedProducts,
  shouldFetchRecentCommercialMotion,
} from "../utils/overviewCustomerDetailFetch.utils";

function parseCustomerCode(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function OverviewCustomerDetailView() {
  const params = useParams<{ clienteId: string }>();
  const [activeTab, setActiveTab] = useState<OverviewCustomerDetailTabId>(
    OVERVIEW_CUSTOMER_DETAIL_TABS.overview.id,
  );
  const customerCode = useMemo(
    () => parseCustomerCode(params.clienteId),
    [params.clienteId],
  );
  const detailQuery = useOverviewCustomerDetail(customerCode);
  const monthlyQuery = useOverviewCustomerMonthlyEvolution(
    customerCode,
    shouldFetchMonthlyEvolution(activeTab),
  );
  const purchasedProductsQuery = useOverviewCustomerPurchasedProducts(
    customerCode,
    shouldFetchPurchasedProducts(activeTab),
  );
  const recentCommercialMotionQuery = useOverviewCustomerRecentCommercialMotion(
    customerCode,
    shouldFetchRecentCommercialMotion(activeTab),
  );

  if (customerCode == null) {
    return (
      <DefaultLayout>
        <OverviewCustomerSectionCard title="Detalhes do cliente" className="max-w-2xl">
          <OverviewCustomerStateMessage
            message="Código do cliente inválido para abrir os detalhes."
            tone="destructive"
          />
        </OverviewCustomerSectionCard>
      </DefaultLayout>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <DefaultLayout>
        <OverviewCustomerDetailFirstPaintSkeleton />
      </DefaultLayout>
    );
  }

  if (detailQuery.isError) {
    const message =
      detailQuery.error instanceof Error ? detailQuery.error.message : "";

    if (message.includes("Acesso negado")) {
      return (
        <DefaultLayout>
          <OverviewCustomerAccessDeniedState />
        </DefaultLayout>
      );
    }

    if (message.includes("not found")) {
      return (
        <DefaultLayout>
          <OverviewCustomerSectionCard
            title="Cliente não encontrado"
            description="Este cliente ainda não foi sincronizado no Overview."
            className="max-w-2xl"
          >
            <Link to="/overview/customers" className="text-sm text-primary underline">
              Voltar para a lista de clientes
            </Link>
          </OverviewCustomerSectionCard>
        </DefaultLayout>
      );
    }

    return (
      <DefaultLayout>
        <OverviewCustomerSectionCard title="Detalhes do cliente" className="max-w-2xl">
          <OverviewCustomerStateMessage
            message="Não foi possível carregar os dados do cliente. Tente novamente."
            tone="destructive"
          />
        </OverviewCustomerSectionCard>
      </DefaultLayout>
    );
  }

  const detail = detailQuery.data;
  if (!detail) {
    return (
      <DefaultLayout>
        <OverviewCustomerSectionCard title="Detalhes do cliente" className="max-w-2xl">
          <OverviewCustomerStateMessage
            message="Não foi possível carregar os dados do cliente. Tente novamente."
            tone="destructive"
          />
        </OverviewCustomerSectionCard>
      </DefaultLayout>
    );
  }

  const monthlyRows = monthlyQuery.data?.monthly ?? [];
  const products = purchasedProductsQuery.data?.products ?? [];
  const productCount = purchasedProductsQuery.data?.products.length ?? null;
  const recentInvoicedOrders = recentCommercialMotionQuery.data?.recentInvoicedOrders ?? [];

  return (
    <DefaultLayout>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-3 py-6 md:px-6">
        <OverviewCustomerDetailPageHeader
          tradeName={detail.customer.tradeName}
          customerCode={detail.customer.customerCode}
        />
        <OverviewCustomerDetailHero
          customer={detail.customer}
          commercialSignals={{
            purchaseFrequencyDays: detail.commercialSummary.purchaseFrequencyDays,
            daysSinceLastPurchase: detail.commercialSummary.daysSinceLastPurchase,
            maxInvoicedOrderMarginPercent:
              detail.commercialSummary.maxInvoicedOrderMarginPercent ?? null,
            minInvoicedOrderMarginPercent:
              detail.commercialSummary.minInvoicedOrderMarginPercent ?? null,
          }}
        />
        <OverviewCustomerDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          productCount={productCount}
          overviewPanel={
            <OverviewCustomerDetailOverviewPanel
              summary={detail.commercialSummary}
              monthlyRows={monthlyRows}
              isMonthlyLoading={monthlyQuery.isLoading}
              isMonthlyError={monthlyQuery.isError}
              products={products}
              isProductsLoading={purchasedProductsQuery.isLoading}
              isProductsError={purchasedProductsQuery.isError}
              invoicedOrders={recentInvoicedOrders}
              isMotionLoading={recentCommercialMotionQuery.isLoading}
              isMotionError={recentCommercialMotionQuery.isError}
              onViewAllMotion={() =>
                setActiveTab(OVERVIEW_CUSTOMER_DETAIL_TABS.motion.id)
              }
            />
          }
          historyPanel={
            <div className="space-y-4">
              <OverviewCustomerMonthlyEvolutionChart
                rows={monthlyRows}
                isLoading={monthlyQuery.isLoading}
                isError={monthlyQuery.isError}
                variant="full"
              />
              <OverviewCustomerMonthlyEvolutionSection
                rows={monthlyRows}
                isLoading={monthlyQuery.isLoading}
                isError={monthlyQuery.isError}
                isOpen
                showToggle={false}
                onToggle={() => undefined}
              />
            </div>
          }
          productsPanel={
            <OverviewCustomerDetailProductsPanel
              rows={products}
              isLoading={purchasedProductsQuery.isLoading}
              isError={purchasedProductsQuery.isError}
            />
          }
          motionPanel={
            <OverviewCustomerDetailMotionPanel
              customerCode={customerCode}
              lastInvoicedPurchaseAt={
                recentCommercialMotionQuery.data?.lastInvoicedPurchaseAt ??
                detail.customer.lastInvoicedPurchaseAt
              }
              lastLostOrderAt={
                recentCommercialMotionQuery.data?.lastLostOrderAt ??
                detail.customer.lastLostOrderAt
              }
              lastCommercialMovementAt={
                recentCommercialMotionQuery.data?.lastCommercialMovementAt ??
                detail.customer.lastCommercialMovementAt
              }
              invoicedCountLast12Months={
                recentCommercialMotionQuery.data?.invoicedCountLast12Months ??
                detail.customer.invoicedCountLast12Months ??
                null
              }
              lostCountLast12Months={
                recentCommercialMotionQuery.data?.lostCountLast12Months ??
                detail.customer.lostCountLast12Months ??
                null
              }
              recentInvoicedOrders={recentInvoicedOrders}
              recentLostOrders={recentCommercialMotionQuery.data?.recentLostOrders ?? []}
              isLoadingInvoiced={recentCommercialMotionQuery.isLoading}
              isLoadingLost={recentCommercialMotionQuery.isLoading}
              isErrorInvoiced={recentCommercialMotionQuery.isError}
              isErrorLost={recentCommercialMotionQuery.isError}
            />
          }
        />
        <OverviewCustomerDetailSyncFooter
          lastSuccessfulSyncAt={detail.sync.lastSuccessfulSyncAt}
        />
      </div>
    </DefaultLayout>
  );
}

export default OverviewCustomerDetailView;
