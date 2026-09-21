import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createOverviewCustomerDetailRoutes } from "../../../../../src/features/overviewCustomer/http/routes/overviewCustomerDetailRoutes";
import { GetOverviewCustomerDetailUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerDetailUseCase";
import { GetOverviewCustomerMonthlyEvolutionUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerMonthlyEvolutionUseCase";
import { GetOverviewCustomerRecentCommercialMotionUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerRecentCommercialMotionUseCase";
import { GetOverviewCustomerPurchasedProductsUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerPurchasedProductsUseCase";
import { GetOverviewCustomerAbcGroupsUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerAbcGroupsUseCase";
import { GetOverviewCustomerGroupAnaliseUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerGroupAnaliseUseCase";
import { GetOverviewCustomerGroupGanhosUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerGroupGanhosUseCase";
import { ListOverviewCustomersUseCase } from "../../../../../src/features/overviewCustomer/useCases/ListOverviewCustomersUseCase";
import type { OverviewCustomerGroupPerdidoLine } from "../../../../../src/features/overviewCustomer/utils/aggregateOverviewCustomerGroupPerdidos";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

function createToken(role: string, codRep?: number): string {
  return jwt.sign({ id: "user-test", role, codRep }, "dev_secret");
}

class FakeOverviewCustomerGroupPerdidosSenior {
  lastInput: { customerCode: number; grupoCodigo: string } | null = null;

  constructor(
    private readonly lines: OverviewCustomerGroupPerdidoLine[] = [],
    private readonly fail = false,
  ) {}

  async fetchLines(input: {
    customerCode: number;
    grupoCodigo: string;
  }): Promise<OverviewCustomerGroupPerdidoLine[]> {
    this.lastInput = input;
    if (this.fail) {
      throw new Error("Sapiens down");
    }
    return this.lines;
  }
}

class FakeOverviewCustomerOrderLossLookup {
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

function createApp(
  store: InMemoryOverviewCustomerSyncStore,
  options?: {
    senior?: FakeOverviewCustomerGroupPerdidosSenior;
    orderLoss?: FakeOverviewCustomerOrderLossLookup;
  },
): Express {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/overview/customers",
    createOverviewCustomerDetailRoutes({
      getDetail: new GetOverviewCustomerDetailUseCase(store),
      listCustomers: new ListOverviewCustomersUseCase(store),
      getMonthlyEvolution: new GetOverviewCustomerMonthlyEvolutionUseCase(store),
      getRecentCommercialMotion: new GetOverviewCustomerRecentCommercialMotionUseCase(
        store,
      ),
      getPurchasedProducts: new GetOverviewCustomerPurchasedProductsUseCase(store),
      getAbcGroups: new GetOverviewCustomerAbcGroupsUseCase(store),
      getGroupGanhos: new GetOverviewCustomerGroupGanhosUseCase(store),
      getGroupAnalise: new GetOverviewCustomerGroupAnaliseUseCase(
        store,
        options?.senior ?? new FakeOverviewCustomerGroupPerdidosSenior(),
        options?.orderLoss ?? new FakeOverviewCustomerOrderLossLookup(),
      ),
    }),
  );
  return app;
}

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

function ganhoRow(
  grupoCodigo: string,
  grupoDescricao: string,
  vlrfinal: number,
  numped: number,
  datemi = "2024-06-01",
) {
  return {
    grupoCodigo,
    grupoDescricao,
    numped,
    numnfv: numped,
    datemi,
    qtdped: 1,
    volume: 1,
    vlrfinal,
    preuni: vlrfinal,
    margem: 10,
  };
}

describe("Overview customer detail HTTP", () => {
  it("rejects unauthenticated access with 401", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app).get("/api/overview/customers/123");

    assert.strictEqual(response.status, 401);
  });

  it("returns 404 for unknown customer for ADMIN", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-1",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: { customers: {} },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("ADMIN");

    const response = await request(app)
      .get("/api/overview/customers/999999")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 404);
  });

  it("returns 404 for unknown customer for VENDAS", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-1",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: { customers: {} },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("VENDAS", 10);

    const response = await request(app)
      .get("/api/overview/customers/999999")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 404);
  });

  it("rejects VENDAS from another portfolio with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-2",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              lastLostOrderAt: "2026-08-03",
              lastCommercialMovementAt: "2026-08-03",
              branchIndicator: "MGA",
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("VENDAS", 20);

    const response = await request(app)
      .get("/api/overview/customers/123")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
    assert.strictEqual(response.body.error, "Acesso negado");
    assert.strictEqual("customer" in response.body, false);
    assert.strictEqual("sync" in response.body, false);
  });

  it("allows VENDAS when codRep is primary and returns identity + sync freshness", async () => {
    const lastSync = new Date("2026-01-10T00:00:00.000Z");
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-3",
        publishedAt: lastSync,
        payload: {
          "dados-gerais-cliente": {
            customers: {
              "123": {
                customerCode: 123,
                tradeName: "Cliente A",
                document: "00.000.000/0001-00",
                city: "Maringa",
                state: "PR",
                segment: "Construcao",
                registrationDate: "2024-01-15",
                primaryCodRep: 10,
                firstInvoicedPurchaseAt: "2024-02-01",
                lastInvoicedPurchaseAt: "2026-08-01",
                lastLostOrderAt: "2026-08-05",
                lastCommercialMovementAt: "2026-08-05",
                branchIndicator: "BOTH",
              },
            },
          },
          "resumo-comercial": {
            customers: {
              "123": {
                revenueSinceJan2024: 1000,
                revenueLast12Months: 600,
                orderCountSinceJan2024: 10,
                orderCountLast12Months: 6,
                averageTicketSinceJan2024: 100,
                averageTicketLast12Months: 110,
                volumeSinceJan2024: 350,
                volumeLast12Months: 140,
                marginPercentWeightedByRevenue: 22.5,
                purchaseFrequencyDays: 30,
                daysSinceLastPurchase: 12,
              },
            },
          },
        },
      },
      lastSync,
    );
    const app = createApp(store);
    const token = createToken("VENDAS", 10);

    const response = await request(app)
      .get("/api/overview/customers/123")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body.customer, {
      customerCode: 123,
      tradeName: "Cliente A",
      document: "00.000.000/0001-00",
      city: "Maringa",
      state: "PR",
      segment: "Construcao",
      registrationDate: "2024-01-15",
      primaryCodRep: 10,
      firstInvoicedPurchaseAt: "2024-02-01",
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: "2026-08-05",
      lastCommercialMovementAt: "2026-08-05",
      branchIndicator: "BOTH",
      orderCountLast12Months: 6,
      revenueLast12Months: 600,
      daysSinceLastPurchase: 12,
    });
    assert.deepStrictEqual(response.body.sync, {
      lastSuccessfulSyncAt: lastSync.toISOString(),
      servedSnapshotId: "snap-3",
    });
    assert.deepStrictEqual(response.body.commercialSummary, {
      revenueSinceJan2024: 1000,
      revenueLast12Months: 600,
      orderCountSinceJan2024: 10,
      orderCountLast12Months: 6,
      averageTicketSinceJan2024: 100,
      averageTicketLast12Months: 110,
      volumeSinceJan2024: 350,
      volumeLast12Months: 140,
      marginPercentWeightedByRevenue: 22.5,
      purchaseFrequencyDays: 30,
      daysSinceLastPurchase: 12,
      maxInvoicedOrderMarginPercent: null,
      minInvoicedOrderMarginPercent: null,
    });
    assert.strictEqual("purchasedProducts" in response.body, false);
  });

  it("returns empty commercial summary when no resumo-comercial data exists", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-5",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              lastLostOrderAt: null,
              lastCommercialMovementAt: "2026-08-01",
              branchIndicator: "MGA",
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body.commercialSummary, {
      revenueSinceJan2024: 0,
      revenueLast12Months: 0,
      orderCountSinceJan2024: 0,
      orderCountLast12Months: 0,
      averageTicketSinceJan2024: 0,
      averageTicketLast12Months: 0,
      volumeSinceJan2024: 0,
      volumeLast12Months: 0,
      marginPercentWeightedByRevenue: null,
      purchaseFrequencyDays: null,
      daysSinceLastPurchase: null,
      maxInvoicedOrderMarginPercent: null,
      minInvoicedOrderMarginPercent: null,
    });
  });

  it("allows ADMIN and GERENTE_DPTO for any synced customer", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-4",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              lastLostOrderAt: "2026-07-20",
              lastCommercialMovementAt: "2026-08-01",
              branchIndicator: "CTB",
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const admin = await request(app)
      .get("/api/overview/customers/123")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);
    assert.strictEqual(admin.status, 200);

    const manager = await request(app)
      .get("/api/overview/customers/123")
      .set("Authorization", `Bearer ${createToken("GERENTE_DPTO")}`);
    assert.strictEqual(manager.status, 200);
  });

  it("returns monthly evolution payload for authorized users", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-monthly-1",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              lastLostOrderAt: "2026-08-05",
              lastCommercialMovementAt: "2026-08-05",
              branchIndicator: "MGA",
            },
          },
          "evolucao-mensal": {
            customers: {
              "123": [
                {
                  month: "2024-01",
                  revenue: 1000,
                  volume: 80,
                  orderCount: 4,
                  marginPercent: 22.5,
                },
              ],
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/monthly-evolution")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, {
      customerCode: 123,
      monthly: [
        {
          month: "2024-01",
          revenue: 1000,
          volume: 80,
          orderCount: 4,
          marginPercent: 22.5,
        },
      ],
    });
  });

  it("rejects unauthorized VENDAS access on monthly evolution with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-monthly-2",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              lastLostOrderAt: "2026-08-05",
              lastCommercialMovementAt: "2026-08-05",
              branchIndicator: "MGA",
            },
          },
          "evolucao-mensal": {
            customers: {
              "123": [
                {
                  month: "2024-01",
                  revenue: 1000,
                  volume: 80,
                  orderCount: 4,
                  marginPercent: 22.5,
                },
              ],
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/monthly-evolution")
      .set("Authorization", `Bearer ${createToken("VENDAS", 20)}`);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
  });

  it("returns purchased products payload for authorized users", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-products-1",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              lastLostOrderAt: "2026-08-05",
              lastCommercialMovementAt: "2026-08-05",
              branchIndicator: "MGA",
            },
          },
          "produtos-comprados": {
            customers: {
              "123": [
                {
                  productCode: "101072",
                  productName: "Produto A",
                  quantity: 12,
                  volume: 6,
                  revenue: 280,
                  averagePrice: 23.33,
                  marginPercentWeightedByRevenue: 38.57,
                  firstPurchaseAt: "2024-01-10",
                  lastPurchaseAt: "2024-02-10",
                  frequencyDays: 31,
                  revenueShare: 73.68,
                },
              ],
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/purchased-products")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, {
      customerCode: 123,
      products: [
        {
          productCode: "101072",
          productName: "Produto A",
          quantity: 12,
          volume: 6,
          revenue: 280,
          averagePrice: 23.33,
          marginPercentWeightedByRevenue: 38.57,
          firstPurchaseAt: "2024-01-10",
          lastPurchaseAt: "2024-02-10",
          frequencyDays: 31,
          revenueShare: 73.68,
        },
      ],
    });
  });

  it("returns 404 on purchased-products when customer has no synced products slice", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-products-404",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              branchIndicator: "MGA",
            },
          },
          "produtos-comprados": {
            customers: {},
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/purchased-products")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_NOT_FOUND");
  });

  it("rejects unauthenticated purchased-products access with 401", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app).get(
      "/api/overview/customers/123/purchased-products",
    );

    assert.strictEqual(response.status, 401);
  });

  it("rejects unauthorized VENDAS on purchased-products with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-products-2",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              branchIndicator: "MGA",
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/purchased-products")
      .set("Authorization", `Bearer ${createToken("VENDAS", 20)}`);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
  });

  it("rejects unauthenticated recent-orders access with 401", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app).get("/api/overview/customers/123/recent-orders");

    assert.strictEqual(response.status, 401);
  });

  it("returns 404 for unknown customer on recent-orders", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-recent-404",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: { customers: {} },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/999999/recent-orders")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 404);
  });

  it("returns detail first paint movement dates without recent order lists", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-detail-dates",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          "dados-gerais-cliente": {
            customers: {
              "123": {
                customerCode: 123,
                tradeName: "Cliente A",
                document: "00.000.000/0001-00",
                city: "Maringa",
                state: "PR",
                segment: "Construcao",
                registrationDate: "2024-01-15",
                primaryCodRep: 10,
                firstInvoicedPurchaseAt: "2024-02-01",
                lastInvoicedPurchaseAt: "2026-07-01",
                branchIndicator: "MGA",
              },
            },
          },
          "ultimo-pedido-cliente": {
            customers: {
              "123": {
                lastInvoicedPurchaseAt: "2026-08-01",
                lastLostOrderAt: "2026-08-05",
                lastCommercialMovementAt: "2026-08-05",
                invoicedCountLast12Months: 3,
                lostCountLast12Months: 1,
                recentInvoicedOrders: [
                  {
                    orderNumber: 1001,
                    occurredAt: "2026-08-01",
                    codRep: 10,
                    branchCode: 1,
                    revenue: 100,
                    volume: 10,
                    marginPercent: 20,
                    items: [
                      {
                        productCode: "P1",
                        productName: "Produto 1",
                        quantity: 10,
                        volume: 10,
                        revenue: 100,
                        unitPrice: 10,
                        marginPercent: 20,
                      },
                    ],
                  },
                ],
                recentLostOrders: [
                  {
                    orderNumber: 1002,
                    occurredAt: "2026-08-05",
                    codRep: 10,
                    sitped: 5,
                  },
                ],
              },
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.customer.lastInvoicedPurchaseAt, "2026-08-01");
    assert.strictEqual(response.body.customer.lastLostOrderAt, "2026-08-05");
    assert.strictEqual(response.body.customer.lastCommercialMovementAt, "2026-08-05");
    assert.strictEqual(response.body.customer.invoicedCountLast12Months, 3);
    assert.strictEqual(response.body.customer.lostCountLast12Months, 1);
    assert.deepStrictEqual(response.body.orderCounts, {
      invoicedSinceJan2024: 0,
      lostSinceJan2024: 0,
      totalSinceJan2024: 0,
      invoicedLast60Days: 0,
      lostLast60Days: 0,
      totalLast60Days: 0,
    });
    assert.strictEqual("recentInvoicedOrders" in response.body, false);
    assert.strictEqual("recentLostOrders" in response.body, false);
  });

  it("returns detail orderCounts from motion snapshot with derived totals", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-detail-order-counts",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          "dados-gerais-cliente": {
            customers: {
              "123": {
                customerCode: 123,
                tradeName: "Cliente A",
                document: "00.000.000/0001-00",
                city: "Maringa",
                state: "PR",
                segment: "Construcao",
                registrationDate: "2024-01-15",
                primaryCodRep: 10,
                firstInvoicedPurchaseAt: "2024-02-01",
                lastInvoicedPurchaseAt: "2026-07-01",
                branchIndicator: "MGA",
              },
            },
          },
          "ultimo-pedido-cliente": {
            customers: {
              "123": {
                lastInvoicedPurchaseAt: "2026-08-01",
                lastLostOrderAt: "2026-08-05",
                lastCommercialMovementAt: "2026-08-05",
                invoicedCountSinceJan2024: 10,
                lostCountSinceJan2024: 4,
                invoicedCountLast60Days: 2,
                lostCountLast60Days: 1,
                invoicedCountLast12Months: 3,
                lostCountLast12Months: 1,
                recentInvoicedOrders: [],
                recentLostOrders: [],
              },
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body.orderCounts, {
      invoicedSinceJan2024: 10,
      lostSinceJan2024: 4,
      totalSinceJan2024: 14,
      invoicedLast60Days: 2,
      lostLast60Days: 1,
      totalLast60Days: 3,
    });
    assert.strictEqual(response.body.customer.invoicedCountLast12Months, 3);
    assert.strictEqual(response.body.customer.lostCountLast12Months, 1);
  });

  it("returns recent commercial motion slices for authorized users", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-recent-1",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              lastLostOrderAt: "2026-08-05",
              lastCommercialMovementAt: "2026-08-05",
              branchIndicator: "MGA",
            },
          },
          "ultimo-pedido-cliente": {
            customers: {
              "123": {
                lastInvoicedPurchaseAt: "2026-08-01",
                lastLostOrderAt: "2026-08-05",
                lastCommercialMovementAt: "2026-08-05",
                invoicedCountLast12Months: 2,
                lostCountLast12Months: 1,
                recentInvoicedOrders: [
                  {
                    orderNumber: 1001,
                    occurredAt: "2026-08-01",
                    codRep: 10,
                    branchCode: 1,
                    revenue: 100,
                    volume: 10,
                    marginPercent: 20,
                    items: [
                      {
                        productCode: "P1",
                        productName: "Produto 1",
                        quantity: 10,
                        volume: 10,
                        revenue: 100,
                        unitPrice: 10,
                        marginPercent: 20,
                      },
                    ],
                  },
                ],
                recentLostOrders: [
                  {
                    orderNumber: 1002,
                    occurredAt: "2026-08-05",
                    codRep: 10,
                    sitped: 5,
                  },
                ],
              },
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/recent-orders")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, {
      customerCode: 123,
      lastInvoicedPurchaseAt: "2026-08-01",
      lastLostOrderAt: "2026-08-05",
      lastCommercialMovementAt: "2026-08-05",
      invoicedCountLast12Months: 2,
      lostCountLast12Months: 1,
      recentInvoicedOrders: [
        {
          orderNumber: 1001,
          occurredAt: "2026-08-01",
          codRep: 10,
          branchCode: 1,
          revenue: 100,
          volume: 10,
          marginPercent: 20,
          items: [
            {
              productCode: "P1",
              productName: "Produto 1",
              quantity: 10,
              volume: 10,
              revenue: 100,
              unitPrice: 10,
              marginPercent: 20,
            },
          ],
        },
      ],
      recentLostOrders: [
        {
          orderNumber: 1002,
          occurredAt: "2026-08-05",
          codRep: 10,
          sitped: 5,
        },
      ],
    });
  });

  it("rejects unauthorized VENDAS on recent commercial motion with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-recent-2",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": {
              customerCode: 123,
              tradeName: "Cliente A",
              document: "00.000.000/0001-00",
              city: "Maringa",
              state: "PR",
              segment: "Construcao",
              registrationDate: "2024-01-15",
              primaryCodRep: 10,
              firstInvoicedPurchaseAt: "2024-02-01",
              lastInvoicedPurchaseAt: "2026-08-01",
              lastLostOrderAt: "2026-08-05",
              lastCommercialMovementAt: "2026-08-05",
              branchIndicator: "MGA",
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/recent-orders")
      .set("Authorization", `Bearer ${createToken("VENDAS", 20)}`);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
  });

  it("returns top 5 ABC groups by revenue share without SKU fields", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-grupos-1",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer() },
          "ganhos-por-grupo": {
            customers: {
              "123": [
                ganhoRow("G01", "TUBOS", 40, 1),
                ganhoRow("G02", "CONEXOES", 10, 2),
                ganhoRow("G03", "VALVULAS", 20, 3),
                ganhoRow("G04", "FLANGES", 5, 4),
                ganhoRow("G05", "JUNTAS", 15, 5),
                ganhoRow("G06", "ANEL", 10, 6),
              ],
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, {
      customerCode: 123,
      grupos: [
        { grupoCodigo: "G01", grupoDescricao: "TUBOS", revenueShare: 40 },
        { grupoCodigo: "G03", grupoDescricao: "VALVULAS", revenueShare: 20 },
        { grupoCodigo: "G05", grupoDescricao: "JUNTAS", revenueShare: 15 },
        { grupoCodigo: "G02", grupoDescricao: "CONEXOES", revenueShare: 10 },
        { grupoCodigo: "G06", grupoDescricao: "ANEL", revenueShare: 10 },
      ],
    });
    assert.ok(
      response.body.grupos.every(
        (group: { productCode?: string }) => group.productCode === undefined,
      ),
    );
  });

  it("allows GERENTE_DPTO and matching VENDAS to list groups", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-grupos-roles",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer(10) },
          "ganhos-por-grupo": {
            customers: {
              "123": [ganhoRow("G01", "TUBOS", 100, 1)],
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const gerente = await request(app)
      .get("/api/overview/customers/123/grupos")
      .set("Authorization", `Bearer ${createToken("GERENTE_DPTO")}`);
    const vendas = await request(app)
      .get("/api/overview/customers/123/grupos")
      .set("Authorization", `Bearer ${createToken("VENDAS", 10)}`);

    assert.strictEqual(gerente.status, 200);
    assert.strictEqual(vendas.status, 200);
    assert.strictEqual(gerente.body.grupos.length, 1);
  });

  it("returns empty grupos when the customer exists but ganhos-por-grupo is missing", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-grupos-empty",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer() },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { customerCode: 123, grupos: [] });
  });

  it("rejects unauthenticated grupos access with 401", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app).get("/api/overview/customers/123/grupos");

    assert.strictEqual(response.status, 401);
  });

  it("rejects VENDAS from another portfolio on grupos with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-grupos-403",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer(10) },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos")
      .set("Authorization", `Bearer ${createToken("VENDAS", 20)}`);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
  });

  it("rejects USER ALMOX and LOGISTICA on grupos with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-grupos-roles-403",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer() },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    for (const role of ["USER", "ALMOX", "LOGISTICA"] as const) {
      const response = await request(app)
        .get("/api/overview/customers/123/grupos")
        .set("Authorization", `Bearer ${createToken(role)}`);

      assert.strictEqual(response.status, 403, role);
      assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
    }
  });

  it("returns 404 on grupos when the customer is absent from the snapshot", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-grupos-404",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: { customers: {} },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_NOT_FOUND");
  });

  it("returns 400 on grupos for an invalid clienteId", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/0/grupos")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_INVALID_ID");
  });

  it("returns top 5 ganhos of the selected group from the snapshot without SKU fields", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-ganhos-1",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer() },
          "ganhos-por-grupo": {
            customers: {
              "123": [
                ganhoRow("G01", "TUBOS", 10, 1, "2024-01-01"),
                ganhoRow("G01", "TUBOS", 20, 2, "2024-06-01"),
                ganhoRow("G01", "TUBOS", 30, 3, "2024-03-01"),
                ganhoRow("G01", "TUBOS", 40, 4, "2024-08-01"),
                ganhoRow("G01", "TUBOS", 50, 5, "2024-05-01"),
                ganhoRow("G01", "TUBOS", 60, 6, "2024-09-01"),
                ganhoRow("G02", "CONEXOES", 999, 99, "2026-01-01"),
              ],
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/ganhos")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, {
      customerCode: 123,
      grupoCodigo: "G01",
      ganhos: [
        {
          numnfv: 6,
          numped: 6,
          datemi: "2024-09-01",
          vlrfinal: 60,
          qtdped: 1,
          preuni: 60,
          margem: 10,
        },
        {
          numnfv: 4,
          numped: 4,
          datemi: "2024-08-01",
          vlrfinal: 40,
          qtdped: 1,
          preuni: 40,
          margem: 10,
        },
        {
          numnfv: 2,
          numped: 2,
          datemi: "2024-06-01",
          vlrfinal: 20,
          qtdped: 1,
          preuni: 20,
          margem: 10,
        },
        {
          numnfv: 5,
          numped: 5,
          datemi: "2024-05-01",
          vlrfinal: 50,
          qtdped: 1,
          preuni: 50,
          margem: 10,
        },
        {
          numnfv: 3,
          numped: 3,
          datemi: "2024-03-01",
          vlrfinal: 30,
          qtdped: 1,
          preuni: 30,
          margem: 10,
        },
      ],
    });
    assert.ok(
      response.body.ganhos.every(
        (row: { volume?: number; productCode?: string }) =>
          row.volume === undefined && row.productCode === undefined,
      ),
    );
  });

  it("allows GERENTE_DPTO and matching VENDAS to read group ganhos", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-ganhos-roles",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer(10) },
          "ganhos-por-grupo": {
            customers: {
              "123": [ganhoRow("OUTROS", "OUTROS PRODUTOS", 100, 7, "2024-07-01")],
            },
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const gerente = await request(app)
      .get("/api/overview/customers/123/grupos/OUTROS/ganhos")
      .set("Authorization", `Bearer ${createToken("GERENTE_DPTO")}`);
    const vendas = await request(app)
      .get("/api/overview/customers/123/grupos/OUTROS/ganhos")
      .set("Authorization", `Bearer ${createToken("VENDAS", 10)}`);

    assert.strictEqual(gerente.status, 200);
    assert.strictEqual(vendas.status, 200);
    assert.strictEqual(gerente.body.ganhos.length, 1);
    assert.strictEqual(gerente.body.grupoCodigo, "OUTROS");
  });

  it("returns empty ganhos when the customer exists but ganhos-por-grupo is missing", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-ganhos-empty",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer() },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/ganhos")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, {
      customerCode: 123,
      grupoCodigo: "G01",
      ganhos: [],
    });
  });

  it("rejects unauthenticated ganhos access with 401", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app).get(
      "/api/overview/customers/123/grupos/G01/ganhos",
    );

    assert.strictEqual(response.status, 401);
  });

  it("rejects VENDAS from another portfolio on ganhos with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-ganhos-403",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer(10) },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/ganhos")
      .set("Authorization", `Bearer ${createToken("VENDAS", 20)}`);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
  });

  it("rejects USER ALMOX and LOGISTICA on ganhos with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-ganhos-roles-403",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: { "123": identityCustomer() },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    for (const role of ["USER", "ALMOX", "LOGISTICA"] as const) {
      const response = await request(app)
        .get("/api/overview/customers/123/grupos/G01/ganhos")
        .set("Authorization", `Bearer ${createToken(role)}`);

      assert.strictEqual(response.status, 403, role);
      assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
    }
  });

  it("returns 404 on ganhos when the customer is absent from the snapshot", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-ganhos-404",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: { customers: {} },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/ganhos")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_NOT_FOUND");
  });

  it("returns 400 on ganhos for blank grupoCodigo", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/%20/ganhos")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_INVALID_GROUP");
  });

  it("returns at most 5 aggregated perdidos with orderLoss join copy", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedAnaliseSnapshot(store);
    const senior = new FakeOverviewCustomerGroupPerdidosSenior([
      {
        numped: 100,
        datemi: "2026-08-01",
        qtdped: 2,
        preuni: 10,
        vlrfinal: 20,
        margem: 10,
      },
      {
        numped: 100,
        datemi: "2026-09-01",
        qtdped: 3,
        preuni: 20,
        vlrfinal: 60,
        margem: 20,
      },
      perdidoLine(101, "2026-08-15"),
      perdidoLine(102, "2026-07-01"),
      perdidoLine(103, "2026-06-01"),
      perdidoLine(104, "2026-05-01"),
      perdidoLine(105, "2026-04-01"),
    ]);
    const app = createApp(store, {
      senior,
      orderLoss: new FakeOverviewCustomerOrderLossLookup({
        100: "Preço acima do mercado.",
      }),
    });

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/analise")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.perdidosFailed, false);
    assert.deepStrictEqual(
      response.body.perdidos.map((row: { numped: number }) => row.numped),
      [100, 101, 102, 103, 104],
    );
    assert.deepStrictEqual(response.body.perdidos[0], {
      numped: 100,
      datemi: "2026-09-01",
      vlrfinal: 80,
      qtdped: 5,
      preuni: 16,
      margem: 17.5,
      motivo: "Preço acima do mercado.",
    });
    assert.strictEqual(
      response.body.perdidos[1].motivo,
      "Sem justificativa registrada.",
    );
    assert.deepStrictEqual(response.body.ganhos, [
      {
        numnfv: 9,
        numped: 9,
        datemi: "2024-09-01",
        vlrfinal: 90,
        qtdped: 1,
        preuni: 90,
        margem: 10,
      },
    ]);
  });

  it("returns empty perdidos without error when Senior has no lost orders", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedAnaliseSnapshot(store);
    const app = createApp(store, {
      senior: new FakeOverviewCustomerGroupPerdidosSenior([]),
    });

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/analise")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body.perdidos, []);
    assert.strictEqual(response.body.perdidosFailed, false);
    assert.strictEqual(response.body.ganhos.length, 1);
  });

  it("keeps ganhos and marks perdidos failed when Senior throws", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedAnaliseSnapshot(store);
    const app = createApp(store, {
      senior: new FakeOverviewCustomerGroupPerdidosSenior([], true),
    });

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/analise")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.perdidos, null);
    assert.strictEqual(response.body.perdidosFailed, true);
    assert.strictEqual(response.body.ganhos.length, 1);
    assert.equal(
      JSON.stringify(response.body).includes("Nenhum pedido encontrado."),
      false,
    );
  });

  it("passes OUTROS grupoCodigo to the Senior reader", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedAnaliseSnapshot(store, "OUTROS");
    const senior = new FakeOverviewCustomerGroupPerdidosSenior([]);
    const app = createApp(store, { senior });

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/OUTROS/analise")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(senior.lastInput, {
      customerCode: 123,
      grupoCodigo: "OUTROS",
    });
  });

  it("allows GERENTE_DPTO and matching VENDAS to read group analise", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedAnaliseSnapshot(store);
    const app = createApp(store);

    const gerente = await request(app)
      .get("/api/overview/customers/123/grupos/G01/analise")
      .set("Authorization", `Bearer ${createToken("GERENTE_DPTO")}`);
    const vendas = await request(app)
      .get("/api/overview/customers/123/grupos/G01/analise")
      .set("Authorization", `Bearer ${createToken("VENDAS", 10)}`);

    assert.strictEqual(gerente.status, 200);
    assert.strictEqual(vendas.status, 200);
  });

  it("rejects unauthenticated analise access with 401", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app).get(
      "/api/overview/customers/123/grupos/G01/analise",
    );

    assert.strictEqual(response.status, 401);
  });

  it("rejects VENDAS from another portfolio on analise with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedAnaliseSnapshot(store);
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/analise")
      .set("Authorization", `Bearer ${createToken("VENDAS", 99)}`);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
  });

  it("rejects USER ALMOX and LOGISTICA on analise with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedAnaliseSnapshot(store);
    const app = createApp(store);

    for (const role of ["USER", "ALMOX", "LOGISTICA"] as const) {
      const response = await request(app)
        .get("/api/overview/customers/123/grupos/G01/analise")
        .set("Authorization", `Bearer ${createToken(role)}`);
      assert.strictEqual(response.status, 403);
      assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
    }
  });

  it("returns 404 on analise when the customer is absent from the snapshot", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-analise-404",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: { customers: {} },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/G01/analise")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_NOT_FOUND");
  });

  it("returns 400 on analise for blank grupoCodigo", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app)
      .get("/api/overview/customers/123/grupos/%20/analise")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_INVALID_GROUP");
  });
});

function seedAnaliseSnapshot(
  store: InMemoryOverviewCustomerSyncStore,
  grupoCodigo = "G01",
): void {
  store.seedSuccessfulSnapshot(
    {
      id: "snap-analise-1",
      publishedAt: new Date("2026-01-10T00:00:00.000Z"),
      payload: {
        customers: { "123": identityCustomer() },
        "ganhos-por-grupo": {
          customers: {
            "123": [ganhoRow(grupoCodigo, "TUBOS", 90, 9, "2024-09-01")],
          },
        },
      },
    },
    new Date("2026-01-10T00:00:00.000Z"),
  );
}

function perdidoLine(
  numped: number,
  datemi: string,
): OverviewCustomerGroupPerdidoLine {
  return {
    numped,
    datemi,
    qtdped: 1,
    preuni: 1,
    vlrfinal: 1,
    margem: 1,
  };
}
