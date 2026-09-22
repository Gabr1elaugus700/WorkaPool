import { Button } from "@/components/ui/button";
import type { OverviewCustomerGroupPerdidosCardViewState } from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import {
  OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE,
  OVERVIEW_CUSTOMER_GROUP_ANALISE_PERDIDOS_ERROR_MESSAGE,
} from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";
import { OverviewCustomerGroupPerdidoRow } from "./OverviewCustomerGroupPerdidoRow";

type OverviewCustomerGroupPerdidosCardProps = {
  viewState: OverviewCustomerGroupPerdidosCardViewState;
  onRetry?: () => void;
  isRetrying?: boolean;
};

export function OverviewCustomerGroupPerdidosCard({
  viewState,
  onRetry,
  isRetrying = false,
}: OverviewCustomerGroupPerdidosCardProps) {
  const title = "Perdidos";

  if (viewState.kind === "loading") {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={title}
        description="Até 5 pedidos perdidos do grupo selecionado."
        skeletonClassName="h-40"
        loadingLabel="Carregando pedidos perdidos do grupo selecionado."
        contentClassName="py-1"
      />
    );
  }

  if (viewState.kind === "error") {
    return (
      <OverviewCustomerSectionCard
        title={title}
        description="Até 5 pedidos perdidos do grupo selecionado."
        className="border-destructive/40 bg-destructive/5"
        contentClassName="space-y-3 py-1"
      >
        <OverviewCustomerStateMessage
          message={OVERVIEW_CUSTOMER_GROUP_ANALISE_PERDIDOS_ERROR_MESSAGE}
          tone="destructive"
        />
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            Tentar novamente
          </Button>
        ) : null}
      </OverviewCustomerSectionCard>
    );
  }

  if (viewState.kind === "empty") {
    return (
      <OverviewCustomerSectionCard
        title={title}
        description="Até 5 pedidos perdidos do grupo selecionado."
        className="border-destructive/40 bg-destructive/5"
        contentClassName="py-1"
      >
        <OverviewCustomerStateMessage message={OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE} />
      </OverviewCustomerSectionCard>
    );
  }

  return (
    <OverviewCustomerSectionCard
      title={title}
      description="Até 5 pedidos perdidos do grupo selecionado."
      className="border-destructive/40 bg-destructive/5"
      contentClassName="space-y-3"
    >
      <ul className="space-y-3">
        {viewState.rows.map((row) => (
          <OverviewCustomerGroupPerdidoRow
            key={`perdido-${row.numped}-${row.datemi}`}
            row={row}
          />
        ))}
      </ul>
    </OverviewCustomerSectionCard>
  );
}
