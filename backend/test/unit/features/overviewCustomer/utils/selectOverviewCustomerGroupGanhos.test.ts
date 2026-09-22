import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerWinsByGroupRow } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerWinsByGroup";
import { selectOverviewCustomerGroupGanhos } from "../../../../../src/features/overviewCustomer/utils/selectOverviewCustomerGroupGanhos";

function win(
  overrides: Pick<OverviewCustomerWinsByGroupRow, "grupoCodigo" | "numped" | "datemi"> &
    Partial<OverviewCustomerWinsByGroupRow>,
): OverviewCustomerWinsByGroupRow {
  return {
    grupoDescricao: "TUBOS",
    numnfv: overrides.numped,
    qtdped: 2,
    volume: 2,
    vlrfinal: 40,
    preuni: 20,
    margem: 12,
    ...overrides,
  };
}

describe("selectOverviewCustomerGroupGanhos", () => {
  it("returns at most 5 ganhos of the selected group ordered by datemi then numped descending", () => {
    const selected = selectOverviewCustomerGroupGanhos(
      [
        win({ grupoCodigo: "G01", numped: 1, datemi: "2024-01-01", numnfv: 101 }),
        win({ grupoCodigo: "G01", numped: 2, datemi: "2024-06-01", numnfv: 102 }),
        win({ grupoCodigo: "G01", numped: 3, datemi: "2024-03-01", numnfv: 103 }),
        win({ grupoCodigo: "G01", numped: 4, datemi: "2024-08-01", numnfv: 104 }),
        win({ grupoCodigo: "G01", numped: 5, datemi: "2024-05-01", numnfv: 105 }),
        win({ grupoCodigo: "G01", numped: 6, datemi: "2024-09-01", numnfv: 106 }),
        win({ grupoCodigo: "G02", numped: 99, datemi: "2026-01-01", numnfv: 999, vlrfinal: 999 }),
      ],
      "G01",
    );

    assert.deepStrictEqual(
      selected.map((row) => row.numped),
      [6, 4, 2, 5, 3],
    );
    assert.deepStrictEqual(selected[0], {
      numnfv: 106,
      numped: 6,
      datemi: "2024-09-01",
      vlrfinal: 40,
      qtdped: 2,
      preuni: 20,
      margem: 12,
    });
    assert.ok(selected.every((row) => !("volume" in row) && !("productCode" in row)));
  });

  it("breaks same-date ties by numped descending", () => {
    const selected = selectOverviewCustomerGroupGanhos(
      [
        win({ grupoCodigo: "G01", numped: 10, datemi: "2024-06-01" }),
        win({ grupoCodigo: "G01", numped: 30, datemi: "2024-06-01" }),
        win({ grupoCodigo: "G01", numped: 20, datemi: "2024-06-01" }),
      ],
      "G01",
    );

    assert.deepStrictEqual(
      selected.map((row) => row.numped),
      [30, 20, 10],
    );
  });

  it("keeps a single aggregated snapshot row per numped", () => {
    const selected = selectOverviewCustomerGroupGanhos(
      [win({ grupoCodigo: "G01", numped: 9001, datemi: "2024-06-01", vlrfinal: 80, qtdped: 8 })],
      "G01",
    );

    assert.strictEqual(selected.length, 1);
    assert.strictEqual(selected[0].numped, 9001);
    assert.strictEqual(selected[0].vlrfinal, 80);
  });

  it("filters OUTROS independently from mapped groups", () => {
    const selected = selectOverviewCustomerGroupGanhos(
      [
        win({ grupoCodigo: "OUTROS", grupoDescricao: "OUTROS PRODUTOS", numped: 7, datemi: "2024-07-01" }),
        win({ grupoCodigo: "G01", numped: 8, datemi: "2024-08-01" }),
      ],
      "OUTROS",
    );

    assert.deepStrictEqual(
      selected.map((row) => row.numped),
      [7],
    );
  });

  it("returns an empty list when the group has no rows", () => {
    assert.deepStrictEqual(
      selectOverviewCustomerGroupGanhos(
        [win({ grupoCodigo: "G01", numped: 1, datemi: "2024-06-01" })],
        "G02",
      ),
      [],
    );
    assert.deepStrictEqual(selectOverviewCustomerGroupGanhos([], "G01"), []);
  });
});
