import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createOverviewCustomerDetailRoutes } from "../../../../../src/features/overviewCustomer/http/routes/overviewCustomerDetailRoutes";
import { GetOverviewCustomerDetailUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerDetailUseCase";
import { GetOverviewCustomerMonthlyEvolutionUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewCustomerMonthlyEvolutionUseCase";
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
    }),
  );
  return app;
}

type SeedCustomerParams = {
  customerCode: number;
  tradeName: string;
  document: string;
  primaryCodRep: number | null;
  lastInvoicedPurchaseAt?: string | null;
  orderCountLast12Months?: number;
  revenueLast12Months?: number;
};

function createSeedCustomer(params: SeedCustomerParams): Record<string, unknown> {
  return {
    customerCode: params.customerCode,
    tradeName: params.tradeName,
    document: params.document,
    city: "Maringa",
    state: "PR",
    segment: "Construcao",
    registrationDate: "2024-01-01",
    primaryCodRep: params.primaryCodRep,
    firstInvoicedPurchaseAt: "2024-02-01",
    lastInvoicedPurchaseAt: params.lastInvoicedPurchaseAt ?? "2026-01-01",
    branchIndicator: "MGA",
    orderCountLast12Months: params.orderCountLast12Months,
    revenueLast12Months: params.revenueLast12Months,
  };
}

describe("Overview customer list HTTP", () => {
  it("rejects unauthenticated list request with 401", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);

    const response = await request(app).get("/api/overview/customers");

    assert.strictEqual(response.status, 401);
  });

  it("limits VENDAS list to primary codRep and blocks cross-search visibility", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-1",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "100": createSeedCustomer({
              customerCode: 100,
              tradeName: "Cliente Rep 10",
              document: "11111111000111",
              primaryCodRep: 10,
            }),
            "200": createSeedCustomer({
              customerCode: 200,
              tradeName: "Cliente Rep 20",
              document: "22222222000122",
              primaryCodRep: 20,
            }),
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("VENDAS", 10);

    const listResponse = await request(app)
      .get("/api/overview/customers")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(listResponse.status, 200);
    assert.strictEqual(listResponse.body.items.length, 1);
    assert.strictEqual(listResponse.body.items[0].customerCode, 100);
    assert.strictEqual(listResponse.body.items[0].primaryCodRep, 10);

    const searchResponse = await request(app)
      .get("/api/overview/customers")
      .query({ search: "200" })
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(searchResponse.status, 200);
    assert.strictEqual(searchResponse.body.items.length, 0);
  });

  it("rejects VENDAS list request without codRep claim", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-vendas-no-codrep",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "100": createSeedCustomer({
              customerCode: 100,
              tradeName: "Cliente Rep 10",
              document: "11111111000111",
              primaryCodRep: 10,
            }),
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("VENDAS");

    const response = await request(app)
      .get("/api/overview/customers")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
  });

  it("allows ADMIN and GERENTE_DPTO to see all customers", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-2",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "100": createSeedCustomer({
              customerCode: 100,
              tradeName: "Cliente Rep 10",
              document: "11111111000111",
              primaryCodRep: 10,
            }),
            "200": createSeedCustomer({
              customerCode: 200,
              tradeName: "Cliente Rep 20",
              document: "22222222000122",
              primaryCodRep: 20,
            }),
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);

    const adminResponse = await request(app)
      .get("/api/overview/customers")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);
    assert.strictEqual(adminResponse.status, 200);
    assert.strictEqual(adminResponse.body.items.length, 2);

    const managerResponse = await request(app)
      .get("/api/overview/customers")
      .set("Authorization", `Bearer ${createToken("GERENTE_DPTO")}`);
    assert.strictEqual(managerResponse.status, 200);
    assert.strictEqual(managerResponse.body.items.length, 2);
  });

  it("supports search by exact code, trade name contains, and document digits", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-3",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": createSeedCustomer({
              customerCode: 123,
              tradeName: "ACME Ferragens",
              document: "12.345.678/0001-99",
              primaryCodRep: 10,
            }),
            "124": createSeedCustomer({
              customerCode: 124,
              tradeName: "Outro Cliente",
              document: "99.888.777/0001-66",
              primaryCodRep: 10,
            }),
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("ADMIN");

    const byCode = await request(app)
      .get("/api/overview/customers")
      .query({ search: "123" })
      .set("Authorization", `Bearer ${token}`);
    assert.strictEqual(byCode.status, 200);
    assert.strictEqual(byCode.body.items.length, 1);
    assert.strictEqual(byCode.body.items[0].customerCode, 123);

    const byName = await request(app)
      .get("/api/overview/customers")
      .query({ search: "acme" })
      .set("Authorization", `Bearer ${token}`);
    assert.strictEqual(byName.status, 200);
    assert.strictEqual(byName.body.items.length, 1);
    assert.strictEqual(byName.body.items[0].customerCode, 123);

    const byDocument = await request(app)
      .get("/api/overview/customers")
      .query({ search: "12345678000199" })
      .set("Authorization", `Bearer ${token}`);
    assert.strictEqual(byDocument.status, 200);
    assert.strictEqual(byDocument.body.items.length, 1);
    assert.strictEqual(byDocument.body.items[0].customerCode, 123);
  });

  it("returns only the exact code match when numeric search matches both code and document", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-3b",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": createSeedCustomer({
              customerCode: 123,
              tradeName: "Cliente Codigo 123",
              document: "11.111.111/0001-11",
              primaryCodRep: 10,
            }),
            "999": createSeedCustomer({
              customerCode: 999,
              tradeName: "Cliente Documento 123",
              document: "00.000.123/0001-99",
              primaryCodRep: 10,
            }),
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("ADMIN");

    const response = await request(app)
      .get("/api/overview/customers")
      .query({ search: "123" })
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(
      response.body.items.map((item: { customerCode: number }) => item.customerCode),
      [123],
    );
  });

  it("applies page size 20 and returns page 2", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const customers: Record<string, unknown> = {};
    for (let customerCode = 1; customerCode <= 25; customerCode += 1) {
      customers[String(customerCode)] = createSeedCustomer({
        customerCode,
        tradeName: `Cliente ${customerCode}`,
        document: `${customerCode}`.padStart(14, "0"),
        primaryCodRep: 10,
        orderCountLast12Months: customerCode,
      });
    }
    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-4",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: { customers },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("ADMIN");

    const page1 = await request(app)
      .get("/api/overview/customers")
      .query({ page: "1" })
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(page1.status, 200);
    assert.strictEqual(page1.body.items.length, 20);
    assert.strictEqual(page1.body.pagination.page, 1);
    assert.strictEqual(page1.body.pagination.pageSize, 20);
    assert.strictEqual(page1.body.pagination.totalItems, 25);
    assert.strictEqual(page1.body.pagination.totalPages, 2);
    assert.strictEqual(page1.body.pagination.hasNextPage, true);

    const page2 = await request(app)
      .get("/api/overview/customers")
      .query({ page: "2" })
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(page2.status, 200);
    assert.strictEqual(page2.body.items.length, 5);
    assert.strictEqual(page2.body.pagination.page, 2);
    assert.notDeepStrictEqual(page1.body.items, page2.body.items);
  });

  it("clamps requested page to 1 when there is no served snapshot", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store);
    const token = createToken("ADMIN");

    const response = await request(app)
      .get("/api/overview/customers")
      .query({ page: "3" })
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.items.length, 0);
    assert.strictEqual(response.body.pagination.totalPages, 1);
    assert.strictEqual(response.body.pagination.page, 1);
  });

  it("uses order-count sort by default and falls back to last purchase when missing", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-5",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "101": createSeedCustomer({
              customerCode: 101,
              tradeName: "Cliente Um",
              document: "10110110110101",
              primaryCodRep: 10,
              orderCountLast12Months: 5,
              lastInvoicedPurchaseAt: "2026-03-01",
            }),
            "102": createSeedCustomer({
              customerCode: 102,
              tradeName: "Cliente Dois",
              document: "10210210210210",
              primaryCodRep: 10,
              orderCountLast12Months: 12,
              lastInvoicedPurchaseAt: "2026-01-01",
            }),
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("ADMIN");

    const withOrderCount = await request(app)
      .get("/api/overview/customers")
      .set("Authorization", `Bearer ${token}`);
    assert.strictEqual(withOrderCount.status, 200);
    assert.deepStrictEqual(
      withOrderCount.body.items.map((item: { customerCode: number }) => item.customerCode),
      [102, 101],
    );
    assert.strictEqual(withOrderCount.body.sort.field, "orderCountLast12Months");

    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-6",
        publishedAt: new Date("2026-01-11T00:00:00.000Z"),
        payload: {
          customers: {
            "201": createSeedCustomer({
              customerCode: 201,
              tradeName: "Cliente Fallback 1",
              document: "20120120120120",
              primaryCodRep: 10,
              lastInvoicedPurchaseAt: "2026-05-01",
            }),
            "202": createSeedCustomer({
              customerCode: 202,
              tradeName: "Cliente Fallback 2",
              document: "20220220220220",
              primaryCodRep: 10,
              lastInvoicedPurchaseAt: "2026-08-01",
            }),
          },
        },
      },
      new Date("2026-01-11T00:00:00.000Z"),
    );

    const fallback = await request(app)
      .get("/api/overview/customers")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(fallback.status, 200);
    assert.deepStrictEqual(
      fallback.body.items.map((item: { customerCode: number }) => item.customerCode),
      [202, 201],
    );
    assert.strictEqual(fallback.body.sort.field, "lastPurchase");
  });

  it("returns required row fields and optional commercial columns when present", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    store.seedSuccessfulSnapshot(
      {
        id: "snap-list-7",
        publishedAt: new Date("2026-01-10T00:00:00.000Z"),
        payload: {
          customers: {
            "123": createSeedCustomer({
              customerCode: 123,
              tradeName: "Cliente Colunas",
              document: "12312312312312",
              primaryCodRep: 10,
              lastInvoicedPurchaseAt: "2026-07-01",
              orderCountLast12Months: 7,
              revenueLast12Months: 150000,
            }),
          },
        },
      },
      new Date("2026-01-10T00:00:00.000Z"),
    );
    const app = createApp(store);
    const token = createToken("ADMIN");

    const response = await request(app)
      .get("/api/overview/customers")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body.items[0], {
      customerCode: 123,
      tradeName: "Cliente Colunas",
      city: "Maringa",
      state: "PR",
      primaryCodRep: 10,
      branchIndicator: "MGA",
      lastPurchaseAt: "2026-07-01",
      orderCountLast12Months: 7,
      revenueLast12Months: 150000,
      daysSinceLastPurchase: null,
    });
  });
});
