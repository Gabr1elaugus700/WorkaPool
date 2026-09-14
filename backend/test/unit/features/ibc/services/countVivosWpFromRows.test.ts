import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countVivosWpFromRows } from "../../../../../src/features/ibc/services/countVivosWpFromRows";

describe("countVivosWpFromRows (#117 vivos definition)", () => {
  it("includes patio, EM_VIAGEM and excludes baixados / sold-baixas", () => {
    const count = countVivosWpFromRows([
      { baixadoEm: null, custodia: "PATIO" },
      { baixadoEm: null, custodia: "EM_VIAGEM" },
      { baixadoEm: null, custodia: "CLIENTE" },
      { baixadoEm: new Date("2026-01-01"), custodia: "PATIO" },
      { baixadoEm: new Date("2026-02-01"), custodia: "EM_VIAGEM" },
    ]);

    assert.equal(count, 3);
  });
});
