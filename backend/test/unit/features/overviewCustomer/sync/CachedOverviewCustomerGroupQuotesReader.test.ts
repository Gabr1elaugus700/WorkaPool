import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../../../../src/utils/AppError";
import {
  CachedOverviewCustomerGroupQuotesReader,
  buildOverviewCustomerGroupQuotesCacheKey,
} from "../../../../../src/features/overviewCustomer/sync/CachedOverviewCustomerGroupQuotesReader";
import type {
  OverviewCustomerGroupQuoteSeniorLine,
  OverviewCustomerGroupQuotesQueryInput,
  OverviewCustomerGroupQuotesSeniorReader,
} from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerGroupQuotesSeniorQuery";

const sampleLine: OverviewCustomerGroupQuoteSeniorLine = {
  datemi: "2026-09-09",
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
};

class FakeOverviewCustomerGroupQuotesSeniorReader
  implements OverviewCustomerGroupQuotesSeniorReader
{
  callCount = 0;
  lastInput: OverviewCustomerGroupQuotesQueryInput | null = null;
  inputs: OverviewCustomerGroupQuotesQueryInput[] = [];

  constructor(
    private readonly lines: OverviewCustomerGroupQuoteSeniorLine[] = [],
    private fail = false,
  ) {}

  async fetchLines(
    input: OverviewCustomerGroupQuotesQueryInput,
  ): Promise<OverviewCustomerGroupQuoteSeniorLine[]> {
    this.callCount += 1;
    this.lastInput = input;
    this.inputs.push(input);
    if (this.fail) {
      throw new Error("Sapiens down");
    }
    return this.lines;
  }
}

describe("buildOverviewCustomerGroupQuotesCacheKey", () => {
  it("combines group code and window start date", () => {
    assert.equal(
      buildOverviewCustomerGroupQuotesCacheKey("G030", "2026-09-09"),
      "G030:2026-09-09",
    );
  });
});

describe("CachedOverviewCustomerGroupQuotesReader", () => {
  it("reuses cached lines for the same group on the same Sao Paulo day", async () => {
    const inner = new FakeOverviewCustomerGroupQuotesSeniorReader([sampleLine]);
    const reader = new CachedOverviewCustomerGroupQuotesReader(inner);
    const now = new Date("2026-09-21T12:00:00.000Z");

    const first = await reader.fetchLinesForWindow("G030", now);
    const second = await reader.fetchLinesForWindow("G030", now);

    assert.equal(inner.callCount, 1);
    assert.deepStrictEqual(first, [sampleLine]);
    assert.deepStrictEqual(second, [sampleLine]);
  });

  it("queries Sapiens again when the Sao Paulo calendar day changes", async () => {
    const inner = new FakeOverviewCustomerGroupQuotesSeniorReader([sampleLine]);
    const reader = new CachedOverviewCustomerGroupQuotesReader(inner);

    await reader.fetchLinesForWindow("G030", new Date("2026-09-21T12:00:00.000Z"));
    await reader.fetchLinesForWindow("G030", new Date("2026-09-22T12:00:00.000Z"));

    assert.equal(inner.callCount, 2);
    assert.deepStrictEqual(inner.inputs[0], {
      grpPro: "G030",
      dataInicio: "2026-09-09",
      dataFimExclusiva: "2026-09-22",
    });
    assert.deepStrictEqual(inner.inputs[1], {
      grpPro: "G030",
      dataInicio: "2026-09-10",
      dataFimExclusiva: "2026-09-23",
    });
  });

  it("does not cache Sapiens failures and retries on the next request", async () => {
    const inner = new FakeOverviewCustomerGroupQuotesSeniorReader([sampleLine], true);
    const reader = new CachedOverviewCustomerGroupQuotesReader(inner);
    const now = new Date("2026-09-21T12:00:00.000Z");

    await assert.rejects(
      () => reader.fetchLinesForWindow("G030", now),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 503);
        assert.equal(error.code, "OVERVIEW_CUSTOMER_GROUP_QUOTES_UNAVAILABLE");
        return true;
      },
    );

    inner.fail = false;
    const lines = await reader.fetchLinesForWindow("G030", now);

    assert.equal(inner.callCount, 2);
    assert.deepStrictEqual(lines, [sampleLine]);
  });

  it("caches successful empty results", async () => {
    const inner = new FakeOverviewCustomerGroupQuotesSeniorReader([]);
    const reader = new CachedOverviewCustomerGroupQuotesReader(inner);
    const now = new Date("2026-09-21T12:00:00.000Z");

    const first = await reader.fetchLinesForWindow("G030", now);
    const second = await reader.fetchLinesForWindow("G030", now);

    assert.equal(inner.callCount, 1);
    assert.deepStrictEqual(first, []);
    assert.deepStrictEqual(second, []);
  });
});
