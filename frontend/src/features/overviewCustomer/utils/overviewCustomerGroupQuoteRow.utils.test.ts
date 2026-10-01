import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatOverviewCustomerGroupQuoteSituation,
  getOverviewCustomerGroupQuoteRowTone,
  resolveOverviewCustomerGroupQuoteSellerName,
} from "./overviewCustomerGroupQuoteRow.utils";

describe("resolveOverviewCustomerGroupQuoteSellerName", () => {
  it("prefers sellerName, then repShortName, then codRep", () => {
    assert.equal(
      resolveOverviewCustomerGroupQuoteSellerName({ codRep: 10, sellerName: " Ana ", repShortName: "Rep A" }),
      "Ana",
    );
    assert.equal(
      resolveOverviewCustomerGroupQuoteSellerName({ codRep: 10, sellerName: "  ", repShortName: "Rep A" }),
      "Rep A",
    );
    assert.equal(
      resolveOverviewCustomerGroupQuoteSellerName({ codRep: 10, sellerName: null, repShortName: null }),
      "10",
    );
  });
});

describe("getOverviewCustomerGroupQuoteRowTone", () => {
  it("classifies own rows by outcome and other-customer rows as outro", () => {
    assert.equal(getOverviewCustomerGroupQuoteRowTone({ outcome: "ganha", otherCustomer: false }), "ganha");
    assert.equal(getOverviewCustomerGroupQuoteRowTone({ outcome: "perdida", otherCustomer: false }), "perdida");
    assert.equal(getOverviewCustomerGroupQuoteRowTone({ outcome: "ganha", otherCustomer: true }), "outro");
  });
});

describe("formatOverviewCustomerGroupQuoteSituation", () => {
  it("labels won rows as Faturado and lost rows as Sem fechamento", () => {
    assert.equal(formatOverviewCustomerGroupQuoteSituation("ganha"), "Faturado");
    assert.equal(formatOverviewCustomerGroupQuoteSituation("perdida"), "Sem fechamento");
  });
});
