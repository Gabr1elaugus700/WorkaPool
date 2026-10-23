import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";
import IbcProdutoConfigLista from "./IbcProdutoConfigLista";

const lista: ListaIbcProdutoConfig = {
  universal: { id: null, corHex: null, configurado: false, emUso: false },
  grupos: [
    {
      id: null,
      grupoCodigo: "01",
      grupoDescricao: "Soda",
      sigla: null,
      corHex: null,
      configurado: false,
      emUso: false,
      encontradoNoSapiens: true,
    },
    {
      id: "cfg-z",
      grupoCodigo: "99",
      grupoDescricao: null,
      sigla: "Z",
      corHex: "#112233",
      configurado: true,
      emUso: true,
      encontradoNoSapiens: false,
    },
  ],
};

function html(canWrite: boolean): string {
  return renderToStaticMarkup(
    React.createElement(IbcProdutoConfigLista, { lista, canWrite, onEditar: () => undefined }),
  );
}

describe("IbcProdutoConfigLista", () => {
  it("fixa o Universal no topo e marca grupo sem sigla nem cor como pendente", () => {
    const markup = html(true);
    const universal = markup.indexOf("Universal");
    const soda = markup.indexOf("Soda");
    assert.ok(universal >= 0 && universal < soda);
    assert.match(markup, /Pendente/);
    assert.match(markup, /Lavado entre usos/);
  });

  it("mostra em uso, a amostra e o aviso de grupo fora do Sapiens", () => {
    const markup = html(true);
    assert.match(markup, /Em uso/);
    assert.match(markup, /aria-label="Amostra #112233"/);
    assert.match(markup, /Não encontrado no Sapiens/);
    assert.match(markup, /aria-label="Editar Soda"/);
  });

  it("esconde a edição de quem só consulta", () => {
    const markup = html(false);
    assert.doesNotMatch(markup, /Editar/);
    assert.match(markup, /Soda/);
  });
});
