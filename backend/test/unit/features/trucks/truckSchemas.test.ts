import test from "node:test";
import assert from "node:assert/strict";
import {
  createTruckBodySchema,
  updateTruckBodySchema,
} from "../../../../src/features/trucks/http/schemas/truckSchemas";

test("Truck schemas", async (t) => {
  await t.test("createTruckBodySchema accepts valid payload", () => {
    const parsed = createTruckBodySchema.safeParse({
      name: "Volvo FH",
      capacity: 25000,
      plate: "ABC1D23",
      type: "Cavalo",
      axles: 6,
      active: true,
    });

    assert.equal(parsed.success, true);
  });

  await t.test("createTruckBodySchema rejects missing plate", () => {
    const parsed = createTruckBodySchema.safeParse({
      name: "Volvo FH",
      capacity: 25000,
    });

    assert.equal(parsed.success, false);
  });

  await t.test("createTruckBodySchema rejects non-positive capacity", () => {
    const parsed = createTruckBodySchema.safeParse({
      name: "Volvo FH",
      capacity: 0,
      plate: "ABC1D23",
    });

    assert.equal(parsed.success, false);
  });

  await t.test("updateTruckBodySchema allows partial updates", () => {
    const parsed = updateTruckBodySchema.safeParse({
      active: false,
    });

    assert.equal(parsed.success, true);
  });
});
