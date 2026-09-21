import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateOverviewCustomerGroupPerdidos } from "../../../../../src/features/overviewCustomer/utils/aggregateOverviewCustomerGroupPerdidos";

describe("aggregateOverviewCustomerGroupPerdidos", () => {
  it("aggregates two lines of the same numped into one pedido with weighted price and margin", () => {
    const rows = aggregateOverviewCustomerGroupPerdidos([
      {
        numped: 100,
        datemi: "2026-08-01",
        qtdped: 2,
        preuni: 10,
        vlrfinal: 20,
        margem: 10,
      },
      {
        numped: 100,
        datemi: "2026-09-01",
        qtdped: 3,
        preuni: 20,
        vlrfinal: 60,
        margem: 20,
      },
    ]);

    assert.deepStrictEqual(rows, [
      {
        numped: 100,
        datemi: "2026-09-01",
        vlrfinal: 80,
        qtdped: 5,
        preuni: 16,
        margem: 17.5,
      },
    ]);
  });

  it("keeps at most 5 pedidos ordered by datemi descending", () => {
    const rows = aggregateOverviewCustomerGroupPerdidos([
      { numped: 1, datemi: "2026-01-01", qtdped: 1, preuni: 1, vlrfinal: 1, margem: 1 },
      { numped: 2, datemi: "2026-02-01", qtdped: 1, preuni: 1, vlrfinal: 1, margem: 1 },
      { numped: 3, datemi: "2026-03-01", qtdped: 1, preuni: 1, vlrfinal: 1, margem: 1 },
      { numped: 4, datemi: "2026-04-01", qtdped: 1, preuni: 1, vlrfinal: 1, margem: 1 },
      { numped: 5, datemi: "2026-05-01", qtdped: 1, preuni: 1, vlrfinal: 1, margem: 1 },
      { numped: 6, datemi: "2026-06-01", qtdped: 1, preuni: 1, vlrfinal: 1, margem: 1 },
    ]);

    assert.deepStrictEqual(
      rows.map((row) => row.numped),
      [6, 5, 4, 3, 2],
    );
  });
});
