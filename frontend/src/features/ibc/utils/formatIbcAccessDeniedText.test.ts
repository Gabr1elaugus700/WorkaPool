import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatIbcAccessDeniedText } from "./formatIbcAccessDeniedText";

describe("formatIbcAccessDeniedText", () => {
  it("usa o verbo no singular para uma role", () => {
    assert.equal(
      formatIbcAccessDeniedText(["ADMIN"], "o Sync do Overview"),
      "Apenas ADMIN pode acessar o Sync do Overview.",
    );
  });

  it("liga duas roles com e e o verbo no plural", () => {
    assert.equal(
      formatIbcAccessDeniedText(["ALMOX", "ADMIN"], "a Expedição IBC"),
      "Apenas ALMOX e ADMIN podem acessar a Expedição IBC.",
    );
  });

  it("separa três ou mais roles com vírgula e e antes da última", () => {
    assert.equal(
      formatIbcAccessDeniedText(
        ["ADMIN", "ALMOX", "LOGISTICA", "GERENTE_DPTO"],
        "o Cadastro IBC",
      ),
      "Apenas ADMIN, ALMOX, LOGISTICA e GERENTE_DPTO podem acessar o Cadastro IBC.",
    );
  });
});
