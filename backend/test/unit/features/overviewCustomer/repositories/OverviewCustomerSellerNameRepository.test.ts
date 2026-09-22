import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OverviewCustomerSellerNameRepository } from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerSellerNameRepository";

describe("OverviewCustomerSellerNameRepository", () => {
  it("picks the case-insensitive first non-empty name, then smallest id on tie", async () => {
    const prisma = {
      user: {
        async findMany() {
          return [
            { id: "b", name: "  ", codRep: 10 },
            { id: "c", name: "Bruno", codRep: 10 },
            { id: "a", name: "ana", codRep: 10 },
            { id: "d", name: "Ana", codRep: 10 },
            { id: "e", name: "Carla", codRep: 20 },
          ];
        },
      },
    };

    const repo = new OverviewCustomerSellerNameRepository(prisma);
    const matches = await repo.findNamesByCodReps([10, 20]);

    assert.deepStrictEqual(
      matches.sort((left, right) => left.codRep - right.codRep),
      [
        { codRep: 10, name: "ana" },
        { codRep: 20, name: "Carla" },
      ],
    );
  });

  it("returns empty when there are no codReps", async () => {
    let called = false;
    const prisma = {
      user: {
        async findMany() {
          called = true;
          return [];
        },
      },
    };

    const repo = new OverviewCustomerSellerNameRepository(prisma);
    const matches = await repo.findNamesByCodReps([]);

    assert.deepStrictEqual(matches, []);
    assert.equal(called, false);
  });
});
