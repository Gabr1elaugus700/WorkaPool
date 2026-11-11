import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ContainerPaletaDTO, ContainersCargaDTO } from "../types/ibcExpedicao.types";
import { containersCarga } from "./containersCarga";

function container(parcial: Partial<ContainerPaletaDTO> & Pick<ContainerPaletaDTO, "identificador">): ContainerPaletaDTO {
  return {
    alocacaoId: null,
    grupoCodigo: null,
    corHex: null,
    universal: false,
    homologado: true,
    ...parcial,
  };
}

const paleta: ContainersCargaDTO = {
  grupos: [
    { grupoCodigo: "CLORO", sigla: "CL", corHex: "#00aa00" },
    { grupoCodigo: "SODA", sigla: "SD", corHex: "#0000aa" },
    { grupoCodigo: "VAZIO", sigla: "VZ", corHex: "#111111" },
  ],
  vinculados: [],
  disponiveis: [
    container({ identificador: "CL1", grupoCodigo: "CLORO", corHex: "#00aa00" }),
    container({ identificador: "UN1", universal: true, homologado: false }),
    container({ identificador: "NH1", grupoCodigo: "CLORO", homologado: false }),
    container({ identificador: "SD1", grupoCodigo: "SODA", corHex: "#0000aa" }),
    container({ identificador: "FORA", grupoCodigo: "OUTRO" }),
  ],
};

describe("containersCarga.agruparDisponiveis", () => {
  it("separa grupo, universal e não homologado nessa ordem", () => {
    const secoes = containersCarga.agruparDisponiveis(paleta);
    assert.deepEqual(
      secoes.map((secao) => ({
        tipo: secao.tipo,
        grupoCodigo: secao.grupoCodigo,
        sigla: secao.sigla,
        corHex: secao.corHex,
        ids: secao.containers.map((item) => item.identificador),
      })),
      [
        { tipo: "grupo", grupoCodigo: "CLORO", sigla: "CL", corHex: "#00aa00", ids: ["CL1"] },
        { tipo: "grupo", grupoCodigo: "SODA", sigla: "SD", corHex: "#0000aa", ids: ["SD1"] },
        { tipo: "universal", grupoCodigo: null, sigla: null, corHex: null, ids: ["UN1"] },
        { tipo: "nao-homologado", grupoCodigo: null, sigla: null, corHex: null, ids: ["NH1"] },
      ],
    );
  });

  it("omite grupo sem container e código fora dos grupos", () => {
    const secoes = containersCarga.agruparDisponiveis(paleta);
    assert.equal(secoes.some((secao) => secao.grupoCodigo === "VAZIO"), false);
    assert.equal(
      secoes.some((secao) => secao.containers.some((item) => item.identificador === "FORA")),
      false,
    );
  });
});

describe("containersCarga.limitarVisiveis", () => {
  it("corta a lista e devolve o restante", () => {
    const corte = containersCarga.limitarVisiveis(["a", "b", "c"], 2);
    assert.deepEqual(corte, { visiveis: ["a", "b"], restante: ["c"] });
  });

  it("trata limite negativo como zero", () => {
    const corte = containersCarga.limitarVisiveis(["a"], -1);
    assert.deepEqual(corte, { visiveis: [], restante: ["a"] });
  });
});

describe("containersCarga.filtrarPorCodigo", () => {
  it("filtra o identificador sem diferenciar maiúsculas", () => {
    const lista = paleta.disponiveis;
    assert.deepEqual(
      containersCarga.filtrarPorCodigo(lista, "nh").map((item) => item.identificador),
      ["NH1"],
    );
  });

  it("devolve a lista inteira com termo vazio", () => {
    assert.equal(containersCarga.filtrarPorCodigo(paleta.disponiveis, "  ").length, paleta.disponiveis.length);
  });
});
