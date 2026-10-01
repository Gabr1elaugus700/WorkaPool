import test from "node:test";
import assert from "node:assert";
import { canConfirmCustodia } from "../../../../../src/features/ibc/permissions/canConfirmCustodia";

test("canConfirmCustodia reconhece MOTORISTA", async (t) => {
  await t.test("permite MOTORISTA confirmar custódia", () => {
    assert.strictEqual(canConfirmCustodia("MOTORISTA"), true);
  });

  await t.test("rejeita ALMOX", () => {
    assert.strictEqual(canConfirmCustodia("ALMOX"), false);
  });

  await t.test("rejeita LOGISTICA", () => {
    assert.strictEqual(canConfirmCustodia("LOGISTICA"), false);
  });

  await t.test("rejeita USER", () => {
    assert.strictEqual(canConfirmCustodia("USER"), false);
  });
});
