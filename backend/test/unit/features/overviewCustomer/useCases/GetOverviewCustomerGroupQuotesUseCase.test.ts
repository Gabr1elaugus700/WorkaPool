import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import { AppError } from "../../../../../src/utils/AppError";
import { CachedOverviewCustomerGroupQuotesReader } from "../../../../../src/features/overviewCustomer/sync/CachedOverviewCustomerGroupQuotesReader";
import type { OverviewCustomerGroupQuoteSeniorLine } from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerGroupQuotesSeniorQuery";
import { GetOverviewCustomerGroupQuotesUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerGroupQuotesUseCase";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

function identityCustomer(primaryCodRep = 10) {
  return {
    customerCode: 123,
    tradeName: "Cliente A",
    document: "00.000.000/0001-00",
    city: "Maringa",
    state: "PR",
    segment: "Construcao",
    registrationDate: "2024-01-15",
    primaryCodRep,
    firstInvoicedPurchaseAt: "2024-02-01",
    lastInvoicedPurchaseAt: "2026-08-01",
    lastLostOrderAt: "2026-08-05",
    lastCommercialMovementAt: "2026-08-05",
    branchIndicator: "MGA" as const,
  };
}

function line(
  overrides: Partial<OverviewCustomerGroupQuoteSeniorLine> = {},
): OverviewCustomerGroupQuoteSeniorLine {
  return {
    datemi: "2026-09-15",
    numped: 100,
    sitped: 9,
    codRep: 10,
    aperep: "Rep A",
    codcli: 123,
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

class FakeQuotesReader {
  callCount = 0;
  constructor(
    private readonly lines: OverviewCustomerGroupQuoteSeniorLine[] = [],
    private readonly fail = false,
  ) {}

  async fetchLines(): Promise<OverviewCustomerGroupQuoteSeniorLine[]> {
    this.callCount += 1;
    if (this.fail) {
      throw new AppError({
        message: "Leitura de cotações do grupo indisponível",
        statusCode: 503,
        code: "OVERVIEW_CUSTOMER_GROUP_QUOTES_UNAVAILABLE",
      });
    }
    return this.lines;
  }
}

class FakeOrderLoss {
  sapiensCalled = false;
  constructor(private readonly descriptions: Record<number, string> = {}) {}

  async findLossReasonsByOrderNumbers(
    orderNumbers: number[],
  ): Promise<Array<{ orderNumber: number; description: string }>> {
    return orderNumbers.flatMap((orderNumber) => {
      const description = this.descriptions[orderNumber];
      return description ? [{ orderNumber, description }] : [];
    });
  }
}

class FakeSellers {
  constructor(private readonly names: Record<number, string> = {}) {}

  async findNamesByCodReps(
    codReps: number[],
  ): Promise<Array<{ codRep: number; name: string }>> {
    return codReps.flatMap((codRep) => {
      const name = this.names[codRep];
      return name ? [{ codRep, name }] : [];
    });
  }
}

function seedStore(store: InMemoryOverviewCustomerSyncStore): void {
  store.seedSuccessfulSnapshot(
    {
      id: "snap-1",
      publishedAt: new Date("2026-01-10T00:00:00.000Z"),
      payload: {
        customers: { "123": identityCustomer() },
      },
    },
    new Date("2026-01-10T00:00:00.000Z"),
  );
}

describe("GetOverviewCustomerGroupQuotesUseCase", () => {
  it("filters to open customer and selected product without revealing other customers", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const reader = new FakeQuotesReader([
      line({ numped: 10, codcli: 123, codpro: "P001", qtdped: 1, vlrfinal: 10 }),
      line({ numped: 10, codcli: 123, codpro: "P001", qtdped: 2, vlrfinal: 20 }),
      line({ numped: 20, codcli: 999, codpro: "P001", qtdped: 9, vlrfinal: 90 }),
      line({ numped: 30, codcli: 123, codpro: "P002", qtdped: 3, vlrfinal: 30 }),
    ]);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      reader,
      new FakeOrderLoss(),
      new FakeSellers({ 10: "Ana" }),
    );

    const result = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      productCode: "P001",
      role: Role.ADMIN,
    });

    assert.equal(result.selectedProductCode, "P001");
    assert.equal(result.rows.length, 2);
    assert.equal(result.rows[0]?.quantity, 1);
    assert.equal(result.rows[1]?.quantity, 2);
    assert.equal(result.rows.every((row) => row.otherCustomer === false), true);
    assert.deepStrictEqual(result.products, [
      { productCode: "P001", productName: "Produto 1" },
      { productCode: "P002", productName: "Produto 1" },
    ]);
  });

  it("defaults to the lowest product code when productCode is omitted", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      new FakeQuotesReader([
        line({ codpro: "P020", productName: "Beta" }),
        line({ codpro: "P010", productName: "Alpha" }),
      ]),
      new FakeOrderLoss(),
      new FakeSellers(),
    );

    const result = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      role: Role.ADMIN,
    });

    assert.equal(result.selectedProductCode, "P010");
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?.productCode, "P010");
  });

  it("resolves loss reasons from WorkaPool without calling Sapiens for them", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const orderLoss = new FakeOrderLoss({ 50: "Preço alto" });
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      new FakeQuotesReader([
        line({ numped: 50, sitped: 5 }),
        line({ numped: 51, sitped: 5 }),
        line({ numped: 52, sitped: 9 }),
      ]),
      orderLoss,
      new FakeSellers(),
    );

    const result = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      productCode: "P001",
      role: Role.ADMIN,
    });

    assert.equal(orderLoss.sapiensCalled, false);
    assert.equal(
      result.rows.find((row) => row.orderNumber === 50)?.lossReason,
      "Preço alto",
    );
    assert.equal(
      result.rows.find((row) => row.orderNumber === 51)?.lossReason,
      "Sem justificativa registrada.",
    );
    assert.equal(
      result.rows.find((row) => row.orderNumber === 52)?.lossReason,
      null,
    );
  });

  it("attaches sellerName from WorkaPool users by codRep", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      new FakeQuotesReader([line({ codRep: 10 })]),
      new FakeOrderLoss(),
      new FakeSellers({ 10: "Ana Silva" }),
    );

    const result = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      role: Role.ADMIN,
    });

    assert.equal(result.rows[0]?.sellerName, "Ana Silva");
  });

  it("returns empty rows with HTTP-ready empty lists when customer has no products", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      new FakeQuotesReader([line({ codcli: 999 })]),
      new FakeOrderLoss(),
      new FakeSellers(),
    );

    const result = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      role: Role.ADMIN,
    });

    assert.deepStrictEqual(result.products, []);
    assert.equal(result.selectedProductCode, null);
    assert.deepStrictEqual(result.rows, []);
  });

  it("forbids VENDAS that is not the primary representative", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      new FakeQuotesReader([line()]),
      new FakeOrderLoss(),
      new FakeSellers(),
    );

    await assert.rejects(
      () =>
        useCase.execute({
          customerCode: 123,
          grupoCodigo: "G030",
          role: Role.VENDAS,
          codRep: 99,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 403);
        assert.equal(error.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
        return true;
      },
    );
  });

  it("forbids roles outside ADMIN, GERENTE_DPTO and VENDAS", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      new FakeQuotesReader([line()]),
      new FakeOrderLoss(),
      new FakeSellers(),
    );

    await assert.rejects(
      () =>
        useCase.execute({
          customerCode: 123,
          grupoCodigo: "G030",
          role: Role.USER,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
        return true;
      },
    );
  });

  it("propagates Sapiens unavailable errors", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      new FakeQuotesReader([], true),
      new FakeOrderLoss(),
      new FakeSellers(),
    );

    await assert.rejects(
      () =>
        useCase.execute({
          customerCode: 123,
          grupoCodigo: "G030",
          role: Role.ADMIN,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 503);
        assert.equal(error.code, "OVERVIEW_CUSTOMER_GROUP_QUOTES_UNAVAILABLE");
        return true;
      },
    );
  });

  it("reveals other customers for ADMIN without an extra Sapiens call", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const inner = new FakeQuotesReader([
      line({ numped: 10, codcli: 123, codpro: "P001", apecli: "Cliente A" }),
      line({
        numped: 20,
        codcli: 999,
        codpro: "P001",
        apecli: "Cliente B",
        codRep: 20,
        aperep: "Rep B",
      }),
    ]);
    const reader = new CachedOverviewCustomerGroupQuotesReader(inner);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      reader,
      new FakeOrderLoss(),
      new FakeSellers({ 10: "Ana", 20: "Bruno" }),
    );

    const withoutReveal = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      productCode: "P001",
      role: Role.ADMIN,
      reveal: false,
    });
    const withReveal = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      productCode: "P001",
      role: Role.ADMIN,
      reveal: true,
    });

    assert.equal(withoutReveal.rows.length, 1);
    assert.equal(withoutReveal.rows[0]?.otherCustomer, false);
    assert.equal(withReveal.rows.length, 2);
    assert.equal(inner.callCount, 1);
    const other = withReveal.rows.find((row) => row.otherCustomer);
    assert.ok(other);
    assert.equal(other.customerTradeName, "Cliente B");
    assert.equal(other.sellerName, "Bruno");
    assert.equal(other.repShortName, "Rep B");
  });

  it("reveals other customers for GERENTE_DPTO from the same cache", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const inner = new FakeQuotesReader([
      line({ numped: 10, codcli: 123, codpro: "P001" }),
      line({ numped: 20, codcli: 999, codpro: "P001", apecli: "Outro" }),
    ]);
    const reader = new CachedOverviewCustomerGroupQuotesReader(inner);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      reader,
      new FakeOrderLoss(),
      new FakeSellers(),
    );

    const first = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      productCode: "P001",
      role: Role.GERENTE_DPTO,
    });
    const revealed = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      productCode: "P001",
      role: Role.GERENTE_DPTO,
      reveal: true,
    });

    assert.equal(first.rows.length, 1);
    assert.equal(revealed.rows.length, 2);
    assert.equal(inner.callCount, 1);
  });

  it("ignores reveal for VENDAS and returns only the open customer", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const reader = new FakeQuotesReader([
      line({ numped: 10, codcli: 123, codpro: "P001" }),
      line({ numped: 20, codcli: 999, codpro: "P001", apecli: "Outro" }),
    ]);
    const useCase = new GetOverviewCustomerGroupQuotesUseCase(
      store,
      reader,
      new FakeOrderLoss(),
      new FakeSellers(),
    );

    const result = await useCase.execute({
      customerCode: 123,
      grupoCodigo: "G030",
      productCode: "P001",
      role: Role.VENDAS,
      codRep: 10,
      reveal: true,
    });

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?.otherCustomer, false);
    assert.equal(reader.callCount, 1);
  });
});
