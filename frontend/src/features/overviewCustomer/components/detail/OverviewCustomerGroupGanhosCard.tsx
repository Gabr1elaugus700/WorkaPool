import { Check } from "lucide-react";
import React from "react";
import type { OverviewCustomerGroupGanhosCardViewState } from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import {
  OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE,
  OVERVIEW_CUSTOMER_GROUP_ANALISE_GANHOS_ERROR_MESSAGE,
} from "../../utils/overviewCustomerGroupAnaliseDisplay.utils";
import {
  formatGroupAnalysisSubtitle,
  formatGroupVolumePill,
  sumGroupVolumeKg,
} from "../../utils/overviewCustomerGroupAnaliseHeader.utils";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";
import { OverviewCustomerGroupGanhoRow } from "./OverviewCustomerGroupGanhoRow";

type OverviewCustomerGroupGanhosCardProps = {
  viewState: OverviewCustomerGroupGanhosCardViewState;
  grupoDescricao: string;
  revenueShare: number | null;
};

const TITLE = "Ganhos: Notas Faturadas";

function GanhosLeadingIcon() {
  return (
    <span
      className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
      aria-hidden="true"
    >
      <Check className="size-4" strokeWidth={2.5} />
    </span>
  );
}

function VolumePill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
      {label}
    </span>
  );
}

export function OverviewCustomerGroupGanhosCard({
  viewState,
  grupoDescricao,
  revenueShare,
}: OverviewCustomerGroupGanhosCardProps) {
  const description = formatGroupAnalysisSubtitle(
    "ganhos",
    grupoDescricao,
    revenueShare,
  );

  if (viewState.kind === "loading") {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={TITLE}
        description={description}
        skeletonClassName="h-40"
        loadingLabel="Carregando notas faturadas do grupo selecionado."
        contentClassName="py-1"
      />
    );
  }

  if (viewState.kind === "error") {
    return (
      <OverviewCustomerSectionCard
        title={TITLE}
        description={description}
        leading={<GanhosLeadingIcon />}
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
        title={TITLE}
        description={description}
        leading={<GanhosLeadingIcon />}
        className="border-primary/40 bg-primary/5"
        contentClassName="py-1"
      >
        <OverviewCustomerStateMessage message={OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE} />
      </OverviewCustomerSectionCard>
    );
  }

  const volumePill = formatGroupVolumePill(sumGroupVolumeKg(viewState.rows));

  return (
    <OverviewCustomerSectionCard
      title={TITLE}
      description={description}
      leading={<GanhosLeadingIcon />}
      trailing={<VolumePill label={volumePill} />}
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
