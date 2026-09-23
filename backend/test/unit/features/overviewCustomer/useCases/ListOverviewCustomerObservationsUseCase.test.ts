import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import { AppError } from "../../../../../src/utils/AppError";
import type { OverviewCustomerObservationAuthorLookup } from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationAuthorRepository";
import {
  OverviewCustomerObservationRecord,
  OverviewCustomerObservationRepository,
} from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationRepository";
import { ListOverviewCustomerObservationsUseCase } from "../../../../../src/features/overviewCustomer/useCases/ListOverviewCustomerObservationsUseCase";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

type StoredObservation = OverviewCustomerObservationRecord;

function createInMemoryObservationPrisma(seed: StoredObservation[] = []) {
  const rows: StoredObservation[] = seed.map((row) => ({ ...row }));

  return {
    overviewCustomerObservation: {
      async findMany(args: {
        where: {
          customerCode: number;
          OR?: Array<
            | { createdAt: { lt: Date } }
            | { AND: Array<{ createdAt: Date } | { id: { lt: string } }> }
          >;
        };
        orderBy: Array<
          { createdAt: "desc" | "asc" } | { id: "desc" | "asc" }
        >;
        take: number;
      }): Promise<StoredObservation[]> {
        let filtered = rows.filter(
          (row) => row.customerCode === args.where.customerCode,
        );

        if (args.where.OR) {
          filtered = filtered.filter((row) =>
            args.where.OR!.some((clause) => {
              if ("createdAt" in clause && "lt" in clause.createdAt) {
                return row.createdAt.getTime() < clause.createdAt.lt.getTime();
              }
              if ("AND" in clause) {
                const createdAtEq = clause.AND.find(
                  (part): part is { createdAt: Date } => "createdAt" in part,
                );
                const idLt = clause.AND.find(
                  (part): part is { id: { lt: string } } => "id" in part,
                );
                if (!createdAtEq || !idLt) {
                  return false;
                }
                return (
                  row.createdAt.getTime() === createdAtEq.createdAt.getTime() &&
                  row.id < idLt.id.lt
                );
              }
              return false;
            }),
          );
        }

        const sorted = [...filtered].sort((left, right) => {
          for (const order of args.orderBy) {
            if ("createdAt" in order) {
              const delta =
                left.createdAt.getTime() - right.createdAt.getTime();
              if (delta !== 0) {
                return order.createdAt === "desc" ? -delta : delta;
              }
            }
            if ("id" in order) {
              const delta = left.id.localeCompare(right.id);
              if (delta !== 0) {
                return order.id === "desc" ? -delta : delta;
              }
            }
          }
          return 0;
        });

        return sorted.slice(0, args.take).map((row) => ({ ...row }));
      },

      async create(): Promise<StoredObservation> {
        throw new Error("create not used in list use case tests");
      },

      async findFirst(): Promise<StoredObservation | null> {
        return null;
      },

      async update(): Promise<StoredObservation> {
        throw new Error("update not used in list use case tests");
      },
    },
  };
}

function observation(partial: {
  id: string;
  customerCode?: number;
  authorUserId?: string;
  body?: string;
  createdAt: string;
  editedAt?: string | null;
}): StoredObservation {
  const createdAt = new Date(partial.createdAt);
  return {
    id: partial.id,
    customerCode: partial.customerCode ?? 123,
    authorUserId: partial.authorUserId ?? "author-1",
    body: partial.body ?? `body-${partial.id}`,
    createdAt,
    updatedAt: createdAt,
    editedAt:
      partial.editedAt === undefined
        ? null
        : partial.editedAt === null
          ? null
          : new Date(partial.editedAt),
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
      "author-1": "Ana Silva",
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

function createUseCase(options?: {
  seed?: StoredObservation[];
  authors?: OverviewCustomerObservationAuthorLookup;
  primaryCodRep?: number | null;
  store?: InMemoryOverviewCustomerSyncStore;
}) {
  const store = options?.store ?? new InMemoryOverviewCustomerSyncStore();
  if (!options?.store) {
    seedStore(store, options?.primaryCodRep ?? 10);
  }
  const repo = new OverviewCustomerObservationRepository(
    createInMemoryObservationPrisma(options?.seed ?? []),
  );
  const authors = options?.authors ?? new FakeAuthors();
  return new ListOverviewCustomerObservationsUseCase(store, repo, authors);
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

describe("ListOverviewCustomerObservationsUseCase", () => {
  it("returns empty list when customer has no observations (OBSCHAT-02 AC2)", async () => {
    const useCase = createUseCase({ seed: [] });

    const result = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
    });

    assert.deepStrictEqual(result, {
      items: [],
      hasOlder: false,
      nextBefore: null,
    });
  });

  it("returns a single observation without hasOlder", async () => {
    const useCase = createUseCase({
      seed: [
        observation({
          id: "only",
          body: "unica",
          createdAt: "2026-09-01T10:00:00.000Z",
        }),
      ],
    });

    const result = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
    });

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.id, "only");
    assert.equal(result.items[0]?.body, "unica");
    assert.equal(result.hasOlder, false);
    assert.equal(result.nextBefore, null);
  });

  it("returns at most 50 newest observations ascending with hasOlder (OBSCHAT-02 AC1)", async () => {
    const seed = Array.from({ length: 51 }, (_, index) => {
      const n = index + 1;
      return observation({
        id: `id-${String(n).padStart(2, "0")}`,
        createdAt: new Date(Date.UTC(2026, 8, 1, 0, n)).toISOString(),
      });
    });
    const useCase = createUseCase({ seed });

    const result = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
    });

    assert.equal(result.items.length, 50);
    assert.equal(result.hasOlder, true);
    assert.equal(result.items[0]?.id, "id-02");
    assert.equal(result.items[49]?.id, "id-51");
    assert.deepStrictEqual(result.nextBefore, {
      createdAt: result.items[0]!.createdAt,
      id: "id-02",
    });
    for (let i = 1; i < result.items.length; i += 1) {
      const prev = result.items[i - 1]!;
      const curr = result.items[i]!;
      const ordered =
        prev.createdAt < curr.createdAt ||
        (prev.createdAt === curr.createdAt && prev.id < curr.id);
      assert.equal(ordered, true);
    }
  });

  it("orders by id ascending when createdAt ties", async () => {
    const tie = "2026-09-01T12:00:00.000Z";
    const useCase = createUseCase({
      seed: [
        observation({ id: "b", createdAt: tie }),
        observation({ id: "a", createdAt: tie }),
        observation({ id: "c", createdAt: tie }),
      ],
    });

    const result = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
    });

    assert.deepStrictEqual(
      result.items.map((item) => item.id),
      ["a", "b", "c"],
    );
    assert.equal(result.hasOlder, false);
    assert.equal(result.nextBefore, null);
  });

  it("resolves authorDisplayName from name, falling back to user (OBSCHAT-02 AC3)", async () => {
    const useCase = createUseCase({
      seed: [
        observation({
          id: "m1",
          authorUserId: "u-named",
          body: "com nome",
          createdAt: "2026-09-01T10:00:00.000Z",
        }),
        observation({
          id: "m2",
          authorUserId: "u-login",
          body: "só login",
          createdAt: "2026-09-01T11:00:00.000Z",
        }),
      ],
      authors: new FakeAuthors({
        "u-named": "Maria Souza",
        "u-login": "msouza",
      }),
    });

    const result = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
    });

    assert.equal(result.items[0]?.authorDisplayName, "Maria Souza");
    assert.equal(result.items[1]?.authorDisplayName, "msouza");
    assert.equal(result.items[0]?.body, "com nome");
    assert.equal(result.items[0]?.createdAt, "2026-09-01T10:00:00.000Z");
  });

  it("returns older page when before cursor is provided", async () => {
    const seed = Array.from({ length: 60 }, (_, index) => {
      const n = index + 1;
      return observation({
        id: `id-${String(n).padStart(2, "0")}`,
        createdAt: new Date(Date.UTC(2026, 8, 1, 0, n)).toISOString(),
      });
    });
    const useCase = createUseCase({ seed });

    const first = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
    });

    assert.equal(first.items.length, 50);
    assert.equal(first.hasOlder, true);
    assert.ok(first.nextBefore);

    const older = await useCase.execute({
      customerCode: 123,
      role: Role.ADMIN,
      before: first.nextBefore!,
    });

    assert.equal(older.items.length, 10);
    assert.equal(older.hasOlder, false);
    assert.equal(older.nextBefore, null);
    assert.equal(older.items[0]?.id, "id-01");
    assert.equal(older.items[9]?.id, "id-10");
  });

  it("rejects VENDAS with wrong codRep (OBSCHAT-02 AC4)", async () => {
    const useCase = createUseCase({
      seed: [
        observation({ id: "m1", createdAt: "2026-09-01T10:00:00.000Z" }),
      ],
    });

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.VENDAS,
        codRep: 99,
      }),
      { statusCode: 403, code: "OVERVIEW_CUSTOMER_FORBIDDEN" },
    );
  });

  it("rejects roles outside overview access (OBSCHAT-02 AC5)", async () => {
    const useCase = createUseCase({ seed: [] });

    await expectAppError(
      useCase.execute({
        customerCode: 123,
        role: Role.LOGISTICA,
      }),
      { statusCode: 403, code: "OVERVIEW_CUSTOMER_FORBIDDEN" },
    );
  });

  it("rejects unknown customer (OBSCHAT-02 AC6)", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);
    const useCase = createUseCase({ store, seed: [] });

    await expectAppError(
      useCase.execute({
        customerCode: 999,
        role: Role.ADMIN,
      }),
      { statusCode: 404, code: "OVERVIEW_CUSTOMER_NOT_FOUND" },
    );
  });
});
