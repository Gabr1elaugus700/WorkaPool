import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { Sheet } from "@/components/ui/sheet";
import CadastroIbcDetalhe from "./CadastroIbcDetalhe";
import CadastroIbcPlacaFields from "./CadastroIbcPlacaFields";
import IbcPlacaAmostra from "./IbcPlacaAmostra";

const GRUPOS = [{ grupoCodigo: "10", nome: "Soda cáustica", sigla: "S", corHex: "#AA0000" }] as const;

function campos(homologado: boolean, grupoCodigo: string, universalCorHex: string | null): string {
  return renderToStaticMarkup(
    React.createElement(CadastroIbcPlacaFields, {
      id: "ibc-grupo",
      grupos: GRUPOS,
      universalCorHex,
      homologado,
      grupoCodigo,
      onHomologado: () => undefined,
      onGrupo: () => undefined,
    }),
  );
}

function ibc(overrides: Partial<IbcCadastroDTO> = {}): IbcCadastroDTO {
  return {
    id: "1",
    identificador: "HM0007",
    tipoCadastro: "NOVO",
    aptidao: "APTO",
    motivoInaptidao: null,
    custodia: "PATIO",
    dataLimite: "2027-01-01",
    primeiraInspecaoEm: null,
    baixadoEm: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    corHex: null,
    universal: false,
    homologado: true,
    ...overrides,
  };
}

describe("cadastro de placa no modal, na lista e no detalhe", () => {
  it("HM exige grupo e mostra o prefixo com a cor escolhida", () => {
    const vazio = campos(true, "", "#00AA00");
    assert.match(vazio, /Homologado/);
    assert.match(vazio, /Não homologado/);
    assert.match(vazio, /Container homologado exige grupo de produto/);
    assert.doesNotMatch(vazio, /Universal \(lavado entre usos\)/);

    const escolhido = campos(true, "10", "#00AA00");
    assert.match(escolhido, /HMS/);
    assert.match(escolhido, /Soda cáustica \(S\)/);
    assert.match(escolhido, /background-color:#AA0000/i);
    assert.match(escolhido, /aria-label="Placa #AA0000"/);
  });

  it("NH sem grupo anuncia o universal e a placa NH", () => {
    const html = campos(false, "", "#00AA00");
    assert.match(html, /Universal \(lavado entre usos\)/);
    assert.match(html, />NH</);
    assert.doesNotMatch(html, /Container homologado exige grupo/);
  });

  it("legado sem produto usa placa neutra no detalhe", () => {
    assert.match(renderToStaticMarkup(React.createElement(IbcPlacaAmostra, { corHex: null })), /Placa neutra/);
    const html = renderToStaticMarkup(
      React.createElement(Sheet, { open: true }, React.createElement(CadastroIbcDetalhe, { ibc: ibc(), produto: null })),
    );
    assert.match(html, /HM0007/);
    assert.match(html, /Placa neutra/);
    assert.match(html, /Legado sem produto/);
    assert.match(html, /Neutra/);
  });

  it("detalhe com produto mostra a cor ao lado do identificador", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Sheet,
        { open: true },
        React.createElement(CadastroIbcDetalhe, {
          ibc: ibc({ identificador: "HMS00001", prefixo: "HMS", corHex: "#AA0000", produtoId: "cfg-s" }),
          produto: "Soda cáustica",
        }),
      ),
    );
    assert.match(html, /HMS00001/);
    assert.match(html, /Placa #AA0000/);
    assert.match(html, /Soda cáustica/);
  });
});
