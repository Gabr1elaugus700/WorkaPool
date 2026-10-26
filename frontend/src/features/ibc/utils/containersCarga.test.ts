import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ContainerCargaDTO, ContainersCargaDTO } from "../types/ibcExpedicao.types";
import { containersCarga } from "./containersCarga";

function item(identificador: string, overrides: Partial<ContainerCargaDTO> = {}): ContainerCargaDTO {
  return {
    ibcId: identificador,
    identificador,
    grupoCodigo: "G020",
    sigla: "AZ",
    corHex: "#2563eb",
    universal: false,
    homologado: true,
    alocacaoId: null,
    ...overrides,
  };
}

function dto(itens: ContainerCargaDTO[]): ContainersCargaDTO {
  return {
    gruposPermitidos: [
      { grupoCodigo: "G031", sigla: "VD", corHex: "#16A34A" },
      { grupoCodigo: "G020", sigla: "AZ", corHex: "#2563EB" },
    ],
    itens,
  };
}

describe("containersCarga.montar", () => {
  it("separa vinculados e ordena as seções: grupos na ordem da carga, universal, não homologados", () => {
    const paleta = containersCarga.montar(
      dto([
        item("NHAZ0002", { homologado: false }),
        item("HMAZ0010"),
        item("HMAZ0002"),
        item("HMAZ0001", { alocacaoId: "aloc-1" }),
        item("HMVD0003", { grupoCodigo: "G031", sigla: "VD", corHex: "#16A34A" }),
        item("HMU0004", { universal: true, grupoCodigo: null, sigla: null, corHex: "#6B7280" }),
      ]),
    );

    assert.deepEqual(paleta.naCarga.map((c) => c.identificador), ["HMAZ0001"]);
    assert.deepEqual(
      paleta.secoes.map((s) => [s.tipo, s.titulo, s.corHex, s.itens.map((c) => c.identificador)]),
      [
        ["grupo", "G031 · VD", "#16A34A", ["HMVD0003"]],
        ["grupo", "G020 · AZ", "#2563EB", ["HMAZ0002", "HMAZ0010"]],
        ["universal", "Universal", "#6B7280", ["HMU0004"]],
        ["naoHomologado", "Não homologados", null, ["NHAZ0002"]],
      ],
    );
  });

  it("omite grupo sem container livre", () => {
    const paleta = containersCarga.montar(dto([item("HMAZ0001")]));
    assert.deepEqual(paleta.secoes.map((s) => s.chave), ["grupo:G020"]);
  });
});

describe("containersCarga.limitar", () => {
  it("corta no total e conta os ocultos", () => {
    const { secoes } = containersCarga.montar(
      dto([item("HMAZ0001"), item("HMAZ0002"), item("HMAZ0003"), item("NH0001", { homologado: false })]),
    );
    const visivel = containersCarga.limitar(secoes, 2);
    assert.deepEqual(visivel.secoes.map((s) => s.itens.length), [2]);
    assert.strictEqual(visivel.ocultos, 2);
  });
});

describe("containersCarga.filtrar", () => {
  it("filtra por código sem diferenciar caixa e remove seção vazia", () => {
    const { secoes } = containersCarga.montar(
      dto([item("HMAZ0001"), item("HMAZ0002"), item("NH0001", { homologado: false })]),
    );
    const filtradas = containersCarga.filtrar(secoes, " az0002 ");
    assert.deepEqual(
      filtradas.map((s) => s.itens.map((c) => c.identificador)),
      [["HMAZ0002"]],
    );
  });
});
