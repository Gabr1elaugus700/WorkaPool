import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContainerPaletaDTO } from "../types/ibcExpedicao.types";
import type { SecaoContainersCarga } from "../utils/containersCarga";
import CargaIbcSecaoContainers from "./CargaIbcSecaoContainers";

function container(identificador: string, parcial: Partial<ContainerPaletaDTO> = {}): ContainerPaletaDTO {
  return {
    identificador,
    alocacaoId: null,
    grupoCodigo: "CLORO",
    corHex: "#00AA00",
    universal: false,
    homologado: true,
    ...parcial,
  };
}

function html(secao: SecaoContainersCarga): string {
  return renderToStaticMarkup(
    React.createElement(CargaIbcSecaoContainers, {
      secao,
      estado: "disponivel",
      onSelect: () => undefined,
    }),
  );
}

describe("CargaIbcSecaoContainers", () => {
  it("mostra grupo, sigla, amostra e contagem", () => {
    const markup = html({
      tipo: "grupo",
      grupoCodigo: "CLORO",
      sigla: "CL",
      corHex: "#00AA00",
      containers: [container("HMCL1"), container("HMCL2")],
    });

    assert.match(markup, /CLORO · CL/);
    assert.match(markup, /2/);
    assert.match(markup, /Placa #00AA00/);
    assert.match(markup, /HMCL1/);
    assert.match(markup, /HMCL2/);
  });

  it("usa o cabeçalho Universal sem amostra de grupo", () => {
    const markup = html({
      tipo: "universal",
      grupoCodigo: null,
      sigla: null,
      corHex: null,
      containers: [container("NH1", { universal: true, homologado: false, grupoCodigo: null, corHex: null })],
    });

    assert.match(markup, /Universal/);
    assert.doesNotMatch(markup, / · /);
  });

  it("explica o que é não homologado", () => {
    const markup = html({
      tipo: "nao-homologado",
      grupoCodigo: null,
      sigla: null,
      corHex: null,
      containers: [container("NHCL1", { homologado: false })],
    });

    assert.match(markup, /Não homologados/);
    assert.match(markup, /ainda sem homologação de produto/);
  });
});
