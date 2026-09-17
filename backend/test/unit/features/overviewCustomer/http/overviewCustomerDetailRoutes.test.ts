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
import { ListOverviewCustomersUseCase } from "../../../../../src/features/overviewCustomer/useCases/ListOverviewCustomersUseCase";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

function createToken(role: string, codRep?: number): string {
  return jwt.sign({ id: "user-test", role, codRep }, "dev_secret");
}

function createApp(store: InMemoryOverviewCustomerSyncStore): Express {
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
    }),
  );
  return app;
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
    assert.strictEqual("recentInvoicedOrders" in response.body, false);
    assert.strictEqual("recentLostOrders" in response.body, false);
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
});
