import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type {
  OverviewCustomerObservation,
  OverviewCustomerObservationListResponse,
} from "../types/overviewCustomerObservation.types";

/** Same limit as the backend observation body (`VarChar(2000)` after trim). */
export const OBSERVATION_BODY_MAX_LENGTH = 2000;

export const OBSERVATION_SUBMIT_ERROR_MESSAGE = "Não foi possível enviar a observação";
export const OBSERVATION_EDIT_ERROR_MESSAGE = "Não foi possível editar a observação";

const EMPTY_OBSERVATION_PAGE: OverviewCustomerObservationListResponse = {
  items: [],
  hasOlder: false,
  nextBefore: null,
};

export function appendObservation(
  page: OverviewCustomerObservationListResponse | undefined,
  item: OverviewCustomerObservation,
): OverviewCustomerObservationListResponse {
  const base = page ?? EMPTY_OBSERVATION_PAGE;
  if (base.items.some((existing) => existing.id === item.id)) {
    return base;
  }

  return {
    items: [...base.items, item],
    hasOlder: base.hasOlder,
    nextBefore: base.nextBefore,
  };
}

export function prependOlderObservations(
  page: OverviewCustomerObservationListResponse | undefined,
  olderPage: OverviewCustomerObservationListResponse,
): OverviewCustomerObservationListResponse {
  if (!page) {
    return olderPage;
  }

  const loadedIds = new Set(page.items.map((item) => item.id));
  return {
    items: [...olderPage.items.filter((item) => !loadedIds.has(item.id)), ...page.items],
    hasOlder: olderPage.hasOlder,
    nextBefore: olderPage.nextBefore,
  };
}

export function canSubmitObservation(draft: string, isSubmitting: boolean): boolean {
  if (isSubmitting) {
    return false;
  }
  const length = draft.trim().length;
  return length >= 1 && length <= OBSERVATION_BODY_MAX_LENGTH;
}

export function draftAfterObservationSubmitSuccess(): string {
  return "";
}

export function draftAfterObservationSubmitError(draft: string): string {
  return draft;
}

export function dropObservationsPageWhenClosed(
  queryClient: QueryClient,
  queryKey: QueryKey,
  open: boolean,
): void {
  if (open) {
    return;
  }
  queryClient.removeQueries({ queryKey, exact: true });
}

export function replaceObservation(
  page: OverviewCustomerObservationListResponse | undefined,
  item: OverviewCustomerObservation,
): OverviewCustomerObservationListResponse | undefined {
  if (!page) {
    return page;
  }
  return {
    ...page,
    items: page.items.map((existing) => (existing.id === item.id ? item : existing)),
  };
}

export function canSaveObservationEdit(
  draft: string,
  originalBody: string,
  isSaving: boolean,
): boolean {
  return canSubmitObservation(draft, isSaving) && draft.trim() !== originalBody.trim();
}

export function isObservationListLoading(input: {
  open: boolean;
  hasData: boolean;
  isError: boolean;
  isQueryLoading: boolean;
}): boolean {
  if (!input.open) {
    return false;
  }
  if (input.isQueryLoading) {
    return true;
  }
  return !input.hasData && !input.isError;
}
