import DefaultLayout from "@/layout/DefaultLayout";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OverviewCustomerAccessDeniedState } from "../components/OverviewCustomerAccessDeniedState";
import { OverviewCustomerDetailHero } from "../components/detail/OverviewCustomerDetailHero";
import { OverviewCustomerDetailPageHeader } from "../components/detail/OverviewCustomerDetailPageHeader";
import { OverviewCustomerDetailSyncFooter } from "../components/detail/OverviewCustomerDetailSyncFooter";
import { OverviewCustomerDetailTabs } from "../components/detail/OverviewCustomerDetailTabs";
import type { OverviewCustomerDetailTabId } from "../components/detail/overviewCustomerDetailTabs.constants";
import { OverviewCustomerKpiGrid } from "../components/detail/OverviewCustomerKpiGrid";
import { OverviewCustomerMonthlyEvolutionSection } from "../components/OverviewCustomerMonthlyEvolutionSection";
import { OverviewCustomerPurchasedProductsSection } from "../components/OverviewCustomerPurchasedProductsSection";
import { OverviewCustomerRecentCommercialMotionSection } from "../components/OverviewCustomerRecentCommercialMotionSection";
import { OverviewCustomerSectionCard } from "../components/OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../components/OverviewCustomerStateMessage";
import { useOverviewCustomerDetail } from "../hooks/useOverviewCustomerDetail";
import { useOverviewCustomerMonthlyEvolution } from "../hooks/useOverviewCustomerMonthlyEvolution";
import { useOverviewCustomerPurchasedProducts } from "../hooks/useOverviewCustomerPurchasedProducts";
import { useOverviewCustomerRecentCommercialMotion } from "../hooks/useOverviewCustomerRecentCommercialMotion";

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
  const [activeTab, setActiveTab] = useState<OverviewCustomerDetailTabId>("overview");
  const customerCode = useMemo(
    () => parseCustomerCode(params.clienteId),
    [params.clienteId],
  );
  const detailQuery = useOverviewCustomerDetail(customerCode);
  const isHistoryTabActive = activeTab === "history";
  const monthlyQuery = useOverviewCustomerMonthlyEvolution(customerCode, isHistoryTabActive);
  const purchasedProductsQuery = useOverviewCustomerPurchasedProducts(customerCode);
  const recentCommercialMotionQuery = useOverviewCustomerRecentCommercialMotion(customerCode);

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
        <OverviewCustomerSectionCard title="Detalhes do cliente" className="max-w-2xl">
          <OverviewCustomerStateMessage message="Carregando os dados do cliente." />
        </OverviewCustomerSectionCard>
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

  const productCount = purchasedProductsQuery.data?.products.length ?? null;

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
            marginPercentWeightedByRevenue:
              detail.commercialSummary.marginPercentWeightedByRevenue,
            purchaseFrequencyDays: detail.commercialSummary.purchaseFrequencyDays,
            daysSinceLastPurchase: detail.commercialSummary.daysSinceLastPurchase,
          }}
        />
        <OverviewCustomerDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          productCount={productCount}
          overviewPanel={<OverviewCustomerKpiGrid summary={detail.commercialSummary} />}
          historyPanel={
            <OverviewCustomerMonthlyEvolutionSection
              rows={monthlyQuery.data?.monthly ?? []}
              isLoading={monthlyQuery.isLoading}
              isError={monthlyQuery.isError}
              isOpen
              showToggle={false}
              onToggle={() => undefined}
            />
          }
          productsPanel={
            <OverviewCustomerPurchasedProductsSection
              rows={purchasedProductsQuery.data?.products ?? []}
              isLoading={purchasedProductsQuery.isLoading}
              isError={purchasedProductsQuery.isError}
            />
          }
          motionPanel={
            <OverviewCustomerRecentCommercialMotionSection
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
              recentInvoicedOrders={
                recentCommercialMotionQuery.data?.recentInvoicedOrders ?? []
              }
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
