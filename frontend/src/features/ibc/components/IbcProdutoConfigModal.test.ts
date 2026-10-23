import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import IbcProdutoConfigModal, { type IbcProdutoConfigEdicao } from "./IbcProdutoConfigModal";

const grupoEmUso: IbcProdutoConfigEdicao = {
  tipo: "grupo",
  item: {
    id: "cfg-1",
    grupoCodigo: "01",
    grupoDescricao: "Soda",
    sigla: "S",
    corHex: "#AA0000",
    configurado: true,
    emUso: true,
    encontradoNoSapiens: true,
  },
};

function html(alvo: IbcProdutoConfigEdicao, erro: string | null = null): string {
  return renderToStaticMarkup(
    React.createElement(IbcProdutoConfigModal, {
      alvo,
      erro,
      saving: false,
      onClose: () => undefined,
      onSave: () => Promise.resolve(),
    }),
  );
}

describe("IbcProdutoConfigModal", () => {
  it("trava sigla e cor quando a configuração está em uso", () => {
    const markup = html(grupoEmUso);
    assert.match(markup, /já existe container usando esta configuração/);
    assert.match(markup, /id="placa-sigla"[^>]*disabled/);
    assert.match(markup, /id="placa-cor"[^>]*disabled/);
    assert.match(markup, /Salvar placa/);
    assert.match(markup, /disabled/);
  });

  it("mostra o erro da API e mantém o formulário", () => {
    const markup = html(
      { tipo: "universal", item: { id: "u", corHex: "#00FF00", configurado: true, emUso: false } },
      "Cor da placa já usada em outra configuração",
    );
    assert.match(markup, /role="alert"/);
    assert.match(markup, /Cor da placa já usada em outra configuração/);
    assert.match(markup, /Salvar placa/);
    assert.doesNotMatch(markup, /id="placa-sigla"/);
  });
});
