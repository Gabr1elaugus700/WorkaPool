import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IbcChecklistItemDTO } from "../types/ibcChecklist.types";
import IbcChecklistItensTabela from "./IbcChecklistItensTabela";

const itens = (total: number): IbcChecklistItemDTO[] =>
  Array.from({ length: total }, (_, index) => ({
    id: `item-${index + 1}`,
    descricao: `Item ${index + 1}`,
    critico: index === 0,
    ativo: index !== 1,
  }));

const render = (lista: IbcChecklistItemDTO[]) =>
  renderToStaticMarkup(
    React.createElement(IbcChecklistItensTabela, {
      itens: lista,
      saving: false,
      onEdit: () => undefined,
      onToggleAtivo: () => undefined,
    }),
  );

describe("IbcChecklistItensTabela", () => {
  it("mostra só os 10 primeiros itens e a paginação", () => {
    const html = render(itens(12));
    assert.equal(html.match(/<tr/g)?.length, 11);
    assert.match(html, />Item 10</);
    assert.doesNotMatch(html, />Item 11</);
    assert.match(html, /Página 1 de 2/);
  });

  it("omite a paginação quando cabe numa página", () => {
    assert.doesNotMatch(render(itens(3)), /Página/);
  });

  it("mostra o estado vazio sem itens", () => {
    const html = render([]);
    assert.match(html, /Nenhum item cadastrado\./);
    assert.doesNotMatch(html, /<table/);
  });
});
