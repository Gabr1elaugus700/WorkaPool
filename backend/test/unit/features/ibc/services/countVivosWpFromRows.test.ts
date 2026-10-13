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

  it("exclui baixa de venda ou troca sem confundir com soft delete", () => {
    const count = countVivosWpFromRows([
      { baixadoEm: null, custodia: "CLIENTE", motivoBaixa: null },
      { baixadoEm: null, custodia: "CLIENTE", motivoBaixa: "VENDA" },
      { baixadoEm: null, custodia: "CLIENTE", motivoBaixa: "TROCA" },
    ]);
    assert.equal(count, 1);
  });

  it("excludes a replaced IBC even when it was not given baixa", () => {
    const count = countVivosWpFromRows([
      { baixadoEm: null, custodia: "PATIO" },
      { baixadoEm: null, custodia: "PATIO", convertedToContainerId: null },
      {
        baixadoEm: null,
        custodia: "PATIO",
        convertedToContainerId: "ibc-destino",
      },
    ]);

    assert.equal(count, 2);
  });
});
