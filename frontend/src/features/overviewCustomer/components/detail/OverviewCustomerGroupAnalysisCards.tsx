import type { OverviewCustomerGroupAnaliseResponse } from "../../types/overviewCustomerGroupAnalise.types";
import { useOverviewCustomerGroupAnalise } from "../../hooks/useOverviewCustomerGroupAnalise";
import {
  resolveGanhosCardViewState,
  resolvePerdidosCardViewState,
} from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import { isOverviewCustomerForbiddenMessage } from "../../utils/overviewCustomerForbidden.utils";
import { OverviewCustomerAccessDeniedState } from "../OverviewCustomerAccessDeniedState";
import { OverviewCustomerGroupGanhosCard } from "./OverviewCustomerGroupGanhosCard";
import { OverviewCustomerGroupPerdidosCard } from "./OverviewCustomerGroupPerdidosCard";

export type OverviewCustomerGroupAnalysisCardsQuery = {
  data: OverviewCustomerGroupAnaliseResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
};

export type OverviewCustomerGroupAnalysisCardsProps = {
  customerCode: number;
  grupoCodigo: string | null;
  grupoDescricao: string;
  revenueShare: number | null;
  enabled?: boolean;
  query?: OverviewCustomerGroupAnalysisCardsQuery;
};

export function OverviewCustomerGroupAnalysisCards({
  customerCode,
  grupoCodigo,
  grupoDescricao,
  revenueShare,
  enabled = true,
  query,
}: OverviewCustomerGroupAnalysisCardsProps) {
  const internalQuery = useOverviewCustomerGroupAnalise(
    customerCode,
    grupoCodigo,
    enabled && query == null,
  );

  const resolvedQuery = query ?? {
    data: internalQuery.data,
    isLoading: internalQuery.isLoading,
    isError: internalQuery.isError,
    isFetching: internalQuery.isFetching,
    error: internalQuery.error,
    refetch: () => {
      void internalQuery.refetch();
    },
  };

  const { data, isLoading, isError, isFetching, error, refetch } = resolvedQuery;
  const errorMessage = error instanceof Error ? error.message : "";

  if (isError && isOverviewCustomerForbiddenMessage(errorMessage)) {
    return <OverviewCustomerAccessDeniedState />;
  }
  const isInitialLoading = isLoading && data == null;
  const hasLoadedAnalise = data != null;

  const ganhosViewState = resolveGanhosCardViewState({
    isInitialLoading,
    isError: isError && !hasLoadedAnalise,
    ganhos: data?.ganhos,
  });

  const perdidosViewState = resolvePerdidosCardViewState({
    isInitialLoading,
    isError,
    perdidosFailed: data?.perdidosFailed ?? false,
    perdidos: data?.perdidos,
    hasLoadedAnalise,
  });

  const showPerdidosRetry =
    perdidosViewState.kind === "error" && hasLoadedAnalise;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <OverviewCustomerGroupGanhosCard
        viewState={ganhosViewState}
        grupoDescricao={grupoDescricao}
        revenueShare={revenueShare}
      />
      <OverviewCustomerGroupPerdidosCard
        viewState={perdidosViewState}
        grupoDescricao={grupoDescricao}
        revenueShare={revenueShare}
        onRetry={showPerdidosRetry ? refetch : undefined}
        isRetrying={isFetching}
      />
    </div>
  );
}
