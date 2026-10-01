import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isOverviewCustomerGroupQuotesRevealRole } from "./overviewCustomerGroupQuoteBadge.utils";

describe("isOverviewCustomerGroupQuotesRevealRole", () => {
  it("allows ADMIN and GERENTE_DPTO only", () => {
    assert.equal(isOverviewCustomerGroupQuotesRevealRole("ADMIN"), true);
    assert.equal(isOverviewCustomerGroupQuotesRevealRole("GERENTE_DPTO"), true);
    assert.equal(isOverviewCustomerGroupQuotesRevealRole("VENDAS"), false);
    assert.equal(isOverviewCustomerGroupQuotesRevealRole(null), false);
  });
});
