import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractOverviewCustomerWinsByGroupSnapshot } from "../../../../../src/features/overviewCustomer/sync/extractOverviewCustomerWinsByGroupSnapshot";

describe("extractOverviewCustomerWinsByGroupSnapshot", () => {
  it("reads ganhos-por-grupo from a published snapshot payload", () => {
    const row = {
      grupoCodigo: "G01",
      grupoDescricao: "TUBOS",
      numped: 9001,
      numnfv: 555,
      datemi: "2026-08-01",
      qtdped: 4,
      volume: 2,
      vlrfinal: 80,
      preuni: 20,
      margem: 30,
    };

    const snapshot = extractOverviewCustomerWinsByGroupSnapshot({
      "ganhos-por-grupo": {
        customers: {
          "123": [row],
        },
      },
    });

    assert.ok(snapshot);
    assert.deepStrictEqual(snapshot.customers["123"], [row]);
  });
});
