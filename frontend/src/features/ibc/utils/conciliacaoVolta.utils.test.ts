import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ConciliacaoViagemItemDTO, PedidoConciliacaoDTO } from "../types/conciliacaoViagem.types";
import { conciliacaoVolta } from "./conciliacaoVolta.utils";

function pedido(patch: Partial<PedidoConciliacaoDTO> & Pick<PedidoConciliacaoDTO, "numPed">): PedidoConciliacaoDTO {
  return {
    codCli: "10",
    cliente: "Alpha",
    incluso: false,
    quantidadeEsperada: 2,
    quantidadeApontada: 0,
    ...patch,
  };
}

function item(patch: Partial<ConciliacaoViagemItemDTO>): ConciliacaoViagemItemDTO {
  return {
    alocacaoIbcId: "a",
    ibcId: "i",
    identificador: "HM1",
    numPed: null,
    codCli: null,
    cliente: "",
    destino: null,
    modalidade: null,
    modalidadeSugerida: null,
    ibcEntradaId: null,
    ...patch,
  };
}

describe("conciliacaoVolta", () => {
  it("conta ficou e troca no pedido e ignora retorno e o total gravado", () => {
    const barras = conciliacaoVolta.barras(
      [pedido({ numPed: "10", quantidadeApontada: 9 }), pedido({ numPed: "20", quantidadeEsperada: 1 })],
      [
        item({ destino: "FICOU", numPed: "10" }),
        item({ alocacaoIbcId: "b", destino: "TROCA", numPed: "10" }),
        item({ alocacaoIbcId: "c", destino: "RETORNOU", numPed: "10" }),
        item({ alocacaoIbcId: "d", destino: "FICOU", numPed: null }),
        item({ alocacaoIbcId: "e", destino: null, numPed: "20" }),
      ],
    );
    assert.equal(barras[0]?.quantidadeApontada, 2);
    assert.equal(barras[1]?.quantidadeApontada, 0);
  });

  it("confirma só o pedido cuja barra não fechou o esperado", () => {
    const barras = [
      pedido({ numPed: "10", quantidadeEsperada: 2, quantidadeApontada: 2 }),
      pedido({ numPed: "20", quantidadeEsperada: 2, quantidadeApontada: 1 }),
      pedido({ numPed: "30", quantidadeEsperada: 1, quantidadeApontada: 3 }),
    ];
    assert.deepEqual(conciliacaoVolta.confirmacoes(barras), [{ numPed: "20" }, { numPed: "30" }]);
    assert.deepEqual(conciliacaoVolta.divergentes(barras).map((pedido) => pedido.numPed), ["20", "30"]);
  });
});
