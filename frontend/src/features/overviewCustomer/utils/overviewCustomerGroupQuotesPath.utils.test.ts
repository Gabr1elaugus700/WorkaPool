import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOverviewCustomerGroupQuotesPath } from "./overviewCustomerGroupQuotesPath.utils";

describe("buildOverviewCustomerGroupQuotesPath", () => {
  it("builds the base path without query when no options are set", () => {
    assert.equal(
      buildOverviewCustomerGroupQuotesPath(123, "G030"),
      "/api/overview/customers/123/grupos/G030/cotacoes",
    );
  });

  it("appends codPro and reveal query params when provided", () => {
    assert.equal(
      buildOverviewCustomerGroupQuotesPath(123, "G030", {
        productCode: "P001",
        reveal: true,
      }),
      "/api/overview/customers/123/grupos/G030/cotacoes?codPro=P001&reveal=true",
    );
  });

  it("omits reveal when false", () => {
    assert.equal(
      buildOverviewCustomerGroupQuotesPath(123, "G030", {
        productCode: "P001",
        reveal: false,
      }),
      "/api/overview/customers/123/grupos/G030/cotacoes?codPro=P001",
    );
  });
});
