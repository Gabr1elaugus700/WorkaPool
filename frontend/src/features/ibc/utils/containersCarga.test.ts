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
    { grupoCodigo: "CLORO", sigla: "CL", corHex: "#00aa00", grupoDescricao: "Hipoclorito" },
    { grupoCodigo: "SODA", sigla: "SD", corHex: "#0000aa", grupoDescricao: null },
    { grupoCodigo: "VAZIO", sigla: "VZ", corHex: "#111111", grupoDescricao: "   " },
    { grupoCodigo: "SEM", sigla: "SM", corHex: "#222222", grupoDescricao: null },
  ],
  vinculados: [],
  disponiveis: [
    container({ identificador: "CL1", grupoCodigo: "CLORO", corHex: "#00aa00" }),
    container({ identificador: "UN1", universal: true, homologado: false }),
    container({ identificador: "NH1", grupoCodigo: "CLORO", homologado: false }),
    container({ identificador: "SD1", grupoCodigo: "SODA", corHex: "#0000aa" }),
    container({ identificador: "VZ1", grupoCodigo: "VAZIO", corHex: "#111111" }),
    container({ identificador: "ORFAO", homologado: false }),
    container({ identificador: "FORA", grupoCodigo: "OUTRO" }),
  ],
};

describe("containersCarga.agruparDisponiveis", () => {
  it("coloca o não homologado do grupo na seção do grupo e o órfão à parte", () => {
    const secoes = containersCarga.agruparDisponiveis(paleta);
    assert.deepEqual(
      secoes.map((secao) => ({
        tipo: secao.tipo,
        grupoCodigo: secao.grupoCodigo,
        sigla: secao.sigla,
        corHex: secao.corHex,
        grupoDescricao: secao.grupoDescricao,
        ids: secao.containers.map((item) => item.identificador),
      })),
      [
        {
          tipo: "grupo",
          grupoCodigo: "CLORO",
          sigla: "CL",
          corHex: "#00aa00",
          grupoDescricao: "Hipoclorito",
          ids: ["CL1", "NH1"],
        },
        {
          tipo: "grupo",
          grupoCodigo: "SODA",
          sigla: "SD",
          corHex: "#0000aa",
          grupoDescricao: null,
          ids: ["SD1"],
        },
        {
          tipo: "grupo",
          grupoCodigo: "VAZIO",
          sigla: "VZ",
          corHex: "#111111",
          grupoDescricao: null,
          ids: ["VZ1"],
        },
        {
          tipo: "universal",
          grupoCodigo: null,
          sigla: null,
          corHex: null,
          grupoDescricao: null,
          ids: ["UN1"],
        },
        {
          tipo: "nao-homologado",
          grupoCodigo: null,
          sigla: null,
          corHex: null,
          grupoDescricao: null,
          ids: ["ORFAO"],
        },
      ],
    );
  });

  it("omite grupo sem container e código fora dos grupos", () => {
    const secoes = containersCarga.agruparDisponiveis(paleta);
    assert.equal(secoes.some((secao) => secao.grupoCodigo === "SEM"), false);
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
