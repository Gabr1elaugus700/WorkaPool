import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContainerPaletaDTO, ContainersCargaDTO } from "../types/ibcExpedicao.types";
import BuscarContainersDialog from "./BuscarContainersDialog";

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

const paleta: ContainersCargaDTO = {
  grupos: [{ grupoCodigo: "CLORO", sigla: "CL", corHex: "#00AA00", grupoDescricao: null }],
  vinculados: [],
  disponiveis: [
    container("HMCL1"),
    container("NH1", { universal: true, homologado: false, grupoCodigo: null, corHex: null }),
  ],
};

function html(parcial: Partial<React.ComponentProps<typeof BuscarContainersDialog>> = {}): string {
  return renderToStaticMarkup(
    React.createElement(BuscarContainersDialog, {
      open: true,
      onOpenChange: () => undefined,
      paleta,
      termo: "",
      onTermoChange: () => undefined,
      noTeto: false,
      onVincular: () => undefined,
      onVincularCodigo: () => undefined,
      ...parcial,
    }),
  );
}

describe("BuscarContainersDialog", () => {
  it("esconde o container que não contém o termo", () => {
    const markup = html({ termo: "HMCL1" });

    assert.match(markup, /HMCL1/);
    assert.doesNotMatch(markup, /NH1/);
  });

  it("mostra o motivo quando a carga está no teto", () => {
    const markup = html({ noTeto: true, motivoTeto: "A carga já está no teto" });

    assert.match(markup, /A carga já está no teto/);
    assert.match(markup, /disabled/);
  });

  it("oferece vínculo por código livre", () => {
    const markup = html();

    assert.match(markup, /Não encontrou\? Vincule pelo código/);
    assert.match(markup, /codigo-livre-container/);
  });
});
