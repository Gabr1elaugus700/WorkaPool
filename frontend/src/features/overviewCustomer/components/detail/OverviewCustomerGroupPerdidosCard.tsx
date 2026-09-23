import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import React from "react";
import type { OverviewCustomerGroupPerdidosCardViewState } from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import {
  OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE,
  OVERVIEW_CUSTOMER_GROUP_ANALISE_PERDIDOS_ERROR_MESSAGE,
} from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import {
  formatGroupAnalysisSubtitle,
  formatGroupPerdaTotalPill,
  sumGroupPerdaTotal,
} from "../../utils/overviewCustomerGroupAnaliseHeader.utils";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";
import { OverviewCustomerGroupPerdidoRow } from "./OverviewCustomerGroupPerdidoRow";

type OverviewCustomerGroupPerdidosCardProps = {
  viewState: OverviewCustomerGroupPerdidosCardViewState;
  grupoDescricao: string;
  revenueShare: number | null;
  onRetry?: () => void;
  isRetrying?: boolean;
};

const TITLE = "Perdidos: Cotações Sem Fechamento";

function PerdidosLeadingIcon() {
  return (
    <span
      className="inline-flex size-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
      aria-hidden="true"
    >
      <X className="size-4" strokeWidth={2.5} />
    </span>
  );
}

function PerdaTotalPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
      {label}
    </span>
  );
}

export function OverviewCustomerGroupPerdidosCard({
  viewState,
  grupoDescricao,
  revenueShare,
  onRetry,
  isRetrying = false,
}: OverviewCustomerGroupPerdidosCardProps) {
  const description = formatGroupAnalysisSubtitle(
    "perdidos",
    grupoDescricao,
    revenueShare,
  );

  if (viewState.kind === "loading") {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={TITLE}
        description={description}
        skeletonClassName="h-40"
        loadingLabel="Carregando pedidos perdidos do grupo selecionado."
        contentClassName="py-1"
      />
    );
  }

  if (viewState.kind === "error") {
    return (
      <OverviewCustomerSectionCard
        title={TITLE}
        description={description}
        leading={<PerdidosLeadingIcon />}
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
        title={TITLE}
        description={description}
        leading={<PerdidosLeadingIcon />}
        className="border-destructive/40 bg-destructive/5"
        contentClassName="py-1"
      >
        <OverviewCustomerStateMessage message={OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE} />
      </OverviewCustomerSectionCard>
    );
  }

  const perdaPill = formatGroupPerdaTotalPill(sumGroupPerdaTotal(viewState.rows));

  return (
    <OverviewCustomerSectionCard
      title={TITLE}
      description={description}
      leading={<PerdidosLeadingIcon />}
      trailing={<PerdaTotalPill label={perdaPill} />}
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
