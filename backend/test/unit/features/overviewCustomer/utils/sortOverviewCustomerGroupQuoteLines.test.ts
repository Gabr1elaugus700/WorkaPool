import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OverviewCustomerGroupQuoteSeniorLine } from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerGroupQuotesSeniorQuery";
import { sortOverviewCustomerGroupQuoteLines } from "../../../../../src/features/overviewCustomer/utils/sortOverviewCustomerGroupQuoteLines";

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

describe("sortOverviewCustomerGroupQuoteLines", () => {
  it("orders by issuedAt desc, then order number desc, then product code asc", () => {
    const older = line({ datemi: "2026-09-10", numped: 200, codpro: "P001" });
    const newerLow = line({ datemi: "2026-09-15", numped: 100, codpro: "P001" });
    const newerHigh = line({ datemi: "2026-09-15", numped: 200, codpro: "P002" });
    const newerHighSameOrder = line({
      datemi: "2026-09-15",
      numped: 200,
      codpro: "P001",
    });

    const sorted = sortOverviewCustomerGroupQuoteLines([
      older,
      newerLow,
      newerHigh,
      newerHighSameOrder,
    ]);

    assert.deepStrictEqual(sorted, [
      newerHighSameOrder,
      newerHigh,
      newerLow,
      older,
    ]);
  });
});
