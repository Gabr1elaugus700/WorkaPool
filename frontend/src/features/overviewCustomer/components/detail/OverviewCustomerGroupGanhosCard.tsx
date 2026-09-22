import type { OverviewCustomerGroupGanhosCardViewState } from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import {
  OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE,
  OVERVIEW_CUSTOMER_GROUP_ANALISE_GANHOS_ERROR_MESSAGE,
} from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";
import { OverviewCustomerGroupGanhoRow } from "./OverviewCustomerGroupGanhoRow";

type OverviewCustomerGroupGanhosCardProps = {
  viewState: OverviewCustomerGroupGanhosCardViewState;
};

export function OverviewCustomerGroupGanhosCard({
  viewState,
}: OverviewCustomerGroupGanhosCardProps) {
  const title = "Ganhos";

  if (viewState.kind === "loading") {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={title}
        description="Até 5 notas faturadas do grupo selecionado."
        skeletonClassName="h-40"
        loadingLabel="Carregando pedidos ganhos do grupo selecionado."
        contentClassName="py-1"
      />
    );
  }

  if (viewState.kind === "error") {
    return (
      <OverviewCustomerSectionCard
        title={title}
        description="Até 5 notas faturadas do grupo selecionado."
        className="border-primary/40 bg-primary/5"
        contentClassName="py-1"
      >
        <OverviewCustomerStateMessage
          message={OVERVIEW_CUSTOMER_GROUP_ANALISE_GANHOS_ERROR_MESSAGE}
          tone="destructive"
        />
      </OverviewCustomerSectionCard>
    );
  }

  if (viewState.kind === "empty") {
    return (
      <OverviewCustomerSectionCard
        title={title}
        description="Até 5 notas faturadas do grupo selecionado."
        className="border-primary/40 bg-primary/5"
        contentClassName="py-1"
      >
        <OverviewCustomerStateMessage message={OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE} />
      </OverviewCustomerSectionCard>
    );
  }

  return (
    <OverviewCustomerSectionCard
      title={title}
      description="Até 5 notas faturadas do grupo selecionado."
      className="border-primary/40 bg-primary/5"
      contentClassName="space-y-3"
    >
      <ul className="space-y-3">
        {viewState.rows.map((row) => (
          <OverviewCustomerGroupGanhoRow
            key={`ganho-${row.numnfv}-${row.datemi}`}
            row={row}
          />
        ))}
      </ul>
    </OverviewCustomerSectionCard>
  );
}
