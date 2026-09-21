import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerWinsByGroupRow } from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerWinsByGroup";
import { rankOverviewCustomerAbcGroups } from "../../../../../src/features/overviewCustomer/utils/rankOverviewCustomerAbcGroups";

function win(
  overrides: Pick<OverviewCustomerWinsByGroupRow, "grupoCodigo" | "grupoDescricao" | "vlrfinal"> &
    Partial<OverviewCustomerWinsByGroupRow>,
): OverviewCustomerWinsByGroupRow {
  return {
    numped: 1,
    numnfv: 1,
    datemi: "2024-06-01",
    qtdped: 1,
    volume: 1,
    preuni: 1,
    margem: 10,
    ...overrides,
  };
}

describe("rankOverviewCustomerAbcGroups", () => {
  it("orders groups by revenue share descending and keeps at most 5", () => {
    const ranked = rankOverviewCustomerAbcGroups([
      win({ grupoCodigo: "G01", grupoDescricao: "TUBOS", vlrfinal: 40 }),
      win({ grupoCodigo: "G02", grupoDescricao: "CONEXOES", vlrfinal: 10 }),
      win({ grupoCodigo: "G03", grupoDescricao: "VALVULAS", vlrfinal: 20 }),
      win({ grupoCodigo: "G04", grupoDescricao: "FLANGES", vlrfinal: 5 }),
      win({ grupoCodigo: "G05", grupoDescricao: "JUNTAS", vlrfinal: 15 }),
      win({ grupoCodigo: "G06", grupoDescricao: "ANEL", vlrfinal: 10 }),
    ]);

    assert.deepStrictEqual(
      ranked.map((group) => group.grupoCodigo),
      ["G01", "G03", "G05", "G02", "G06"],
    );
    assert.strictEqual(ranked.length, 5);
    assert.deepStrictEqual(ranked[0], {
      grupoCodigo: "G01",
      grupoDescricao: "TUBOS",
      revenueShare: 40,
    });
    assert.ok(ranked.every((group) => !("productCode" in group)));
  });

  it("sums revenue of the same group across orders and computes share against full customer total", () => {
    const ranked = rankOverviewCustomerAbcGroups([
      win({ grupoCodigo: "G01", grupoDescricao: "TUBOS", vlrfinal: 30, numped: 1 }),
      win({ grupoCodigo: "G01", grupoDescricao: "TUBOS", vlrfinal: 20, numped: 2 }),
      win({ grupoCodigo: "G02", grupoDescricao: "CONEXOES", vlrfinal: 50 }),
    ]);

    assert.deepStrictEqual(ranked, [
      { grupoCodigo: "G01", grupoDescricao: "TUBOS", revenueShare: 50 },
      { grupoCodigo: "G02", grupoDescricao: "CONEXOES", revenueShare: 50 },
    ]);
  });

  it("omits OUTROS when it is not among the top 5 groups", () => {
    const ranked = rankOverviewCustomerAbcGroups([
      win({ grupoCodigo: "G01", grupoDescricao: "A", vlrfinal: 50 }),
      win({ grupoCodigo: "G02", grupoDescricao: "B", vlrfinal: 40 }),
      win({ grupoCodigo: "G03", grupoDescricao: "C", vlrfinal: 30 }),
      win({ grupoCodigo: "G04", grupoDescricao: "D", vlrfinal: 20 }),
      win({ grupoCodigo: "G05", grupoDescricao: "E", vlrfinal: 10 }),
      win({ grupoCodigo: "OUTROS", grupoDescricao: "OUTROS PRODUTOS", vlrfinal: 5 }),
    ]);

    assert.strictEqual(ranked.length, 5);
    assert.ok(!ranked.some((group) => group.grupoCodigo === "OUTROS"));
  });

  it("keeps OUTROS PRODUTOS when it ranks in the top 5", () => {
    const ranked = rankOverviewCustomerAbcGroups([
      win({ grupoCodigo: "G01", grupoDescricao: "A", vlrfinal: 50 }),
      win({ grupoCodigo: "OUTROS", grupoDescricao: "OUTROS PRODUTOS", vlrfinal: 40 }),
      win({ grupoCodigo: "G02", grupoDescricao: "B", vlrfinal: 10 }),
    ]);

    assert.deepStrictEqual(ranked[1], {
      grupoCodigo: "OUTROS",
      grupoDescricao: "OUTROS PRODUTOS",
      revenueShare: 40,
    });
  });

  it("breaks equal share ties by grupoCodigo ascending", () => {
    const ranked = rankOverviewCustomerAbcGroups([
      win({ grupoCodigo: "G02", grupoDescricao: "B", vlrfinal: 50 }),
      win({ grupoCodigo: "G01", grupoDescricao: "A", vlrfinal: 50 }),
    ]);

    assert.deepStrictEqual(
      ranked.map((group) => group.grupoCodigo),
      ["G01", "G02"],
    );
  });

  it("returns an empty list when there is no revenue", () => {
    assert.deepStrictEqual(rankOverviewCustomerAbcGroups([]), []);
    assert.deepStrictEqual(
      rankOverviewCustomerAbcGroups([
        win({ grupoCodigo: "G01", grupoDescricao: "TUBOS", vlrfinal: 0 }),
      ]),
      [],
    );
  });
});
