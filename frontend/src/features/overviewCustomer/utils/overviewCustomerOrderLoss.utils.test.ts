import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOverviewCustomerDetailHref,
  buildOverviewCustomerOrderLossHref,
  parseOrderLossCustomerCodeParam,
} from "./overviewCustomerOrderLoss.utils";

describe("overviewCustomerOrderLoss.utils", () => {
  it("builds overview customer detail href by customer code", () => {
    assert.equal(
      buildOverviewCustomerDetailHref(4821),
      "/overview/customers/4821",
    );
  });

  it("builds order-loss href filtered by customer code", () => {
    assert.equal(
      buildOverviewCustomerOrderLossHref(4821),
      "/order-loss?customerCode=4821",
    );
  });

  it("parses valid customer code query param", () => {
    assert.equal(parseOrderLossCustomerCodeParam("4821"), 4821);
    assert.equal(parseOrderLossCustomerCodeParam(null), null);
    assert.equal(parseOrderLossCustomerCodeParam("abc"), null);
    assert.equal(parseOrderLossCustomerCodeParam("0"), null);
  });
});
