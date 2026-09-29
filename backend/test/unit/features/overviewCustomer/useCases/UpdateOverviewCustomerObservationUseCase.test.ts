import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import { AppError } from "../../../../../src/utils/AppError";
import type { OverviewCustomerObservationAuthorLookup } from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationAuthorRepository";
import {
  OverviewCustomerObservationRecord,
  OverviewCustomerObservationRepository,
} from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationRepository";
import { UpdateOverviewCustomerObservationUseCase } from "../../../../../src/features/overviewCustomer/useCases/UpdateOverviewCustomerObservationUseCase";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

type StoredObservation = OverviewCustomerObservationRecord;

const CREATED_AT = new Date("2026-09-10T08:00:00.000Z");
const NOW = new Date("2026-09-29T15:30:00.000Z");

function createInMemoryObservationPrisma(seed: StoredObservation[]) {
  const rows: StoredObservation[] = seed.map((row) => ({ ...row }));
  let updateCount = 0;

  return {
    get updateCount() {
      return updateCount;
    },
    get rows() {
      return rows.map((row) => ({ ...row }));
    },
    overviewCustomerObservation: {
      async findMany(): Promise<StoredObservation[]> {
        return rows.map((row) => ({ ...row }));
      },

      async create(): Promise<StoredObservation> {
        throw new Error("create not used in update use case tests");
      },

      async findFirst(args: {
        where: { id: string; customerCode: number };
      }): Promise<StoredObservation | null> {
        const found = rows.find(
          (row) =>
            row.id === args.where.id &&
            row.customerCode === args.where.customerCode,
        );
        return found ? { ...found } : null;
      },

      async update(args: {
        where: { id: string };
        data: { body: string; editedAt: Date; updatedAt: Date };
      }): Promise<StoredObservation> {
        updateCount += 1;
        const index = rows.findIndex((row) => row.id === args.where.id);
        if (index < 0) {
          throw new Error(`Observation not found: ${args.where.id}`);
        }
        const updated: StoredObservation = { ...rows[index]!, ...args.data };
        rows[index] = updated;
        return { ...updated };
      },
    },
  };
}

function storedObservation(
  partial: Partial<StoredObservation> & { id: string },
): StoredObservation {
  return {
    customerCode: 123,
    authorUserId: "user-vendas",
    body: "texto original",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    editedAt: null,
    ...partial,
  };
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

class FakeAuthors implements OverviewCustomerObservationAuthorLookup {
  async findDisplayNamesByIds(
    ids: string[],
  ): Promise<Array<{ id: string; displayName: string }>> {
    const names: Record<string, string> = {
      "user-vendas": "Vendedor A",
      "user-admin": "Admin User",
    };
    return ids.flatMap((id) => {
      const displayName = names[id];
      return displayName ? [{ id, displayName }] : [];
    });
  }
}

function createHarness(
  seed: StoredObservation[] = [storedObservation({ id: "obs-1" })],
) {
  const store = new InMemoryOverviewCustomerSyncStore();
  seedStore(store);
  const prisma = createInMemoryObservationPrisma(seed);
  const repo = new OverviewCustomerObservationRepository(prisma);
  const useCase = new UpdateOverviewCustomerObservationUseCase(
    store,
    repo,
    new FakeAuthors(),
    () => NOW,
  );
  return { useCase, prisma };
}

async function expectAppError(
  promise: Promise<unknown>,
  expected: { statusCode: number; code: string },
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, expected.statusCode);
    assert.equal(error.code, expected.code);
    return true;
  });
}

describe("UpdateOverviewCustomerObservationUseCase", () => {
  it("lets the author edit, setting editedAt and updatedAt to now and keeping createdAt/author (OBSCHAT-05 AC1)", async () => {
    const { useCase, prisma } = createHarness();

    const result = await useCase.execute({
      customerCode: 123,
      role: Role.VENDAS,
      codRep: 10,
      observationId: "obs-1",
      requesterUserId: "user-vendas",
      body: "  texto corrigido  ",
    });

    assert.equal(result.body, "texto corrigido");
    assert.equal(result.editedAt, NOW.toISOString());
    assert.equal(result.updatedAt, NOW.toISOString());
    assert.equal(result.createdAt, CREATED_AT.toISOString());
    assert.equal(result.authorUserId, "user-vendas");
    assert.equal(result.authorDisplayName, "Vendedor A");
    assert.equal(prisma.rows[0]?.body, "texto corrigido");
  });

  for (const role of [Role.ADMIN, Role.GERENTE_DPTO]) {
    it(`rejects ${role} who is not the author without changing the row (OBSCHAT-05 AC3)`, async () => {
      const { useCase, prisma } = createHarness();

      await expectAppError(
        useCase.execute({
          customerCode: 123,
          role,
          observationId: "obs-1",
          requesterUserId: "user-admin",
          body: "reescrito por outro",
        }),
        { statusCode: 403, code: "OBSERVATION_EDIT_FORBIDDEN" },
      );

      assert.equal(prisma.updateCount, 0);
      assert.equal(prisma.rows[0]?.body, "texto original");
    });
  }

  it("rejects a non-author with 403 even when the body is invalid", async () => {
    const { useCase, prisma } = createHarness();

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.ADMIN,
        observationId: "obs-1",
        requesterUserId: "user-admin",
        body: "   ",
      }),
      { statusCode: 403, code: "OBSERVATION_EDIT_FORBIDDEN" },
    );

    assert.equal(prisma.updateCount, 0);
  });

  it("returns 404 when the observation belongs to another customer (OBSCHAT-05 AC4)", async () => {
    const { useCase, prisma } = createHarness([
      storedObservation({ id: "obs-1", customerCode: 456 }),
    ]);

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.VENDAS,
        codRep: 10,
        observationId: "obs-1",
        requesterUserId: "user-vendas",
        body: "texto",
      }),
      { statusCode: 404, code: "OBSERVATION_NOT_FOUND" },
    );

    assert.equal(prisma.updateCount, 0);
  });

  it("returns 404 when the observation id does not exist (OBSCHAT-05 AC4)", async () => {
    const { useCase } = createHarness();

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.VENDAS,
        codRep: 10,
        observationId: "missing",
        requesterUserId: "user-vendas",
        body: "texto",
      }),
      { statusCode: 404, code: "OBSERVATION_NOT_FOUND" },
    );
  });

  for (const [label, body] of [
    ["empty body after trim", "   "],
    ["body longer than 2000 after trim", ` ${"x".repeat(2001)} `],
  ] as const) {
    it(`rejects ${label} without changing the row (OBSCHAT-05 AC5)`, async () => {
      const { useCase, prisma } = createHarness();

      await expectAppError(
        useCase.execute({
          customerCode: 123,
          role: Role.VENDAS,
          codRep: 10,
          observationId: "obs-1",
          requesterUserId: "user-vendas",
          body,
        }),
        { statusCode: 400, code: "OBSERVATION_INVALID_BODY" },
      );

      assert.equal(prisma.updateCount, 0);
    });
  }

  it("rejects VENDAS outside the customer portfolio even as author", async () => {
    const { useCase, prisma } = createHarness();

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.VENDAS,
        codRep: 99,
        observationId: "obs-1",
        requesterUserId: "user-vendas",
        body: "texto",
      }),
      { statusCode: 403, code: "OVERVIEW_CUSTOMER_FORBIDDEN" },
    );

    assert.equal(prisma.updateCount, 0);
  });
});
