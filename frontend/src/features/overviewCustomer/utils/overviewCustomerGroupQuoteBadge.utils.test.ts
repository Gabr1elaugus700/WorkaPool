import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatOverviewCustomerGroupQuoteSellerBadge,
  isOverviewCustomerGroupQuotesRevealRole,
} from "./overviewCustomerGroupQuoteBadge.utils";

describe("formatOverviewCustomerGroupQuoteSellerBadge", () => {
  it("prefers sellerName when present", () => {
    assert.equal(
      formatOverviewCustomerGroupQuoteSellerBadge({
        codRep: 10,
        sellerName: "Ana",
        repShortName: "Rep A",
      }),
      "10 Ana",
    );
  });

  it("falls back to repShortName when sellerName is null", () => {
    assert.equal(
      formatOverviewCustomerGroupQuoteSellerBadge({
        codRep: 10,
        sellerName: null,
        repShortName: "Rep A",
      }),
      "10 Rep A",
    );
  });

  it("uses codRep only when both names are empty", () => {
    assert.equal(
      formatOverviewCustomerGroupQuoteSellerBadge({
        codRep: 10,
        sellerName: null,
        repShortName: null,
      }),
      "10",
    );
  });
});

describe("isOverviewCustomerGroupQuotesRevealRole", () => {
  it("allows ADMIN and GERENTE_DPTO only", () => {
    assert.equal(isOverviewCustomerGroupQuotesRevealRole("ADMIN"), true);
    assert.equal(isOverviewCustomerGroupQuotesRevealRole("GERENTE_DPTO"), true);
    assert.equal(isOverviewCustomerGroupQuotesRevealRole("VENDAS"), false);
    assert.equal(isOverviewCustomerGroupQuotesRevealRole(null), false);
  });
});
