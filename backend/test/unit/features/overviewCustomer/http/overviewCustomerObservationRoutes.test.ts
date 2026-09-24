import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createOverviewCustomerObservationRoutes } from "../../../../../src/features/overviewCustomer/http/routes/overviewCustomerObservationRoutes";
import type { OverviewCustomerObservationAuthorLookup } from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationAuthorRepository";
import {
  type OverviewCustomerObservationRecord,
  OverviewCustomerObservationRepository,
} from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationRepository";
import { CreateOverviewCustomerObservationUseCase } from "../../../../../src/features/overviewCustomer/useCases/CreateOverviewCustomerObservationUseCase";
import { ListOverviewCustomerObservationsUseCase } from "../../../../../src/features/overviewCustomer/useCases/ListOverviewCustomerObservationsUseCase";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

const BASE_URL = "/api/overview/customers";

function createToken(role: string, options?: { id?: string; codRep?: number }): string {
  return jwt.sign(
    { id: options?.id ?? "user-test", role, codRep: options?.codRep },
    "dev_secret",
  );
}

type FindManyArgs = {
  where: {
    customerCode: number;
    OR?: Array<
      | { createdAt: { lt: Date } }
      | { AND: Array<{ createdAt: Date } | { id: { lt: string } }> }
    >;
  };
  take: number;
};

function isBeforeCursor(row: OverviewCustomerObservationRecord, args: FindManyArgs): boolean {
  const or = args.where.OR;
  if (!or) {
    return true;
  }
  return or.some((clause) => {
    if ("createdAt" in clause) {
      return row.createdAt.getTime() < clause.createdAt.lt.getTime();
    }
    const [createdAtClause, idClause] = clause.AND;
    return (
      "createdAt" in createdAtClause &&
      "id" in idClause &&
      row.createdAt.getTime() === createdAtClause.createdAt.getTime() &&
      row.id < idClause.id.lt
    );
  });
}

function createInMemoryObservationPrisma(seed: OverviewCustomerObservationRecord[] = []) {
  const rows: OverviewCustomerObservationRecord[] = seed.map((row) => ({ ...row }));

  return {
    get rows() {
      return rows.map((row) => ({ ...row }));
    },
    overviewCustomerObservation: {
      async findMany(args: FindManyArgs): Promise<OverviewCustomerObservationRecord[]> {
        return rows
          .filter((row) => row.customerCode === args.where.customerCode)
          .filter((row) => isBeforeCursor(row, args))
          .sort(
            (a, b) =>
              b.createdAt.getTime() - a.createdAt.getTime() ||
              (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
          )
          .slice(0, args.take)
          .map((row) => ({ ...row }));
      },

      async create(args: {
        data: {
          customerCode: number;
          authorUserId: string;
          body: string;
          editedAt: null;
        };
      }): Promise<OverviewCustomerObservationRecord> {
        const now = new Date("2026-09-22T12:00:00.000Z");
        const created: OverviewCustomerObservationRecord = {
          id: `created-${rows.length + 1}`,
          customerCode: args.data.customerCode,
          authorUserId: args.data.authorUserId,
          body: args.data.body,
          createdAt: now,
          updatedAt: now,
          editedAt: args.data.editedAt,
        };
        rows.push(created);
        return { ...created };
      },

      async findFirst(): Promise<OverviewCustomerObservationRecord | null> {
        return null;
      },

      async update(): Promise<OverviewCustomerObservationRecord> {
        throw new Error("update not used in observation route tests");
      },
    },
  };
}

class FakeAuthors implements OverviewCustomerObservationAuthorLookup {
  private readonly names: Record<string, string> = {
    "user-admin": "Admin User",
    "user-vendas": "Vendedor A",
    "user-gerente": "Gerente B",
  };

  async findDisplayNamesByIds(
    ids: string[],
  ): Promise<Array<{ id: string; displayName: string }>> {
    return ids.flatMap((id) => {
      const displayName = this.names[id];
      return displayName ? [{ id, displayName }] : [];
    });
  }
}

function seedStore(store: InMemoryOverviewCustomerSyncStore): void {
  store.seedSuccessfulSnapshot(
    {
      id: "snap-1",
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
            branchIndicator: "MGA" as const,
          },
        },
      },
    },
    new Date("2026-01-10T00:00:00.000Z"),
  );
}

function observation(
  index: number,
  overrides?: Partial<OverviewCustomerObservationRecord>,
): OverviewCustomerObservationRecord {
  const createdAt = new Date(Date.UTC(2026, 8, 1, 0, index));
  return {
    id: `obs-${String(index).padStart(3, "0")}`,
    customerCode: 123,
    authorUserId: "user-vendas",
    body: `mensagem ${index}`,
    createdAt,
    updatedAt: createdAt,
    editedAt: null,
    ...overrides,
  };
}

function createHarness(seed: OverviewCustomerObservationRecord[] = []): {
  app: Express;
  prisma: ReturnType<typeof createInMemoryObservationPrisma>;
} {
  const store = new InMemoryOverviewCustomerSyncStore();
  seedStore(store);
  const prisma = createInMemoryObservationPrisma(seed);
  const repo = new OverviewCustomerObservationRepository(prisma);
  const authors = new FakeAuthors();

  const app = express();
  app.use(express.json());
  app.use(
    `${BASE_URL}/:clienteId/observations`,
    createOverviewCustomerObservationRoutes({
      listObservations: new ListOverviewCustomerObservationsUseCase(store, repo, authors),
      createObservation: new CreateOverviewCustomerObservationUseCase(store, repo, authors),
    }),
  );
  return { app, prisma };
}

describe("GET /api/overview/customers/:clienteId/observations", () => {
  it("returns 401 without token", async () => {
    const { app } = createHarness();

    const response = await request(app).get(`${BASE_URL}/123/observations`);

    assert.equal(response.status, 401);
  });

  it("returns empty thread for authorized caller (OBSCHAT-02 AC2)", async () => {
    const { app } = createHarness();

    const response = await request(app)
      .get(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { items: [], hasOlder: false, nextBefore: null });
  });

  it("returns items ascending with author display name for VENDAS owner (OBSCHAT-02 AC1)", async () => {
    const { app } = createHarness([
      observation(2, { authorUserId: "user-admin" }),
      observation(1),
    ]);

    const response = await request(app)
      .get(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("VENDAS", { codRep: 10 })}`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.items.map((item: { id: string; authorDisplayName: string }) => [
        item.id,
        item.authorDisplayName,
      ]),
      [
        ["obs-001", "Vendedor A"],
        ["obs-002", "Admin User"],
      ],
    );
    assert.equal(response.body.hasOlder, false);
    assert.equal(response.body.nextBefore, null);
  });

  it("returns newest 50 with hasOlder and nextBefore when thread has 51 (OBSCHAT-06)", async () => {
    const seed = Array.from({ length: 51 }, (_, index) => observation(index + 1));
    const { app } = createHarness(seed);

    const response = await request(app)
      .get(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("GERENTE_DPTO")}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.items.length, 50);
    assert.equal(response.body.items[0].id, "obs-002");
    assert.equal(response.body.items[49].id, "obs-051");
    assert.equal(response.body.hasOlder, true);
    assert.deepEqual(response.body.nextBefore, {
      createdAt: seed[1].createdAt.toISOString(),
      id: "obs-002",
    });
  });

  it("forwards beforeCreatedAt + beforeId cursor to load the older page", async () => {
    const seed = Array.from({ length: 51 }, (_, index) => observation(index + 1));
    const { app } = createHarness(seed);

    const response = await request(app)
      .get(`${BASE_URL}/123/observations`)
      .query({ beforeCreatedAt: seed[1].createdAt.toISOString(), beforeId: "obs-002" })
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.items.map((item: { id: string }) => item.id),
      ["obs-001"],
    );
    assert.equal(response.body.hasOlder, false);
    assert.equal(response.body.nextBefore, null);
  });

  it("returns 400 OBSERVATION_INVALID_CURSOR when only one cursor param is sent", async () => {
    const { app } = createHarness();

    const response = await request(app)
      .get(`${BASE_URL}/123/observations`)
      .query({ beforeId: "obs-002" })
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.equal(response.status, 400);
    assert.equal(response.body.code, "OBSERVATION_INVALID_CURSOR");
  });

  it("returns 400 OBSERVATION_INVALID_CURSOR when beforeCreatedAt is not an ISO datetime", async () => {
    const { app } = createHarness();

    const response = await request(app)
      .get(`${BASE_URL}/123/observations`)
      .query({ beforeCreatedAt: "ontem", beforeId: "obs-002" })
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.equal(response.status, 400);
    assert.equal(response.body.code, "OBSERVATION_INVALID_CURSOR");
  });

  it("returns 400 OVERVIEW_CUSTOMER_INVALID_ID for non-numeric clienteId", async () => {
    const { app } = createHarness();

    const response = await request(app)
      .get(`${BASE_URL}/abc/observations`)
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.equal(response.status, 400);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_INVALID_ID");
  });

  it("returns 403 OVERVIEW_CUSTOMER_FORBIDDEN for VENDAS of another codRep (OBSCHAT-02 AC4)", async () => {
    const { app } = createHarness([observation(1)]);

    const response = await request(app)
      .get(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("VENDAS", { codRep: 99 })}`);

    assert.equal(response.status, 403);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
    assert.equal(response.body.items, undefined);
  });

  it("returns 403 OVERVIEW_CUSTOMER_FORBIDDEN for disallowed role (OBSCHAT-02 AC5)", async () => {
    const { app } = createHarness();

    const response = await request(app)
      .get(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("LOGISTICA")}`);

    assert.equal(response.status, 403);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
  });

  it("returns 404 OVERVIEW_CUSTOMER_NOT_FOUND for unknown customer (OBSCHAT-02 AC6)", async () => {
    const { app } = createHarness();

    const response = await request(app)
      .get(`${BASE_URL}/999/observations`)
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.equal(response.status, 404);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_NOT_FOUND");
  });
});

describe("POST /api/overview/customers/:clienteId/observations", () => {
  it("returns 401 without token", async () => {
    const { app, prisma } = createHarness();

    const response = await request(app)
      .post(`${BASE_URL}/123/observations`)
      .send({ body: "oi" });

    assert.equal(response.status, 401);
    assert.equal(prisma.rows.length, 0);
  });

  it("creates observation with trimmed body and author from token for VENDAS owner (OBSCHAT-03)", async () => {
    const { app, prisma } = createHarness();

    const response = await request(app)
      .post(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("VENDAS", { id: "user-vendas", codRep: 10 })}`)
      .send({ body: "  cliente pediu retorno  " });

    assert.equal(response.status, 201);
    assert.equal(response.body.body, "cliente pediu retorno");
    assert.equal(response.body.authorUserId, "user-vendas");
    assert.equal(response.body.authorDisplayName, "Vendedor A");
    assert.equal(response.body.customerCode, 123);
    assert.equal(response.body.editedAt, null);
    assert.equal(prisma.rows.length, 1);
  });

  for (const [role, id] of [
    ["ADMIN", "user-admin"],
    ["GERENTE_DPTO", "user-gerente"],
  ] as const) {
    it(`returns 201 for ${role}`, async () => {
      const { app, prisma } = createHarness();

      const response = await request(app)
        .post(`${BASE_URL}/123/observations`)
        .set("Authorization", `Bearer ${createToken(role, { id })}`)
        .send({ body: "anotação" });

      assert.equal(response.status, 201);
      assert.equal(response.body.authorUserId, id);
      assert.equal(prisma.rows.length, 1);
    });
  }

  for (const [label, payload] of [
    ["missing body", {}],
    ["non-string body", { body: 42 }],
    ["blank body", { body: "   " }],
    ["body over 2000 chars", { body: "a".repeat(2001) }],
  ] as const) {
    it(`returns 400 OBSERVATION_INVALID_BODY for ${label} and does not persist`, async () => {
      const { app, prisma } = createHarness();

      const response = await request(app)
        .post(`${BASE_URL}/123/observations`)
        .set("Authorization", `Bearer ${createToken("ADMIN", { id: "user-admin" })}`)
        .send(payload);

      assert.equal(response.status, 400);
      assert.equal(response.body.code, "OBSERVATION_INVALID_BODY");
      assert.equal(prisma.rows.length, 0);
    });
  }

  it("returns 400 OVERVIEW_CUSTOMER_INVALID_ID for non-numeric clienteId", async () => {
    const { app, prisma } = createHarness();

    const response = await request(app)
      .post(`${BASE_URL}/abc/observations`)
      .set("Authorization", `Bearer ${createToken("ADMIN")}`)
      .send({ body: "oi" });

    assert.equal(response.status, 400);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_INVALID_ID");
    assert.equal(prisma.rows.length, 0);
  });

  it("returns 403 OVERVIEW_CUSTOMER_FORBIDDEN for VENDAS of another codRep and does not persist (OBSCHAT-03 AC6)", async () => {
    const { app, prisma } = createHarness();

    const response = await request(app)
      .post(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("VENDAS", { id: "user-vendas", codRep: 99 })}`)
      .send({ body: "oi" });

    assert.equal(response.status, 403);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
    assert.equal(prisma.rows.length, 0);
  });

  it("returns 403 before body validation for VENDAS of another codRep sending a malformed body", async () => {
    const { app, prisma } = createHarness();

    const response = await request(app)
      .post(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("VENDAS", { id: "user-vendas", codRep: 99 })}`)
      .send({});

    assert.equal(response.status, 403);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
    assert.equal(prisma.rows.length, 0);
  });

  it("returns 403 OVERVIEW_CUSTOMER_FORBIDDEN for disallowed role", async () => {
    const { app, prisma } = createHarness();

    const response = await request(app)
      .post(`${BASE_URL}/123/observations`)
      .set("Authorization", `Bearer ${createToken("ALMOX")}`)
      .send({ body: "oi" });

    assert.equal(response.status, 403);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_FORBIDDEN");
    assert.equal(prisma.rows.length, 0);
  });

  it("returns 404 OVERVIEW_CUSTOMER_NOT_FOUND for unknown customer and does not persist", async () => {
    const { app, prisma } = createHarness();

    const response = await request(app)
      .post(`${BASE_URL}/999/observations`)
      .set("Authorization", `Bearer ${createToken("ADMIN")}`)
      .send({ body: "oi" });

    assert.equal(response.status, 404);
    assert.equal(response.body.code, "OVERVIEW_CUSTOMER_NOT_FOUND");
    assert.equal(prisma.rows.length, 0);
  });
});
