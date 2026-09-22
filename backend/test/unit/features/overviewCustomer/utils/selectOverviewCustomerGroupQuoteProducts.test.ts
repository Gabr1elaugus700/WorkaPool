import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerGroupQuoteSeniorLine } from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerGroupQuotesSeniorQuery";
import { selectOverviewCustomerGroupQuoteProducts } from "../../../../../src/features/overviewCustomer/utils/selectOverviewCustomerGroupQuoteProducts";

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

describe("selectOverviewCustomerGroupQuoteProducts", () => {
  it("returns distinct products for the open customer sorted by product code", () => {
    const products = selectOverviewCustomerGroupQuoteProducts(
      [
        line({ codcli: 200, codpro: "P020", productName: "Beta" }),
        line({ codcli: 999, codpro: "P001", productName: "Other" }),
        line({ codcli: 200, codpro: "P010", productName: "Alpha" }),
        line({ codcli: 200, codpro: "P010", productName: "Alpha again" }),
      ],
      200,
    );

    assert.deepStrictEqual(products, [
      { productCode: "P010", productName: "Alpha" },
      { productCode: "P020", productName: "Beta" },
    ]);
  });

  it("returns an empty list when the open customer has no products", () => {
    const products = selectOverviewCustomerGroupQuoteProducts(
      [line({ codcli: 999, codpro: "P001" })],
      200,
    );
    assert.deepStrictEqual(products, []);
  });
});
