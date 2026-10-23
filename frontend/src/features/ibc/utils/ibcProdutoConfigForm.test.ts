import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ibcProdutoConfigForm } from "./ibcProdutoConfigForm";

describe("ibcProdutoConfigForm", () => {
  it("aceita sigla de 1 ou 2 letras e descarta o resto", () => {
    assert.equal(ibcProdutoConfigForm.siglaDe(" so3 "), "SO");
    assert.equal(ibcProdutoConfigForm.siglaDe("1"), "");
    assert.equal(ibcProdutoConfigForm.podeGravar(false, true, "S", "#AA0000"), true);
    assert.equal(ibcProdutoConfigForm.podeGravar(false, true, "SOD", "#AA0000"), false);
  });

  it("normaliza a cor para #RRGGBB e recusa cor incompleta", () => {
    assert.equal(ibcProdutoConfigForm.corDe("aa00ff"), "#AA00FF");
    assert.equal(ibcProdutoConfigForm.corDe("#12"), "#12");
    assert.equal(ibcProdutoConfigForm.podeGravar(false, false, "", "#12"), false);
    assert.equal(ibcProdutoConfigForm.podeGravar(false, false, "", "#AABBCC"), true);
  });

  it("não libera gravar quando a configuração está em uso", () => {
    assert.equal(ibcProdutoConfigForm.podeGravar(true, true, "S", "#AA0000"), false);
    assert.equal(ibcProdutoConfigForm.podeGravar(true, false, "", "#AA0000"), false);
  });
});
