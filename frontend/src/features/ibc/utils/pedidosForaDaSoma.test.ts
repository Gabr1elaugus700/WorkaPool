import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PedidoIbcPreparacaoDTO } from "../types/ibcExpedicao.types";
import { separarPedidosForaDaSoma } from "./pedidosForaDaSoma";

function pedido(
  numPed: string,
  overrides: Partial<PedidoIbcPreparacaoDTO> = {},
): PedidoIbcPreparacaoDTO {
  return {
    numPed,
    cliente: "Cliente",
    quantidadeAlocada: 0,
    quantidadeEsperadaTotal: 2,
    quantidadeEsperadaVenda: 2,
    quantidadeEsperadaEmprestimo: 0,
    ibcInvalido: false,
    alocacoes: [],
    ...overrides,
  };
}

describe("separarPedidosForaDaSoma", () => {
  it("deixa o pedido misto e o inválido fora da soma, e o elegível de fora da lista", () => {
    const { mistos, invalidos } = separarPedidosForaDaSoma([
      pedido("1120"),
      pedido("9000", {
        quantidadeEsperadaTotal: 6,
        quantidadeEsperadaVenda: 3,
        quantidadeEsperadaEmprestimo: 3,
      }),
      pedido("1121", {
        ibcInvalido: true,
        quantidadeEsperadaTotal: 0,
        quantidadeEsperadaVenda: 0,
        quantidadeEsperadaEmprestimo: 0,
      }),
    ]);

    assert.deepEqual(
      mistos.map((item) => item.numPed),
      ["9000"],
    );
    assert.deepEqual(
      invalidos.map((item) => item.numPed),
      ["1121"],
    );
  });

  it("não trata só venda ou só empréstimo como misto", () => {
    const { mistos, invalidos } = separarPedidosForaDaSoma([
      pedido("1", { quantidadeEsperadaVenda: 2, quantidadeEsperadaEmprestimo: 0 }),
      pedido("2", {
        quantidadeEsperadaTotal: 1,
        quantidadeEsperadaVenda: 0,
        quantidadeEsperadaEmprestimo: 1,
      }),
    ]);

    assert.equal(mistos.length, 0);
    assert.equal(invalidos.length, 0);
  });
});
