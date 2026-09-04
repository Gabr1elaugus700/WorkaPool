import test from "node:test";
import assert from "node:assert/strict";
import { CloseCargaSchema } from "../../../../../src/features/cargo/http/schemas/cargoSchema";

const VALID_TRUCK_ID = "550e8400-e29b-41d4-a716-446655440000";

test("CloseCargaSchema", async (t) => {
  await t.test("accepts cargo code and truck id without motoristaId", () => {
    const parsed = CloseCargaSchema.safeParse({
      codCar: 1234,
      caminhaoId: VALID_TRUCK_ID,
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.codCar, 1234);
      assert.equal(parsed.data.caminhaoId, VALID_TRUCK_ID);
      assert.equal("motoristaId" in parsed.data, false);
    }
  });

  await t.test("rejects missing truck id", () => {
    const parsed = CloseCargaSchema.safeParse({
      codCar: 1234,
    });

    assert.equal(parsed.success, false);
  });
});
