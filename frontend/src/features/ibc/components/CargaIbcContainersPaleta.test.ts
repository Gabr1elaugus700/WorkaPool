import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CargaIbcContainersPaleta from "./CargaIbcContainersPaleta";
import type { ContainerCargaDTO } from "../types/ibcExpedicao.types";
import { containersCarga } from "../utils/containersCarga";

function item(identificador: string, overrides: Partial<ContainerCargaDTO> = {}): ContainerCargaDTO {
  return {
    ibcId: identificador,
    identificador,
    grupoCodigo: "G020",
    sigla: "AZ",
    corHex: "#2563EB",
    universal: false,
    homologado: true,
    alocacaoId: null,
    ...overrides,
  };
}

const paleta = containersCarga.montar({
  gruposPermitidos: [{ grupoCodigo: "G020", sigla: "AZ", corHex: "#2563EB" }],
  itens: [
    item("HMAZ0001", { alocacaoId: "aloc-1" }),
    ...Array.from({ length: 14 }, (_, i) => item(`HMAZ${String(i + 10).padStart(4, "0")}`)),
    item("NHAZ0002", { homologado: false }),
  ],
});

function html(overrides: { mutationsLocked?: boolean; motivoBloqueio?: string | null } = {}): string {
  return renderToStaticMarkup(
    React.createElement(CargaIbcContainersPaleta, {
      paleta,
      erro: null,
      onRecarregar: () => undefined,
      alocacoes: [],
      descricaoBusca: "Carga 383",
      mutationsLocked: overrides.mutationsLocked ?? false,
      motivoBloqueio: overrides.motivoBloqueio ?? null,
      allocating: false,
      deallocatingId: null,
      aviso: null,
      onAllocate: async () => true,
      onDeallocate: async () => undefined,
    }),
  );
}

describe("CargaIbcContainersPaleta", () => {
  it("mostra o vinculado com ação de desvincular e corta os disponíveis em 12", () => {
    const markup = html();

    assert.match(markup, /aria-label="Desvincular HMAZ0001 \(grupo G020\)"/);
    assert.equal((markup.match(/aria-label="Vincular /g) ?? []).length, 12);
    assert.match(markup, /G020 · AZ/);
    assert.match(markup, /\+3 disponíveis na busca/);
    assert.match(markup, /Buscar mais containers/);
    assert.match(markup, /background-color:#2563EB1F/);
  });

  it("desabilita os disponíveis no teto", () => {
    const markup = html({ motivoBloqueio: "A quantidade esperada já está vinculada." });
    assert.match(markup, /<button[^>]*aria-label="Vincular HMAZ0010 \(grupo G020\)"[^>]*disabled/);
  });

  it("com a expedição fechada só lista a carga, sem ação", () => {
    const markup = html({ mutationsLocked: true });

    assert.match(markup, /HMAZ0001 na carga/);
    assert.doesNotMatch(markup, /Desvincular|Vincular |Buscar mais containers/);
  });
});
