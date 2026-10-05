import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  IBC_OBSERVACAO_MAX,
  buildIbcMudancaConfirmacao,
  isIbcNaoHomologado,
  isIbcSubstituido,
  previewConversaoPrefixo,
  previewMudancaProdutoPrefixo,
  resolveIbcPrefixo,
} from "./ibcMudanca.utils";

describe("buildIbcMudancaConfirmacao", () => {
  it("blocks the mutation until the user confirms", () => {
    assert.equal(buildIbcMudancaConfirmacao(false, "avaria"), null);
  });

  it("sends the trimmed observation once confirmed", () => {
    assert.deepEqual(buildIbcMudancaConfirmacao(true, "  avaria visual "), {
      confirmado: true,
      observacao: "avaria visual",
    });
  });

  it("sends null observation when blank", () => {
    assert.deepEqual(buildIbcMudancaConfirmacao(true, "   "), {
      confirmado: true,
      observacao: null,
    });
  });

  it("blocks observation above the limit", () => {
    assert.equal(
      buildIbcMudancaConfirmacao(true, "x".repeat(IBC_OBSERVACAO_MAX + 1)),
      null,
    );
  });
});

describe("prefix previews", () => {
  it("resolves the prefix from the field or the identifier", () => {
    assert.equal(resolveIbcPrefixo({ identificador: "HMS00001", prefixo: "HMS" }), "HMS");
    assert.equal(resolveIbcPrefixo({ identificador: "HM0007", prefixo: null }), "HM");
  });

  it("conversion preview prepends N to homologated prefixes only", () => {
    assert.equal(previewConversaoPrefixo({ identificador: "HMS00001", prefixo: "HMS" }), "NHMS");
    assert.equal(previewConversaoPrefixo({ identificador: "NHMS00001", prefixo: "NHMS" }), null);
  });

  it("product change keeps the homologation family", () => {
    assert.equal(
      previewMudancaProdutoPrefixo({ identificador: "HMS00001", prefixo: "HMS" }, "so"),
      "HMSO",
    );
    assert.equal(
      previewMudancaProdutoPrefixo({ identificador: "NHMS00001", prefixo: "NHMS" }, "SO"),
      "NHMSO",
    );
    assert.equal(isIbcNaoHomologado({ identificador: "NHMS00001", prefixo: "NHMS" }), true);
  });
});

describe("isIbcSubstituido", () => {
  it("is true only when the IBC points to a replacement", () => {
    assert.equal(isIbcSubstituido({ convertedToContainerId: "ibc-target-1" }), true);
    assert.equal(isIbcSubstituido({ convertedToContainerId: null }), false);
    assert.equal(isIbcSubstituido({}), false);
  });
});
