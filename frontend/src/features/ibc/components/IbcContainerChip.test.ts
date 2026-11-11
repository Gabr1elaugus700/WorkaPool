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
  it("mostra o disponível opaco como botão na cor da placa", () => {
    const markup = html({ container: container(), estado: "disponivel", onSelect: () => undefined });

    assert.match(markup, /<button/);
    assert.match(markup, /opacity-50/);
    assert.match(markup, /HMCL1/);
    assert.match(markup, /#00AA00/);
  });

  it("marca o vinculado com texto acessível e cor cheia", () => {
    const markup = html({
      container: container({ alocacaoId: "aloc-1" }),
      estado: "vinculado",
      onSelect: () => undefined,
    });

    assert.match(markup, /Vinculado/);
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

  it("rotula o container não homologado", () => {
    const markup = html({
      container: container({ identificador: "NHCL1", homologado: false, corHex: null }),
      estado: "disponivel",
      onSelect: () => undefined,
    });

    assert.match(markup, /Não homologado/);
    assert.match(markup, /bg-muted/);
  });
});
