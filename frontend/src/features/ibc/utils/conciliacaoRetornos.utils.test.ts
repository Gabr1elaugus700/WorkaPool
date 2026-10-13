import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ConciliacaoViagemItemDTO } from "../types/conciliacaoViagem.types";
import { conciliacaoRetornos } from "./conciliacaoRetornos.utils";

function item(patch: Partial<ConciliacaoViagemItemDTO>): ConciliacaoViagemItemDTO {
  return {
    alocacaoIbcId: "a",
    ibcId: "i",
    identificador: "HM1",
    numPed: "1",
    codCli: "10",
    cliente: "Alpha",
    destino: "TROCA",
    modalidade: null,
    modalidadeSugerida: null,
    ibcEntradaId: null,
    ...patch,
  };
}

describe("conciliacaoRetornos", () => {
  it("conta só as trocas do mesmo cliente", () => {
    const itens = [
      item({}),
      item({ alocacaoIbcId: "b", destino: "RETORNOU" }),
      item({ alocacaoIbcId: "c", codCli: "11", cliente: "Beta" }),
    ];
    assert.equal(conciliacaoRetornos.contarTrocas(itens, { codCli: "10", cliente: "Alpha" }), 1);
    assert.equal(conciliacaoRetornos.contarTrocas(itens, { codCli: null, cliente: "Alpha" }), 0);
  });

  it("aceita inteiro de 0 a 999 e recusa vazio ou decimal", () => {
    assert.equal(conciliacaoRetornos.lerQuantidadePapel(""), null);
    assert.equal(conciliacaoRetornos.lerQuantidadePapel("0"), 0);
    assert.equal(conciliacaoRetornos.lerQuantidadePapel("12"), 12);
    assert.equal(conciliacaoRetornos.lerQuantidadePapel("1.5"), null);
    assert.equal(conciliacaoRetornos.lerQuantidadePapel("1000"), null);
  });
});
