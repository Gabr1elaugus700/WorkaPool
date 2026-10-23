import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import ConfirmarMudancaIbcModal from "./ConfirmarMudancaIbcModal";

const config: ListaIbcProdutoConfig = {
  universal: { id: "univ", corHex: "#00AA00", configurado: true, emUso: false },
  grupos: [
    {
      id: "soda",
      grupoCodigo: "01",
      grupoDescricao: "Soda",
      sigla: "S",
      corHex: "#AA0000",
      configurado: true,
      emUso: true,
      encontradoNoSapiens: true,
    },
    {
      id: "cloro",
      grupoCodigo: "02",
      grupoDescricao: "Cloro",
      sigla: "C",
      corHex: "#0000AA",
      configurado: true,
      emUso: false,
      encontradoNoSapiens: true,
    },
  ],
};

function ibc(overrides: Partial<IbcCadastroDTO> = {}): IbcCadastroDTO {
  return {
    id: "ibc-1",
    identificador: "HMS00015",
    tipoCadastro: "NOVO",
    aptidao: "APTO",
    motivoInaptidao: null,
    custodia: "PATIO",
    dataLimite: "2027-01-01",
    primeiraInspecaoEm: null,
    baixadoEm: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    produtoId: "soda",
    prefixo: "HMS",
    ...overrides,
  };
}

function html(modo: "conversion" | "product_change", item = ibc(), placa = config): string {
  return renderToStaticMarkup(
    React.createElement(ConfirmarMudancaIbcModal, {
      ibc: item,
      modo,
      config: placa,
      configCarregando: false,
      configErro: null,
      submitting: false,
      onClose: () => undefined,
      onConfirm: () => Promise.resolve(),
    }),
  );
}

describe("ConfirmarMudancaIbcModal", () => {
  it("asks to keep the product or turn universal and warns about the new plate", () => {
    const markup = html("conversion");
    assert.match(markup, /Manter produto/);
    assert.match(markup, /Universal/);
    assert.match(markup, /placa atual deixa de valer/);
    assert.match(markup, /NHS/);
    assert.match(markup, /disabled/);
  });

  it("asks for a group when the legacy container has no product", () => {
    const markup = html("conversion", ibc({ identificador: "HM00007", prefixo: "HM", produtoId: null }));
    assert.match(markup, /não tem produto/);
    assert.match(markup, /Grupo do produto/);
    assert.match(markup, /Selecione o grupo/);
  });

  it("offers a configured group or the universal when changing an NH product", () => {
    const markup = html("product_change", ibc({ identificador: "NHS00015", prefixo: "NHS" }));
    assert.match(markup, /Novo produto/);
    assert.match(markup, /Grupo ou universal/);
    assert.doesNotMatch(markup, /Manter produto/);
    assert.match(markup, /placa atual deixa de valer/);
  });
});
