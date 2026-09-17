import DefaultLayout from "@/layout/DefaultLayout";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OverviewCustomerAccessDeniedState } from "../components/OverviewCustomerAccessDeniedState";
import { OverviewCustomerCommercialSummaryCard } from "../components/OverviewCustomerCommercialSummaryCard";
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
  const [isMonthlyEvolutionOpen, setIsMonthlyEvolutionOpen] = useState(false);
  const customerCode = useMemo(
    () => parseCustomerCode(params.clienteId),
    [params.clienteId],
  );
  const detailQuery = useOverviewCustomerDetail(customerCode);
  const monthlyQuery = useOverviewCustomerMonthlyEvolution(customerCode, isMonthlyEvolutionOpen);
  const purchasedProductsQuery = useOverviewCustomerPurchasedProducts(customerCode);
  const recentCommercialMotionQuery = useOverviewCustomerRecentCommercialMotion(customerCode);

  useEffect(() => {
    setIsMonthlyEvolutionOpen(false);
  }, [customerCode]);

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

  return (
    <DefaultLayout>
      <section className="space-y-4">
        <OverviewCustomerSectionCard
          title={detail.customer.tradeName}
          description={`Cliente #${detail.customer.customerCode} - ${detail.customer.city}/${detail.customer.state}`}
          className="border-muted"
        >
          <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Documento</dt>
              <dd className="font-medium">{detail.customer.document}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Segmento</dt>
              <dd className="font-medium">{detail.customer.segment ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Representante principal</dt>
              <dd className="font-medium">{detail.customer.primaryCodRep ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Filial</dt>
              <dd className="font-medium">{detail.customer.branchIndicator}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Primeira compra (NF faturada)</dt>
              <dd className="font-medium">
                {detail.customer.firstInvoicedPurchaseAt ?? "Não informado"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Última compra (NF faturada)</dt>
              <dd className="font-medium">
                {detail.customer.lastInvoicedPurchaseAt ?? "Não informado"}
              </dd>
            </div>
          </dl>
        </OverviewCustomerSectionCard>

        <OverviewCustomerCommercialSummaryCard summary={detail.commercialSummary} />
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
          recentInvoicedOrders={recentCommercialMotionQuery.data?.recentInvoicedOrders ?? []}
          recentLostOrders={recentCommercialMotionQuery.data?.recentLostOrders ?? []}
          isLoadingInvoiced={recentCommercialMotionQuery.isLoading}
          isLoadingLost={recentCommercialMotionQuery.isLoading}
          isErrorInvoiced={recentCommercialMotionQuery.isError}
          isErrorLost={recentCommercialMotionQuery.isError}
        />

        <OverviewCustomerMonthlyEvolutionSection
          rows={monthlyQuery.data?.monthly ?? []}
          isLoading={monthlyQuery.isLoading}
          isError={monthlyQuery.isError}
          isOpen={isMonthlyEvolutionOpen}
          onToggle={() => setIsMonthlyEvolutionOpen((previous) => !previous)}
        />
        <OverviewCustomerPurchasedProductsSection
          rows={purchasedProductsQuery.data?.products ?? []}
          isLoading={purchasedProductsQuery.isLoading}
          isError={purchasedProductsQuery.isError}
        />

        <p className="px-1 text-xs text-muted-foreground">
          Última sincronização com sucesso:{" "}
          {detail.sync.lastSuccessfulSyncAt ?? "Não informado"}
        </p>
      </section>
    </DefaultLayout>
  );
}

export default OverviewCustomerDetailView;
