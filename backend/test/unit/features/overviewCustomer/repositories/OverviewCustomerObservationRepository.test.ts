import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OverviewCustomerObservationRecord,
  OverviewCustomerObservationRepository,
} from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationRepository";

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

      async create(args: {
        data: {
          customerCode: number;
          authorUserId: string;
          body: string;
          editedAt: null;
        };
      }): Promise<StoredObservation> {
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

      async findFirst(args: {
        where: {
          id: string;
          customerCode: number;
          authorUserId: string;
        };
      }): Promise<StoredObservation | null> {
        const found = rows.find(
          (row) =>
            row.id === args.where.id &&
            row.customerCode === args.where.customerCode &&
            row.authorUserId === args.where.authorUserId,
        );
        return found ? { ...found } : null;
      },

      async update(args: {
        where: { id: string };
        data: { body: string; editedAt: Date };
      }): Promise<StoredObservation> {
        const index = rows.findIndex((row) => row.id === args.where.id);
        if (index < 0) {
          throw new Error(`Observation not found: ${args.where.id}`);
        }
        const updated: StoredObservation = {
          ...rows[index],
          body: args.data.body,
          editedAt: args.data.editedAt,
          updatedAt: args.data.editedAt,
        };
        rows[index] = updated;
        return { ...updated };
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
    customerCode: partial.customerCode ?? 1001,
    authorUserId: partial.authorUserId ?? "author-1",
    body: partial.body ?? `body-${partial.id}`,
    createdAt,
    updatedAt: createdAt,
    editedAt: partial.editedAt === undefined ? null : partial.editedAt === null ? null : new Date(partial.editedAt),
  };
}

describe("OverviewCustomerObservationRepository", () => {
  describe("findRecentPage", () => {
    it("returns empty when the customer has no observations", async () => {
      const prisma = createInMemoryObservationPrisma([
        observation({ id: "a", customerCode: 999, createdAt: "2026-09-01T00:00:00.000Z" }),
      ]);
      const repo = new OverviewCustomerObservationRepository(prisma);

      const page = await repo.findRecentPage(1001);

      assert.deepStrictEqual(page, []);
    });

    it("returns at most 50 newest observations ascending for a page of 51", async () => {
      const seed = Array.from({ length: 51 }, (_, index) => {
        const n = index + 1;
        return observation({
          id: `id-${String(n).padStart(2, "0")}`,
          createdAt: new Date(Date.UTC(2026, 8, 1, 0, n)).toISOString(),
        });
      });
      const prisma = createInMemoryObservationPrisma(seed);
      const repo = new OverviewCustomerObservationRepository(prisma);

      const page = await repo.findRecentPage(1001);

      assert.equal(page.length, 50);
      assert.equal(page[0]?.id, "id-02");
      assert.equal(page[49]?.id, "id-51");
      for (let i = 1; i < page.length; i += 1) {
        const prev = page[i - 1]!;
        const curr = page[i]!;
        const ordered =
          prev.createdAt.getTime() < curr.createdAt.getTime() ||
          (prev.createdAt.getTime() === curr.createdAt.getTime() &&
            prev.id < curr.id);
        assert.equal(ordered, true);
      }
    });

    it("orders by id ascending when createdAt ties", async () => {
      const sameInstant = "2026-09-15T10:00:00.000Z";
      const prisma = createInMemoryObservationPrisma([
        observation({ id: "c", createdAt: sameInstant }),
        observation({ id: "a", createdAt: sameInstant }),
        observation({ id: "b", createdAt: sameInstant }),
      ]);
      const repo = new OverviewCustomerObservationRepository(prisma);

      const page = await repo.findRecentPage(1001);

      assert.deepStrictEqual(
        page.map((row) => row.id),
        ["a", "b", "c"],
      );
    });

    it("returns the older page when before cursor is the oldest loaded item", async () => {
      const seed = Array.from({ length: 60 }, (_, index) => {
        const n = index + 1;
        return observation({
          id: `id-${String(n).padStart(2, "0")}`,
          createdAt: new Date(Date.UTC(2026, 8, 1, 0, n)).toISOString(),
        });
      });
      const prisma = createInMemoryObservationPrisma(seed);
      const repo = new OverviewCustomerObservationRepository(prisma);

      const newestPage = await repo.findRecentPage(1001, 50);
      const oldestLoaded = newestPage[0]!;
      const olderPage = await repo.findRecentPage(1001, 50, {
        createdAt: oldestLoaded.createdAt,
        id: oldestLoaded.id,
      });

      assert.equal(olderPage.length, 10);
      assert.equal(olderPage[0]?.id, "id-01");
      assert.equal(olderPage[9]?.id, "id-10");
      assert.equal(
        olderPage[9]!.createdAt.getTime() < oldestLoaded.createdAt.getTime() ||
          (olderPage[9]!.createdAt.getTime() ===
            oldestLoaded.createdAt.getTime() &&
            olderPage[9]!.id < oldestLoaded.id),
        true,
      );
    });
  });

  describe("create", () => {
    it("persists an observation with editedAt null", async () => {
      const prisma = createInMemoryObservationPrisma();
      const repo = new OverviewCustomerObservationRepository(prisma);

      const created = await repo.create({
        customerCode: 1001,
        authorUserId: "user-42",
        body: "Primeira observação",
      });

      assert.equal(created.editedAt, null);
      assert.equal(created.customerCode, 1001);
      assert.equal(created.authorUserId, "user-42");
      assert.equal(created.body, "Primeira observação");
    });
  });

  describe("updateByAuthor", () => {
    it("updates body and sets editedAt for the author", async () => {
      const prisma = createInMemoryObservationPrisma([
        observation({
          id: "obs-1",
          authorUserId: "user-42",
          body: "texto antigo",
          createdAt: "2026-09-10T00:00:00.000Z",
        }),
      ]);
      const repo = new OverviewCustomerObservationRepository(prisma);
      const editedAt = new Date("2026-09-22T15:00:00.000Z");

      const updated = await repo.updateByAuthor({
        id: "obs-1",
        customerCode: 1001,
        authorUserId: "user-42",
        body: "texto novo",
        editedAt,
      });

      assert.ok(updated);
      assert.equal(updated.body, "texto novo");
      assert.deepStrictEqual(updated.editedAt, editedAt);
      assert.equal(updated.createdAt.toISOString(), "2026-09-10T00:00:00.000Z");
      assert.equal(updated.authorUserId, "user-42");
    });

    it("returns null when author does not match", async () => {
      const prisma = createInMemoryObservationPrisma([
        observation({
          id: "obs-1",
          authorUserId: "user-42",
          createdAt: "2026-09-10T00:00:00.000Z",
        }),
      ]);
      const repo = new OverviewCustomerObservationRepository(prisma);

      const updated = await repo.updateByAuthor({
        id: "obs-1",
        customerCode: 1001,
        authorUserId: "other-user",
        body: "hack",
        editedAt: new Date("2026-09-22T15:00:00.000Z"),
      });

      assert.equal(updated, null);
    });

    it("returns null when observation id is missing", async () => {
      const prisma = createInMemoryObservationPrisma();
      const repo = new OverviewCustomerObservationRepository(prisma);

      const updated = await repo.updateByAuthor({
        id: "missing",
        customerCode: 1001,
        authorUserId: "user-42",
        body: "novo",
        editedAt: new Date("2026-09-22T15:00:00.000Z"),
      });

      assert.equal(updated, null);
    });
  });
});
