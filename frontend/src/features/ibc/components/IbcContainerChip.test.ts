import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContainerPaletaDTO } from "../types/ibcExpedicao.types";
import IbcContainerChip from "./IbcContainerChip";

function container(parcial: Partial<ContainerPaletaDTO> = {}): ContainerPaletaDTO {
  return {
    identificador: "HMCL1",
    alocacaoId: null,
    grupoCodigo: "CLORO",
    corHex: "#00AA00",
    universal: false,
    homologado: true,
    ...parcial,
  };
}

function html(props: React.ComponentProps<typeof IbcContainerChip>): string {
  return renderToStaticMarkup(React.createElement(IbcContainerChip, props));
}

describe("IbcContainerChip", () => {
  it("mostra o disponível com fundo claro e borda forte na cor da placa", () => {
    const markup = html({ container: container(), estado: "disponivel", onSelect: () => undefined });

    assert.match(markup, /<button/);
    assert.match(markup, /rounded-md/);
    assert.doesNotMatch(markup, /rounded-full/);
    assert.match(markup, /background-color:#00AA002E/);
    assert.match(markup, /border-color:#00AA00E6/);
    assert.match(markup, /HMCL1/);
    assert.doesNotMatch(markup, /opacity-50/);
    assert.doesNotMatch(markup, /bg-background\/90/);
  });

  it("marca o vinculado com o check antes do código", () => {
    const markup = html({
      container: container({ alocacaoId: "aloc-1" }),
      estado: "vinculado",
      onSelect: () => undefined,
    });

    assert.match(markup, /aria-label="HMCL1, Vinculado"/);
    assert.ok(markup.indexOf("<svg") < markup.indexOf(">HMCL1<"));
    assert.doesNotMatch(markup, /opacity-50/);
  });

  it("deixa o chip estático sem botão quando a expedição está fechada", () => {
    const markup = html({ container: container({ alocacaoId: "aloc-1" }), estado: "estatico" });

    assert.doesNotMatch(markup, /<button/);
    assert.match(markup, /HMCL1/);
  });

  it("desabilita o disponível no teto e mostra o motivo", () => {
    const markup = html({
      container: container(),
      estado: "disponivel",
      desabilitado: true,
      motivoBloqueio: "A carga já está no teto",
      onSelect: () => undefined,
    });

    assert.match(markup, /disabled/);
    assert.match(markup, /A carga já está no teto/);
  });

  it("pinta o não homologado com a cor da placa NH e borda tracejada", () => {
    const markup = html({
      container: container({ identificador: "NH00001", homologado: false, universal: true, grupoCodigo: null, corHex: "#FF5F11" }),
      estado: "disponivel",
      onSelect: () => undefined,
    });

    assert.match(markup, /Não homologado/);
    assert.match(markup, /aria-label="NH00001, Não homologado"/);
    assert.match(markup, /border-dashed/);
    assert.match(markup, /background-color:#FF5F112E/);
    assert.match(markup, /border-color:#FF5F11E6/);
    assert.match(markup, /background-color:#FF5F1138/);
    assert.doesNotMatch(markup, /bg-muted/);
  });

  it("deixa o não homologado sem placa com borda tracejada neutra", () => {
    const markup = html({
      container: container({ identificador: "NHCL1", homologado: false, corHex: null }),
      estado: "disponivel",
      onSelect: () => undefined,
    });

    assert.match(markup, /border-dashed/);
    assert.match(markup, /border-border/);
    assert.doesNotMatch(markup, /border-color:/);
  });
});
