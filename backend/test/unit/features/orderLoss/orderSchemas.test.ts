import test from "node:test";
import assert from "node:assert";
import { GetLostOrdersFiltersSchema } from "../../../../src/features/orderLoss/http/schemas/orderSchemas";

test("GetLostOrdersFiltersSchema valida formato e intervalo de datas", async (t) => {
  await t.test("aceita filtros válidos", () => {
    const parsed = GetLostOrdersFiltersSchema.safeParse({
      codRep: "101",
      startDate: "01-01-2026",
      endDate: "31-01-2026",
    });

    assert.strictEqual(parsed.success, true);
  });

  await t.test("rejeita intervalo invertido", () => {
    const parsed = GetLostOrdersFiltersSchema.safeParse({
      startDate: "31-01-2026",
      endDate: "01-01-2026",
    });

    assert.strictEqual(parsed.success, false);
  });
});

