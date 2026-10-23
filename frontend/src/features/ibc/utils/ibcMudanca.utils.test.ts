import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";
import {
  IBC_OBSERVACAO_MAX,
  acaoMudancaDisponivel,
  buildConversaoInput,
  buildIbcMudancaConfirmacao,
  buildMudancaProdutoInput,
  corDePlaca,
  isIbcNaoHomologado,
  isIbcSubstituido,
  listarDestinosPlaca,
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

const lista: ListaIbcProdutoConfig = {
  universal: { id: "univ", corHex: "#00aa00", configurado: true, emUso: false },
  grupos: [
    {
      id: "soda",
      grupoCodigo: "01",
      grupoDescricao: "Soda",
      sigla: "s",
      corHex: "#aa0000",
      configurado: true,
      emUso: true,
      encontradoNoSapiens: true,
    },
    {
      id: null,
      grupoCodigo: "02",
      grupoDescricao: "Cloro",
      sigla: null,
      corHex: null,
      configurado: false,
      emUso: false,
      encontradoNoSapiens: true,
    },
  ],
};

describe("prefix previews", () => {
  it("resolves the prefix from the field or the identifier", () => {
    assert.equal(resolveIbcPrefixo({ identificador: "HMS00001", prefixo: "HMS" }), "HMS");
    assert.equal(resolveIbcPrefixo({ identificador: "HM0007", prefixo: null }), "HM");
  });

  it("previews NH+sigla when keeping the product and NH when turning universal", () => {
    const hm = { identificador: "HMS00001", prefixo: "HMS" };
    assert.equal(previewConversaoPrefixo(hm, "manter_grupo"), "NHS");
    assert.equal(previewConversaoPrefixo(hm, "universal"), "NH");
    assert.equal(previewConversaoPrefixo({ identificador: "NH00012", prefixo: "NH" }, "universal"), null);
  });

  it("asks for a group when the legacy HM has no sigla", () => {
    const legado = { identificador: "HM00007", prefixo: "HM" };
    assert.equal(previewConversaoPrefixo(legado, "manter_grupo"), null);
    assert.equal(previewConversaoPrefixo(legado, "manter_grupo", "s"), "NHS");
    assert.equal(previewConversaoPrefixo(legado, "universal"), "NH");
  });

  it("product change stays in the NH family", () => {
    assert.equal(previewMudancaProdutoPrefixo("so"), "NHSO");
    assert.equal(previewMudancaProdutoPrefixo(null), "NH");
    assert.equal(isIbcNaoHomologado({ identificador: "NH00001", prefixo: "NH" }), true);
    assert.equal(isIbcNaoHomologado({ identificador: "NHMS00001", prefixo: "NHMS" }), true);
  });
});

describe("acaoMudancaDisponivel", () => {
  it("offers conversion only for HM and product change only for NH", () => {
    assert.equal(acaoMudancaDisponivel({ identificador: "HMS00001", prefixo: "HMS" }), "converter");
    assert.equal(acaoMudancaDisponivel({ identificador: "HM00007", prefixo: null }), "converter");
    assert.equal(acaoMudancaDisponivel({ identificador: "NHS00001", prefixo: "NHS" }), "mudar_produto");
    assert.equal(acaoMudancaDisponivel({ identificador: "NH00001", prefixo: "NH" }), "mudar_produto");
    assert.equal(acaoMudancaDisponivel({ identificador: "NHM00001", prefixo: "NHM" }), "mudar_produto");
    assert.equal(
      acaoMudancaDisponivel({ identificador: "HMS00001", prefixo: "HMS", convertedToContainerId: "novo" }),
      null,
    );
  });
});

describe("listarDestinosPlaca", () => {
  it("lists the universal and configured groups except the current product", () => {
    assert.deepEqual(
      listarDestinosPlaca(lista, "soda").map((item) => item.rotulo),
      ["Universal"],
    );
    assert.deepEqual(
      listarDestinosPlaca(lista, "univ").map((item) => ({ rotulo: item.rotulo, corHex: item.corHex })),
      [{ rotulo: "Soda (S)", corHex: "#AA0000" }],
    );
  });
});

describe("conversion payload", () => {
  it("sends the destination and the legacy group only when chosen", () => {
    assert.equal(buildConversaoInput(false, "avaria", "universal", null), null);
    assert.deepEqual(buildConversaoInput(true, " avaria ", "universal", "  "), {
      confirmado: true,
      observacao: "avaria",
      destino: "universal",
    });
    assert.deepEqual(buildConversaoInput(true, "", "manter_grupo", " 01 "), {
      confirmado: true,
      observacao: null,
      destino: "manter_grupo",
      grupoCodigo: "01",
    });
    assert.deepEqual(buildMudancaProdutoInput(true, "", "soda"), {
      confirmado: true,
      observacao: null,
      produtoId: "soda",
    });
    assert.equal(corDePlaca("red"), null);
    assert.equal(corDePlaca("#00aa00"), "#00AA00");
  });
});

describe("isIbcSubstituido", () => {
  it("is true only when the IBC points to a replacement", () => {
    assert.equal(isIbcSubstituido({ convertedToContainerId: "ibc-target-1" }), true);
    assert.equal(isIbcSubstituido({ convertedToContainerId: null }), false);
    assert.equal(isIbcSubstituido({}), false);
  });
});
