import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import IbcChecklistVinculoAdicionar from "./IbcChecklistVinculoAdicionar";

describe("IbcChecklistVinculoAdicionar", () => {
  it("leva o cadastro de checklist para a aba da Gestão de IBC", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(IbcChecklistVinculoAdicionar, {
          disponiveis: [],
          hasChecklistAtivo: false,
          submitting: false,
          onVincular: async () => false,
        }),
      ),
    );
    assert.match(html, /href="\/gestao-ibc\/checklists"/);
    assert.doesNotMatch(html, /checklists-ibc/);
  });
});
