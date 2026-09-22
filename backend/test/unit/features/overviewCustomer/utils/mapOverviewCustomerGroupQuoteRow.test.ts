import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerGroupQuoteSeniorLine } from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerGroupQuotesSeniorQuery";
import { mapOverviewCustomerGroupQuoteRow } from "../../../../../src/features/overviewCustomer/utils/mapOverviewCustomerGroupQuoteRow";

function line(
  overrides: Partial<OverviewCustomerGroupQuoteSeniorLine> = {},
): OverviewCustomerGroupQuoteSeniorLine {
  return {
    datemi: "2026-09-15",
    numped: 100,
    sitped: 9,
    codRep: 10,
    aperep: "Rep A",
    codcli: 200,
    apecli: "Cliente A",
    productName: "Produto 1",
    codpro: "P001",
    codgrp: "G030",
    ipi: 1,
    icm: 2,
    icmsPercent: 12,
    qtdped: 2,
    preuni: 10,
    vlrfinal: 20,
    margem: 5,
    preCusto: 8,
    frete: 1.5,
    transportadora: 99,
    freteIncluso: true,
    ...overrides,
  };
}

describe("mapOverviewCustomerGroupQuoteRow", () => {
  it("maps a won line with null lossReason and otherCustomer false", () => {
    const row = mapOverviewCustomerGroupQuoteRow(line({ sitped: 9 }), {
      sellerName: "Ana",
      lossReason: null,
    });

    assert.deepStrictEqual(row, {
      orderNumber: 100,
      issuedAt: "2026-09-15",
      outcome: "ganha",
      situation: 9,
      productCode: "P001",
      productName: "Produto 1",
      quantity: 2,
      unitPrice: 10,
      lineAmount: 20,
      marginPercent: 5,
      ipiAmount: 1,
      icmsAmount: 2,
      icmsPercent: 12,
      costPrice: 8,
      freightAmount: 1.5,
      carrierCode: 99,
      freightIncluded: true,
      codRep: 10,
      sellerName: "Ana",
      lossReason: null,
      otherCustomer: false,
    });
  });

  it("maps a lost line with outcome perdida", () => {
    const row = mapOverviewCustomerGroupQuoteRow(line({ sitped: 5 }), {
      sellerName: null,
      lossReason: "Preço",
    });

    assert.equal(row.outcome, "perdida");
    assert.equal(row.situation, 5);
    assert.equal(row.lossReason, "Preço");
    assert.equal(row.sellerName, null);
    assert.equal(row.otherCustomer, false);
  });
});
