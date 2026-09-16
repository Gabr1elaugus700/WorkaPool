import DefaultLayout from "@/layout/DefaultLayout";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { OverviewCustomerAccessDeniedState } from "../components/OverviewCustomerAccessDeniedState";
import { OverviewCustomerCommercialSummaryCard } from "../components/OverviewCustomerCommercialSummaryCard";
import { useOverviewCustomerDetail } from "../hooks/useOverviewCustomerDetail";

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
  const customerCode = useMemo(
    () => parseCustomerCode(params.clienteId),
    [params.clienteId],
  );
  const detailQuery = useOverviewCustomerDetail(customerCode);

  if (customerCode == null) {
    return (
      <DefaultLayout>
        <p className="text-sm text-destructive">clienteId inválido.</p>
      </DefaultLayout>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <DefaultLayout>
        <p className="text-sm text-muted-foreground">Carregando cliente…</p>
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
          <section className="rounded-md border p-5">
            <h1 className="text-xl font-semibold">Cliente não encontrado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O cliente ainda não foi sincronizado no Overview.
            </p>
            <a
              href="/overview/customers"
              className="mt-4 inline-block text-sm text-primary underline"
            >
              Voltar para lista de clientes
            </a>
          </section>
        </DefaultLayout>
      );
    }

    return (
      <DefaultLayout>
        <p className="text-sm text-destructive">
          Não foi possível carregar os dados do cliente.
        </p>
      </DefaultLayout>
    );
  }

  const detail = detailQuery.data;
  if (!detail) {
    return (
      <DefaultLayout>
        <p className="text-sm text-destructive">
          Não foi possível carregar os dados do cliente.
        </p>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">{detail.customer.tradeName}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente #{detail.customer.customerCode} - {detail.customer.city}/
            {detail.customer.state}
          </p>
        </header>

        <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium">Documento</dt>
            <dd>{detail.customer.document}</dd>
          </div>
          <div>
            <dt className="font-medium">Segmento</dt>
            <dd>{detail.customer.segment ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-medium">Representante principal</dt>
            <dd>{detail.customer.primaryCodRep ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-medium">Filial</dt>
            <dd>{detail.customer.branchIndicator}</dd>
          </div>
          <div>
            <dt className="font-medium">Primeira compra (NF faturada)</dt>
            <dd>{detail.customer.firstInvoicedPurchaseAt ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-medium">Última compra (NF faturada)</dt>
            <dd>{detail.customer.lastInvoicedPurchaseAt ?? "-"}</dd>
          </div>
        </dl>

        <OverviewCustomerCommercialSummaryCard summary={detail.commercialSummary} />

        <p className="text-xs text-muted-foreground">
          Última sincronização com sucesso:{" "}
          {detail.sync.lastSuccessfulSyncAt ?? "indisponível"}
        </p>
      </section>
    </DefaultLayout>
  );
}

export default OverviewCustomerDetailView;
