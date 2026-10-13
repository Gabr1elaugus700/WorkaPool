import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { entradaProntaParaConcluir } from "./ibcEntradaPatio.utils";

describe("entradaProntaParaConcluir", () => {
  it("exige ao menos um checklist e todos inspecionados", () => {
    assert.equal(entradaProntaParaConcluir({ checklists: [] }), false);
    assert.equal(
      entradaProntaParaConcluir({
        checklists: [{ checklistModeloId: "a", nome: "Soda", inspecionada: false }],
      }),
      false,
    );
    assert.equal(
      entradaProntaParaConcluir({
        checklists: [
          { checklistModeloId: "a", nome: "Soda", inspecionada: true },
          { checklistModeloId: "b", nome: "Estrutural", inspecionada: true },
        ],
      }),
      true,
    );
  });
});
