import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IbcHistoricoDTO } from "../types/ibcCadastro.types";
import IbcHistoricoDrawer from "./IbcHistoricoDrawer";

function evento(overrides: Partial<IbcHistoricoDTO> = {}): IbcHistoricoDTO {
  return {
    id: "evt-1",
    changeType: "conversion",
    observation: "trinca na base",
    actorId: "user-1",
    actorName: "Almox",
    createdAt: "2026-10-23T12:00:00.000Z",
    from: { id: "a", identificador: "HMS00015" },
    to: { id: "b", identificador: "NHS00003" },
    identificadorAnterior: "HMS00015",
    corAnterior: "#aa0000",
    identificadorNovo: "NHS00003",
    corNova: "#00aa00",
    ...overrides,
  };
}

function html(eventos: IbcHistoricoDTO[]): string {
  return renderToStaticMarkup(
    React.createElement(IbcHistoricoDrawer, {
      identificador: "NHS00003",
      eventos,
      isLoading: false,
      errorMessage: null,
      onRetry: () => undefined,
    }),
  );
}

describe("IbcHistoricoDrawer", () => {
  it("shows the plate before and after with color", () => {
    const markup = html([evento()]);
    assert.match(markup, /HMS00015/);
    assert.match(markup, /NHS00003/);
    assert.match(markup, /#AA0000/);
    assert.match(markup, /#00AA00/);
    assert.match(markup, /trinca na base/);
  });

  it("keeps the identifiers and says the color was not recorded on old events", () => {
    const markup = html([
      evento({
        identificadorAnterior: null,
        corAnterior: null,
        identificadorNovo: null,
        corNova: null,
      }),
    ]);
    assert.match(markup, /HMS00015/);
    assert.match(markup, /NHS00003/);
    assert.match(markup, /Cor não registrada/);
  });
});