import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import { AppError } from "../../../../../src/utils/AppError";
import type { OverviewCustomerObservationAuthorLookup } from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationAuthorRepository";
import {
  OverviewCustomerObservationRecord,
  OverviewCustomerObservationRepository,
} from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationRepository";
import { CreateOverviewCustomerObservationUseCase } from "../../../../../src/features/overviewCustomer/useCases/CreateOverviewCustomerObservationUseCase";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

type StoredObservation = OverviewCustomerObservationRecord;

function createInMemoryObservationPrisma(seed: StoredObservation[] = []) {
  const rows: StoredObservation[] = seed.map((row) => ({ ...row }));
  let createCount = 0;

  return {
    get createCount() {
      return createCount;
    },
    get rows() {
      return rows.map((row) => ({ ...row }));
    },
    overviewCustomerObservation: {
      async findMany(): Promise<StoredObservation[]> {
        return rows.map((row) => ({ ...row }));
      },

      async create(args: {
        data: {
          customerCode: number;
          authorUserId: string;
          body: string;
          editedAt: null;
        };
      }): Promise<StoredObservation> {
        createCount += 1;
        const now = new Date("2026-09-22T12:00:00.000Z");
        const created: StoredObservation = {
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

      async findFirst(): Promise<StoredObservation | null> {
        return null;
      },

      async update(): Promise<StoredObservation> {
        throw new Error("update not used in create use case tests");
      },
    },
  };
}

function identityCustomer(primaryCodRep: number | null = 10) {
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

function seedStore(
  store: InMemoryOverviewCustomerSyncStore,
  primaryCodRep: number | null = 10,
): void {
  store.seedSuccessfulSnapshot(
    {
      id: "snap-1",
      publishedAt: new Date("2026-01-10T00:00:00.000Z"),
      payload: {
        customers: { "123": identityCustomer(primaryCodRep) },
      },
    },
    new Date("2026-01-10T00:00:00.000Z"),
  );
}

class FakeAuthors implements OverviewCustomerObservationAuthorLookup {
  constructor(
    private readonly names: Record<string, string> = {
      "user-admin": "Admin User",
      "user-vendas": "Vendedor A",
      "user-gerente": "Gerente B",
    },
  ) {}

  async findDisplayNamesByIds(
    ids: string[],
  ): Promise<Array<{ id: string; displayName: string }>> {
    return ids.flatMap((id) => {
      const displayName = this.names[id];
      return displayName ? [{ id, displayName }] : [];
    });
  }
}

function createHarness(options?: {
  primaryCodRep?: number | null;
  store?: InMemoryOverviewCustomerSyncStore;
  authors?: OverviewCustomerObservationAuthorLookup;
}) {
  const store = options?.store ?? new InMemoryOverviewCustomerSyncStore();
  if (!options?.store) {
    seedStore(store, options?.primaryCodRep ?? 10);
  }
  const prisma = createInMemoryObservationPrisma();
  const repo = new OverviewCustomerObservationRepository(prisma);
  const authors = options?.authors ?? new FakeAuthors();
  const useCase = new CreateOverviewCustomerObservationUseCase(
    store,
    repo,
    authors,
  );
  return { useCase, prisma };
}

async function expectAppError(
  promise: Promise<unknown>,
  expected: { statusCode: number; code: string; message?: string },
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, expected.statusCode);
    assert.equal(error.code, expected.code);
    if (expected.message !== undefined) {
      assert.equal(error.message, expected.message);
    }
    return true;
  });
}

describe("CreateOverviewCustomerObservationUseCase", () => {
  it("persists trimmed body with authorUserId and editedAt null for ADMIN (OBSCHAT-03 AC1)", async () => {
    const { useCase, prisma } = createHarness();

    const result = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
      authorUserId: "user-admin",
      body: "  observação importante  ",
    });

    assert.equal(result.body, "observação importante");
    assert.equal(result.authorUserId, "user-admin");
    assert.equal(result.authorDisplayName, "Admin User");
    assert.equal(result.customerCode, 123);
    assert.equal(result.editedAt, null);
    assert.equal(result.createdAt, "2026-09-22T12:00:00.000Z");
    assert.equal(result.updatedAt, "2026-09-22T12:00:00.000Z");
    assert.equal(prisma.createCount, 1);
    assert.equal(prisma.rows[0]?.editedAt, null);
    assert.equal(prisma.rows[0]?.body, "observação importante");
  });

  it("persists for VENDAS owner and GERENTE_DPTO (OBSCHAT-03 AC1)", async () => {
    const vendas = createHarness();
    const gerente = createHarness();

    const vendasResult = await vendas.useCase.execute({
      customerCode: 123,
      role: Role.VENDAS,
      codRep: 10,
      authorUserId: "user-vendas",
      body: "nota do vendedor",
    });

    const gerenteResult = await gerente.useCase.execute({
      customerCode: 123,
      role: Role.GERENTE_DPTO,
      authorUserId: "user-gerente",
      body: "nota do gerente",
    });

    assert.equal(vendasResult.authorUserId, "user-vendas");
    assert.equal(vendasResult.body, "nota do vendedor");
    assert.equal(gerenteResult.authorUserId, "user-gerente");
    assert.equal(gerenteResult.body, "nota do gerente");
  });

  it("rejects empty trimmed body without persisting (OBSCHAT-03 AC4)", async () => {
    const { useCase, prisma } = createHarness();

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.ADMIN,
        authorUserId: "user-admin",
        body: "   ",
      }),
      {
        statusCode: 400,
        code: "OBSERVATION_INVALID_BODY",
        message: "Corpo da observação inválido",
      },
    );

    assert.equal(prisma.createCount, 0);
  });

  it("rejects body longer than 2000 after trim without persisting (OBSCHAT-03 AC5)", async () => {
    const { useCase, prisma } = createHarness();
    const body = `  ${"x".repeat(2001)}  `;

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.ADMIN,
        authorUserId: "user-admin",
        body,
      }),
      { statusCode: 400, code: "OBSERVATION_INVALID_BODY" },
    );

    assert.equal(prisma.createCount, 0);
  });

  it("accepts body of exactly 2000 characters after trim", async () => {
    const { useCase } = createHarness();
    const body = "y".repeat(2000);

    const result = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
      authorUserId: "user-admin",
      body,
    });

    assert.equal(result.body.length, 2000);
  });

  it("rejects VENDAS with wrong codRep without persisting (OBSCHAT-03 AC6)", async () => {
    const { useCase, prisma } = createHarness();

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.VENDAS,
        codRep: 99,
        authorUserId: "user-vendas",
        body: "tentativa",
      }),
      { statusCode: 403, code: "OVERVIEW_CUSTOMER_FORBIDDEN" },
    );

    assert.equal(prisma.createCount, 0);
  });

  it("rejects roles outside overview access", async () => {
    const { useCase, prisma } = createHarness();

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.LOGISTICA,
        authorUserId: "user-admin",
        body: "tentativa",
      }),
      { statusCode: 403, code: "OVERVIEW_CUSTOMER_FORBIDDEN" },
    );

    assert.equal(prisma.createCount, 0);
  });

  it("rejects unknown customer", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const { useCase, prisma } = createHarness({ store });

    await expectAppError(
      useCase.execute({
        customerCode: 999,
        role: Role.ADMIN,
        authorUserId: "user-admin",
        body: "tentativa",
      }),
      { statusCode: 404, code: "OVERVIEW_CUSTOMER_NOT_FOUND" },
    );

    assert.equal(prisma.createCount, 0);
  });
});
