import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createOverviewCustomerDetailRoutes } from "../../../../../src/features/overviewCustomer/http/routes/overviewCustomerDetailRoutes";
import { GetOverviewCustomerDetailUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerDetailUseCase";
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
});
