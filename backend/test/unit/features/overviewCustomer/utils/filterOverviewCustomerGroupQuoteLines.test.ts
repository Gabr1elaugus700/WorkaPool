import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerGroupQuoteSeniorLine } from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerGroupQuotesSeniorQuery";
import { filterOverviewCustomerGroupQuoteLines } from "../../../../../src/features/overviewCustomer/utils/filterOverviewCustomerGroupQuoteLines";

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

describe("filterOverviewCustomerGroupQuoteLines", () => {
  it("keeps only lines for the open customer and selected product", () => {
    const keptA = line({ numped: 1, codcli: 200, codpro: "P001", qtdped: 1 });
    const keptB = line({ numped: 1, codcli: 200, codpro: "P001", qtdped: 3 });
    const otherCustomer = line({ numped: 2, codcli: 999, codpro: "P001" });
    const otherProduct = line({ numped: 3, codcli: 200, codpro: "P002" });

    const result = filterOverviewCustomerGroupQuoteLines(
      [keptA, otherCustomer, keptB, otherProduct],
      200,
      "P001",
    );

    assert.deepStrictEqual(result, [keptA, keptB]);
  });
});
