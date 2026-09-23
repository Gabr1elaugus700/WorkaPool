import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OverviewCustomerObservationAuthorRepository } from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerObservationAuthorRepository";

describe("OverviewCustomerObservationAuthorRepository", () => {
  it("returns displayName from trimmed name when present", async () => {
    const prisma = {
      user: {
        async findMany() {
          return [
            { id: "u1", name: "  Ana  ", user: "ana.login" },
            { id: "u2", name: "", user: "bob.login" },
            { id: "u3", name: "   ", user: "cara.login" },
          ];
        },
      },
    };
    const repo = new OverviewCustomerObservationAuthorRepository(prisma);

    const matches = await repo.findDisplayNamesByIds(["u1", "u2", "u3"]);

    assert.deepStrictEqual(matches, [
      { id: "u1", displayName: "Ana" },
      { id: "u2", displayName: "bob.login" },
      { id: "u3", displayName: "cara.login" },
    ]);
  });

  it("returns empty when ids list is empty", async () => {
    let called = false;
    const prisma = {
      user: {
        async findMany() {
          called = true;
          return [];
        },
      },
    };
    const repo = new OverviewCustomerObservationAuthorRepository(prisma);

    const matches = await repo.findDisplayNamesByIds([]);

    assert.deepStrictEqual(matches, []);
    assert.equal(called, false);
  });
});
