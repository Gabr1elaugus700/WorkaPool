import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mensagemPadraoChecklist } from "./ibcChecklistPadraoMensagem";

describe("mensagemPadraoChecklist", () => {
  it("traduz a duplicata 409 para a frase da config", () => {
    const err = new Error("Checklist já é padrão deste produto na Entrada no pátio");
    assert.equal(mensagemPadraoChecklist(err), "Este checklist já é padrão deste produto.");
  });

  it("repassa as outras falhas", () => {
    assert.equal(mensagemPadraoChecklist(new Error("Checklist inativo")), "Checklist inativo");
  });
});
