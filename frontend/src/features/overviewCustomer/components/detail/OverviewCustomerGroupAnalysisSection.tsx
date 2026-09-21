import React, { useEffect, useState, type ReactNode } from "react";
import { OverviewCustomerAccessDeniedState } from "../OverviewCustomerAccessDeniedState";
import { OverviewCustomerSectionCard } from "../OverviewCustomerSectionCard";
import { OverviewCustomerStateMessage } from "../OverviewCustomerStateMessage";
import { OverviewCustomerSectionCardSkeleton } from "./OverviewCustomerSectionCardSkeleton";
import { OverviewCustomerGroupAnalysisChips } from "./OverviewCustomerGroupAnalysisChips";
import type { OverviewCustomerDetailTabId } from "./overviewCustomerDetailTabs.constants";
import {
  resolveGroupAnalysisErrorMessage,
  selectDefaultGrupoCodigo,
  shouldFetchAbcGroups,
} from "../../utils/overviewCustomerGroupChipSelection.utils";
import { isOverviewCustomerForbiddenMessage } from "../../utils/overviewCustomerForbidden.utils";
import { useOverviewCustomerAbcGroups } from "../../hooks/useOverviewCustomerAbcGroups";

type OverviewCustomerGroupAnalysisSectionProps = {
  customerCode: number;
  activeTab: OverviewCustomerDetailTabId;
  children: (ctx: {
    grupoCodigo: string;
    grupoDescricao: string;
    revenueShare: number | null;
  }) => ReactNode;
};

const SECTION_TITLE = "Análise comercial por grupo";
const SECTION_DESCRIPTION =
  "Selecione um grupo ABC para ver ganhos e perdidos nos cards abaixo.";

export function OverviewCustomerGroupAnalysisSection({
  customerCode,
  activeTab,
  children,
}: OverviewCustomerGroupAnalysisSectionProps) {
  const fetchEnabled = shouldFetchAbcGroups(activeTab);
  const groupsQuery = useOverviewCustomerAbcGroups(customerCode, fetchEnabled);
  const [selectedGrupoCodigo, setSelectedGrupoCodigo] = useState<string | null>(null);

  useEffect(() => {
    setSelectedGrupoCodigo(null);
  }, [customerCode]);

  useEffect(() => {
    const grupos = groupsQuery.data?.grupos;
    if (grupos && grupos.length > 0 && selectedGrupoCodigo === null) {
      setSelectedGrupoCodigo(selectDefaultGrupoCodigo(grupos));
    }
  }, [groupsQuery.data, selectedGrupoCodigo]);

  if (!fetchEnabled) {
    return null;
  }

  if (groupsQuery.isError) {
    const message = resolveGroupAnalysisErrorMessage(groupsQuery.error);

    if (isOverviewCustomerForbiddenMessage(message)) {
      return <OverviewCustomerAccessDeniedState />;
    }

    return (
      <OverviewCustomerSectionCard title={SECTION_TITLE} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message={message} tone="destructive" />
      </OverviewCustomerSectionCard>
    );
  }

  if (groupsQuery.isLoading) {
    return (
      <OverviewCustomerSectionCardSkeleton
        title={SECTION_TITLE}
        description={SECTION_DESCRIPTION}
        skeletonClassName="h-24"
        loadingLabel="Carregando grupos ABC deste cliente."
      />
    );
  }

  const grupos = groupsQuery.data?.grupos ?? [];
  if (grupos.length === 0) {
    return (
      <OverviewCustomerSectionCard title={SECTION_TITLE} className="border-muted" contentClassName="py-1">
        <OverviewCustomerStateMessage message="Nenhum grupo disponível para análise." />
      </OverviewCustomerSectionCard>
    );
  }

  const resolvedGrupoCodigo =
    selectedGrupoCodigo ?? selectDefaultGrupoCodigo(grupos);
  const selectedGrupo =
    grupos.find((grupo) => grupo.grupoCodigo === resolvedGrupoCodigo) ?? grupos[0];

  return (
    <OverviewCustomerSectionCard
      title={SECTION_TITLE}
      description={SECTION_DESCRIPTION}
      className="border-muted"
      contentClassName="space-y-4"
    >
      <OverviewCustomerGroupAnalysisChips
        grupos={grupos}
        selectedGrupoCodigo={resolvedGrupoCodigo}
        onSelect={setSelectedGrupoCodigo}
      />
      {children({
        grupoCodigo: resolvedGrupoCodigo,
        grupoDescricao: selectedGrupo?.grupoDescricao ?? resolvedGrupoCodigo,
        revenueShare: selectedGrupo?.revenueShare ?? null,
      })}
    </OverviewCustomerSectionCard>
  );
}
