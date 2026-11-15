import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import CargaIbcCard from "./CargaIbcCard";
import type { CargaEmViagemListItemDTO, CargaExpedicaoListItemDTO } from "../types/ibcExpedicao.types";

function itemAguardando(overrides?: Partial<CargaExpedicaoListItemDTO>): CargaExpedicaoListItemDTO {
  return {
    id: "c1",
    codCar: 383,
    destino: "Teste IBC",
    previsaoSaida: "2026-11-20",
    quantidadeAlocada: 0,
    quantidadeEsperadaTotal: 1,
    temExpedicao: false,
    podeFecharExpedicao: false,
    situacao: "FECHADA",
    ...overrides,
  };
}

function itemEmViagem(): CargaEmViagemListItemDTO {
  return {
    codCar: 383,
    destino: "Teste IBC",
    situacao: "FECHADA",
    previsaoSaida: "2026-11-20",
    fechadoEm: "2026-11-15T14:00:00.000Z",
    quantidadePedidos: 1,
    quantidadeIbcs: 1,
    quantidadeIbcsEmViagem: 1,
    clientes: [{ cliente: "Cliente A", codCli: "1" }],
  };
}

function renderCard(element: React.ReactElement) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, null, element));
}

describe("CargaIbcCard", () => {
  it("shows destino, carga number, saída prevista and situacao chips for aguardando", () => {
    const markup = renderCard(
      React.createElement(CargaIbcCard, { variant: "aguardando", item: itemAguardando() }),
    );

    assert.match(markup, />Teste IBC</);
    assert.match(markup, /Carga 383/);
    assert.match(markup, /Saída prevista:/);
    assert.match(markup, />20\/11\/2026</);
    assert.match(markup, /FECHADA/);
    assert.match(markup, /Progresso IBC/);
    assert.match(markup, /0\/1/);
    assert.doesNotMatch(markup, /Previsão de saída/);
    assert.doesNotMatch(markup, /08:00/);
  });

  it("formats previsão without time when API sends datetime", () => {
    const markup = renderCard(
      React.createElement(CargaIbcCard, {
        variant: "aguardando",
        item: itemAguardando({ previsaoSaida: "2026-11-20T08:00:00.000Z" }),
      }),
    );

    assert.match(markup, />20\/11\/2026</);
    assert.doesNotMatch(markup, /08:00/);
  });

  it("shows the same heading and chips for em-viagem", () => {
    const markup = renderCard(
      React.createElement(CargaIbcCard, { variant: "em-viagem", item: itemEmViagem() }),
    );

    assert.match(markup, />Teste IBC</);
    assert.match(markup, /Saída prevista:/);
    assert.match(markup, />20\/11\/2026</);
    assert.match(markup, /Expedida em/);
  });
});