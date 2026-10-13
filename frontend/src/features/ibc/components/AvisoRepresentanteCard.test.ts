import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AvisoRepresentanteCard from "./AvisoRepresentanteCard";
import type { AvisoRepresentante } from "../types/avisoRepresentante.types";

function avisoMisto(lidoEm: string | null = null): AvisoRepresentante {
  return {
    id: "6f1c2c2e-0a1b-4c3d-8e9f-112233445566",
    codCar: 1842,
    numPed: "W100",
    codCli: "10",
    cliente: "Piscina Aurora",
    codRep: 7,
    lidoEm,
    createdAt: "2026-10-13T12:00:00.000Z",
    itens: [
      {
        identificador: "HM1001",
        modalidade: "EMPRESTIMO",
        emprestimoVenceEm: "2026-07-12T00:00:00.000Z",
      },
      {
        identificador: "HM1002",
        modalidade: "VENDA",
        emprestimoVenceEm: null,
      },
    ],
  };
}

describe("AvisoRepresentanteCard", () => {
  it("shows pedido, cliente and both labels when the order mixes loan and sale", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AvisoRepresentanteCard, {
        aviso: avisoMisto(),
        marcando: false,
        onMarcarLido: () => undefined,
      }),
    );

    assert.match(markup, /Pedido W100/);
    assert.match(markup, /Carga 1842/);
    assert.match(markup, /Piscina Aurora/);
    assert.match(markup, /HM1001/);
    assert.match(markup, /HM1002/);
    assert.match(markup, /Empréstimo — obrigação de devolução até 12\/07\/2026/);
    assert.match(markup, /Venda — saída definitiva/);
    assert.match(markup, /Marcar como lido/);
  });

  it("keeps a read notice on the list and hides the action", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AvisoRepresentanteCard, {
        aviso: avisoMisto("2026-10-13T18:40:00.000Z"),
        marcando: false,
        onMarcarLido: () => undefined,
      }),
    );

    assert.match(markup, /Lido em 13\/10\/2026/);
    assert.doesNotMatch(markup, /Marcar como lido/);
  });
});
