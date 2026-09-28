import type {
  OverviewCustomerObservation,
  OverviewCustomerObservationListResponse,
} from "../types/overviewCustomerObservation.types";

/** Same limit as the backend observation body (`VarChar(2000)` after trim). */
const OBSERVATION_BODY_MAX_LENGTH = 2000;

const OBSERVATION_SUBMIT_ERROR_FALLBACK = "Não foi possível enviar a observação";

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

export function resolveObservationSubmitError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) {
      return message;
    }
  }
  return OBSERVATION_SUBMIT_ERROR_FALLBACK;
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
