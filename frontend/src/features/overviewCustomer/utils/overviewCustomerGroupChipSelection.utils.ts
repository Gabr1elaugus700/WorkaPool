import type { OverviewCustomerDetailTabId } from "../components/detail/overviewCustomerDetailTabs.constants";
import type { OverviewCustomerAbcGroup } from "../types/overviewCustomerAbcGroups.types";

export function selectDefaultGrupoCodigo(grupos: OverviewCustomerAbcGroup[]): string {
  return grupos[0].grupoCodigo;
}

export function shouldFetchAbcGroups(activeTab: OverviewCustomerDetailTabId): boolean {
  return activeTab === "overview";
}

export function resolveGroupAnalysisErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Não foi possível carregar os grupos ABC.";
}
