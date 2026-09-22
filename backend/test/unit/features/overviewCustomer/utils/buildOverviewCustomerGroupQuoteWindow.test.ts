import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOverviewCustomerGroupQuoteWindow } from "../../../../../src/features/overviewCustomer/utils/buildOverviewCustomerGroupQuoteWindow";

describe("buildOverviewCustomerGroupQuoteWindow", () => {
  it("builds a 12-day inclusive start and tomorrow as exclusive end in Sao Paulo", () => {
    const reference = new Date("2026-09-21T12:00:00.000Z");
    const window = buildOverviewCustomerGroupQuoteWindow(reference);

    assert.deepStrictEqual(window, {
      dataInicio: "2026-09-09",
      dataFimExclusiva: "2026-09-22",
    });
  });

  it("rolls the start date back across month boundaries", () => {
    const reference = new Date("2026-03-05T12:00:00.000Z");
    const window = buildOverviewCustomerGroupQuoteWindow(reference);

    assert.deepStrictEqual(window, {
      dataInicio: "2026-02-21",
      dataFimExclusiva: "2026-03-06",
    });
  });
});
