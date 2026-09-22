import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampGroupAnaliseRows,
  OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE,
  resolveGanhosCardViewState,
  resolvePerdidosCardViewState,
  shouldShowPerdidosEmptyCopy,
} from "./overviewCustomerGroupAnaliseDisplay.utils";

const ganho = {
  numnfv: 9,
  numped: 9,
  datemi: "2024-09-01",
  vlrfinal: 90,
  qtdped: 1,
  preuni: 90,
  margem: 10,
};

const perdido = {
  numped: 100,
  datemi: "2026-09-01",
  vlrfinal: 80,
  qtdped: 5,
  preuni: 16,
  margem: 17.5,
  motivo: "Preço acima do mercado.",
};

describe("overviewCustomerGroupAnaliseDisplay.utils", () => {
  it("clamps rows to five items", () => {
    const rows = [1, 2, 3, 4, 5, 6, 7];
    assert.deepEqual(clampGroupAnaliseRows(rows), [1, 2, 3, 4, 5]);
  });

  it("resolves ganhos loading, empty, rows and error states", () => {
    assert.deepEqual(
      resolveGanhosCardViewState({
        isInitialLoading: true,
        isError: false,
        ganhos: undefined,
      }),
      { kind: "loading" },
    );

    assert.deepEqual(
      resolveGanhosCardViewState({
        isInitialLoading: false,
        isError: true,
        ganhos: undefined,
      }),
      { kind: "error" },
    );

    assert.deepEqual(
      resolveGanhosCardViewState({
        isInitialLoading: false,
        isError: false,
        ganhos: [],
      }),
      { kind: "empty" },
    );

    assert.deepEqual(
      resolveGanhosCardViewState({
        isInitialLoading: false,
        isError: false,
        ganhos: [ganho],
      }),
      { kind: "rows", rows: [ganho] },
    );
  });

  it("distinguishes perdidos empty success from Sapiens failure", () => {
    const emptyState = resolvePerdidosCardViewState({
      isInitialLoading: false,
      isError: false,
      perdidosFailed: false,
      perdidos: [],
      hasLoadedAnalise: true,
    });
    assert.equal(emptyState.kind, "empty");
    assert.equal(shouldShowPerdidosEmptyCopy(emptyState), true);
    assert.equal(emptyState.kind === "empty" ? OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE : "", OVERVIEW_CUSTOMER_GROUP_ANALISE_EMPTY_MESSAGE);

    const failedState = resolvePerdidosCardViewState({
      isInitialLoading: false,
      isError: false,
      perdidosFailed: true,
      perdidos: null,
      hasLoadedAnalise: true,
    });
    assert.equal(failedState.kind, "error");
    assert.equal(shouldShowPerdidosEmptyCopy(failedState), false);

    const rowsState = resolvePerdidosCardViewState({
      isInitialLoading: false,
      isError: false,
      perdidosFailed: false,
      perdidos: [perdido],
      hasLoadedAnalise: true,
    });
    assert.deepEqual(rowsState, { kind: "rows", rows: [perdido] });
  });

  it("keeps perdidos in error when query fails after analise loaded", () => {
    const state = resolvePerdidosCardViewState({
      isInitialLoading: false,
      isError: true,
      perdidosFailed: false,
      perdidos: [],
      hasLoadedAnalise: true,
    });

    assert.equal(state.kind, "error");
    assert.equal(shouldShowPerdidosEmptyCopy(state), false);
  });
});
