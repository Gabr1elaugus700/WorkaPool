import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IbcChecklistPadraoDTO } from "../services/ibcChecklistPadraoService";
import IbcChecklistPadraoLista from "./IbcChecklistPadraoLista";

const padrao: IbcChecklistPadraoDTO = {
  checklistModeloId: "chk-1",
  nome: "Entrada visual",
  ativo: true,
  vinculadoEm: "2026-01-01T00:00:00.000Z",
  vinculadoPor: { id: "u1", nome: "Ana" },
};

function html(canWrite: boolean, padroes: IbcChecklistPadraoDTO[]): string {
  return renderToStaticMarkup(
    React.createElement(IbcChecklistPadraoLista, {
      padroes,
      canWrite,
      removingId: null,
      onRemover: () => undefined,
    }),
  );
}

describe("IbcChecklistPadraoLista", () => {
  it("mostra o vazio quando o produto não tem padrão", () => {
    assert.match(html(true, []), /Nenhum checklist padrão/);
  });

  it("mostra a linha e a remoção para quem escreve", () => {
    const markup = html(true, [padrao]);
    assert.match(markup, /Entrada visual/);
    assert.match(markup, /aria-label="Remover Entrada visual do padrão"/);
  });

  it("esconde a remoção de quem só consulta", () => {
    const markup = html(false, [padrao]);
    assert.match(markup, /Entrada visual/);
    assert.doesNotMatch(markup, /Remover/);
  });
});
