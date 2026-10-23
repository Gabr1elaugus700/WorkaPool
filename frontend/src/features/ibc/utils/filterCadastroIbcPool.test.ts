import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { filterCadastroIbcPool, type IbcPoolFilters } from "./filterCadastroIbcPool";

function ibc(overrides: Partial<IbcCadastroDTO> = {}): IbcCadastroDTO {
  return {
    id: "1",
    identificador: "HMS00001",
    tipoCadastro: "NOVO",
    aptidao: "APTO",
    motivoInaptidao: null,
    custodia: "PATIO",
    dataLimite: "2027-01-01",
    primeiraInspecaoEm: "2026-01-01T00:00:00.000Z",
    baixadoEm: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    produtoId: "prod-s",
    prefixo: "HMS",
    convertedToContainerId: null,
    ...overrides,
  };
}

const base: IbcPoolFilters = { busca: "", situacao: "todas", produtoId: "" };

describe("filterCadastroIbcPool", () => {
  const parque = [
    ibc(),
    ibc({ id: "2", identificador: "HMS00002", aptidao: "INAPTO", motivoInaptidao: "DATA_LIMITE" }),
    ibc({ id: "3", identificador: "NHMS00003", prefixo: "NHMS", primeiraInspecaoEm: null }),
    ibc({ id: "4", identificador: "HMS00004", baixadoEm: "2026-02-01T00:00:00.000Z" }),
    ibc({ id: "5", identificador: "HMS00005", convertedToContainerId: "novo", produtoId: "prod-c" }),
  ];

  it("matches the identifier regardless of case", () => {
    const found = filterCadastroIbcPool(parque, { ...base, busca: "nhms" });
    assert.deepEqual(found.map((item) => item.id), ["3"]);
  });

  it("keeps apt containers that are still in the active pool", () => {
    const found = filterCadastroIbcPool(parque, { ...base, situacao: "apto" });
    assert.deepEqual(found.map((item) => item.id), ["1", "3"]);
  });

  it("filters inapt, uninspected, non-homologated, written-off and replaced rows", () => {
    assert.deepEqual(
      filterCadastroIbcPool(parque, { ...base, situacao: "inapto" }).map((item) => item.id),
      ["2"],
    );
    assert.deepEqual(
      filterCadastroIbcPool(parque, { ...base, situacao: "sem_inspecao" }).map((item) => item.id),
      ["3"],
    );
    assert.deepEqual(
      filterCadastroIbcPool(parque, { ...base, situacao: "nao_homologado" }).map((item) => item.id),
      ["3"],
    );
    assert.deepEqual(
      filterCadastroIbcPool(
        [
          ibc({ id: "6", identificador: "NHS00001", prefixo: "NHS", homologado: false }),
          ibc({ id: "7", identificador: "NH00002", prefixo: "NH", homologado: false, universal: true }),
          ibc({ id: "8", identificador: "HMS00008", prefixo: "HMS", homologado: true }),
        ],
        { ...base, situacao: "nao_homologado" },
      ).map((item) => item.id),
      ["6", "7"],
    );
    assert.deepEqual(
      filterCadastroIbcPool(parque, { ...base, situacao: "baixado" }).map((item) => item.id),
      ["4"],
    );
    assert.deepEqual(
      filterCadastroIbcPool(parque, { ...base, situacao: "substituido" }).map((item) => item.id),
      ["5"],
    );
  });

  it("filters by product id", () => {
    const found = filterCadastroIbcPool(parque, { ...base, produtoId: "prod-c" });
    assert.deepEqual(found.map((item) => item.id), ["5"]);
  });
});
