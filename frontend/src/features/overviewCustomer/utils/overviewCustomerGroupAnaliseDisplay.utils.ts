import type {
  OverviewCustomerGroupGanho,
  OverviewCustomerGroupPerdido,
} from "../types/overviewCustomerGroupAnalise.types";

export const OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE =
  "Nenhum pedido encontrado.";

export const OVERVIEW_CUSTOMER_GROUP_ANALISE_PERDIDOS_ERROR_MESSAGE =
  "Não foi possível carregar pedidos perdidos. Tente novamente.";

export const OVERVIEW_CUSTOMER_GROUP_ANALISE_GANHOS_ERROR_MESSAGE =
  "Não foi possível carregar pedidos ganhos.";

export const OVERVIEW_CUSTOMER_GROUP_ANALISE_MAX_ROWS = 5;

export type OverviewCustomerGroupGanhosCardViewState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "rows"; rows: OverviewCustomerGroupGanho[] };

export type OverviewCustomerGroupPerdidosCardViewState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "rows"; rows: OverviewCustomerGroupPerdido[] };

export function clampGroupAnaliseRows<T>(rows: readonly T[]): T[] {
  return rows.slice(0, OVERVIEW_CUSTOMER_GROUP_ANALISE_MAX_ROWS);
}

export function resolveGanhosCardViewState(input: {
  isInitialLoading: boolean;
  isError: boolean;
  ganhos: OverviewCustomerGroupGanho[] | undefined;
}): OverviewCustomerGroupGanhosCardViewState {
  if (input.isInitialLoading) {
    return { kind: "loading" };
  }

  if (input.isError || input.ganhos == null) {
    return { kind: "error" };
  }

  const rows = clampGroupAnaliseRows(input.ganhos);
  if (rows.length === 0) {
    return { kind: "empty" };
  }

  return { kind: "rows", rows };
}

export function resolvePerdidosCardViewState(input: {
  isInitialLoading: boolean;
  isError: boolean;
  perdidosFailed: boolean;
  perdidos: OverviewCustomerGroupPerdido[] | null | undefined;
  hasLoadedAnalise: boolean;
}): OverviewCustomerGroupPerdidosCardViewState {
  if (input.isInitialLoading) {
    return { kind: "loading" };
  }

  if (input.perdidosFailed || input.perdidos == null) {
    return { kind: "error" };
  }

  if (input.isError && !input.hasLoadedAnalise) {
    return { kind: "error" };
  }

  const rows = clampGroupAnaliseRows(input.perdidos);
  if (rows.length === 0) {
    if (input.isError && input.hasLoadedAnalise) {
      return { kind: "error" };
    }
    return { kind: "empty" };
  }

  return { kind: "rows", rows };
}

export function shouldShowPerdidosEmptyCopy(
  state: OverviewCustomerGroupPerdidosCardViewState,
): boolean {
  return state.kind === "empty";
}
