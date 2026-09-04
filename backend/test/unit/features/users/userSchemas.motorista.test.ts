import test from "node:test";
import assert from "node:assert";
import {
  registerSchema,
  updateUserSchema,
} from "../../../../src/features/users/schemas/userSchemas";

test("userSchemas aceita role MOTORISTA", async (t) => {
  await t.test("registerSchema aceita MOTORISTA", () => {
    const parsed = registerSchema.safeParse({
      body: {
        user: "motorista1",
        password: "senha12",
        role: "MOTORISTA",
        name: "João Motorista",
      },
    });

    assert.strictEqual(parsed.success, true);
  });

  await t.test("updateUserSchema aceita MOTORISTA", () => {
    const parsed = updateUserSchema.safeParse({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      body: { role: "MOTORISTA" },
    });

    assert.strictEqual(parsed.success, true);
  });

  await t.test("registerSchema rejeita role inválida", () => {
    const parsed = registerSchema.safeParse({
      body: {
        user: "motorista1",
        password: "senha12",
        role: "PILOTO",
      },
    });

    assert.strictEqual(parsed.success, false);
  });
});
