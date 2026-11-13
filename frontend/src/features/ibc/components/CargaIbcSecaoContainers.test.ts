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

function html(secao: SecaoContainersCarga, limite?: number): string {
  return renderToStaticMarkup(
    React.createElement(CargaIbcSecaoContainers, {
      secao,
      estado: "disponivel",
      limite,
      onSelect: () => undefined,
    }),
  );
}

describe("CargaIbcSecaoContainers", () => {
  it("mostra a placa, o nome do grupo e o total da seção", () => {
    const markup = html({
      tipo: "grupo",
      grupoCodigo: "G020",
      sigla: "H",
      corHex: "#00AA00",
      grupoDescricao: "Hipoclorito",
      containers: [container("HMCL1"), container("HMCL2")],
    });

    assert.match(markup, /G020 · H Hipoclorito/);
    assert.match(markup, /2 disponíveis/);
    assert.match(markup, /Placa #00AA00/);
    assert.match(markup, /HMCL1/);
    assert.match(markup, /HMCL2/);
  });

  it("omite o nome quando a descrição é nula", () => {
    const markup = html({
      tipo: "grupo",
      grupoCodigo: "G020",
      sigla: "H",
      corHex: "#00AA00",
      grupoDescricao: null,
      containers: [container("HMCL1")],
    });

    assert.match(markup, /G020 · H/);
    assert.match(markup, /1 disponível/);
    assert.doesNotMatch(markup, /G020 · H /);
  });

  it("usa swatch cinza e a contagem no Universal", () => {
    const markup = html({
      tipo: "universal",
      grupoCodigo: null,
      sigla: null,
      corHex: null,
      grupoDescricao: null,
      containers: [container("NH1", { universal: true, homologado: false, grupoCodigo: null, corHex: null })],
    });

    assert.match(markup, /Universal/);
    assert.match(markup, /Placa neutra/);
    assert.match(markup, /1 disponível/);
    assert.doesNotMatch(markup, / · /);
    assert.doesNotMatch(markup, /ainda sem homologação de produto/);
  });

  it("lista o órfão sem o parágrafo do prefixo NH", () => {
    const markup = html({
      tipo: "nao-homologado",
      grupoCodigo: null,
      sigla: null,
      corHex: null,
      grupoDescricao: null,
      containers: [container("NHCL1", { homologado: false, grupoCodigo: null })],
    });

    assert.match(markup, /Não homologados/);
    assert.match(markup, /1 disponível/);
    assert.doesNotMatch(markup, /ainda sem homologação de produto/);
  });

  it("mostra 8 chips e conta o total da seção", () => {
    const containers = Array.from({ length: 9 }, (_, index) => container(`HM${index + 1}`));
    const markup = html({
      tipo: "grupo",
      grupoCodigo: "G020",
      sigla: "H",
      corHex: "#00AA00",
      grupoDescricao: "Hipoclorito",
      containers,
    }, 8);

    assert.match(markup, /9 disponíveis/);
    assert.match(markup, /HM1/);
    assert.match(markup, /HM8/);
    assert.doesNotMatch(markup, /HM9/);
  });
});
