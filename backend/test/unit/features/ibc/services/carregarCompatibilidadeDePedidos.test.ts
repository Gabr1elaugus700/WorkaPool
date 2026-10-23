import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  carregarCompatibilidadeDePedidos,
  PedidoParaCompatibilidade,
} from "../../../../../src/features/ibc/services/carregarCompatibilidadeDePedidos";

function pedido(
  numPed: string,
  gruposCodigo: string[],
  overrides: Partial<PedidoParaCompatibilidade> = {},
): PedidoParaCompatibilidade {
  return {
    numPed,
    gruposCodigo,
    ibcInvalido: false,
    quantidadeEsperadaTotal: 1,
    quantidadeEsperadaVenda: 1,
    quantidadeEsperadaEmprestimo: 0,
    ...overrides,
  };
}

describe("carregarCompatibilidadeDePedidos", () => {
  it("não consulta configuração quando nenhum pedido elegível tem grupo", async () => {
    const listGruposConfigurados = mock.fn(async () => ["SODA"]);
    const result = await carregarCompatibilidadeDePedidos(
      [pedido("1", [])],
      { listGruposConfigurados },
    );
    assert.deepEqual(result, { gruposPermitidos: [], avisos: [] });
    assert.equal(listGruposConfigurados.mock.calls.length, 0);
  });

  it("une grupos configurados e avisa uma vez o pedido com grupo sem configuração", async () => {
    const listGruposConfigurados = mock.fn(async () => ["SODA", "ACIDO"]);
    const result = await carregarCompatibilidadeDePedidos(
      [
        pedido("10", ["SODA", "SEM"]),
        pedido("11", ["ACIDO", "SEM"]),
        pedido("12", ["CLORO"], {
          quantidadeEsperadaVenda: 1,
          quantidadeEsperadaEmprestimo: 1,
        }),
        pedido("13", ["NUNCA"], {
          ibcInvalido: true,
          quantidadeEsperadaTotal: 0,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 0,
        }),
      ],
      { listGruposConfigurados },
    );

    assert.deepEqual(result.gruposPermitidos, ["SODA", "ACIDO"]);
    assert.deepEqual(
      result.avisos.map((aviso) => aviso.numPed),
      ["10", "11"],
    );
    assert.deepEqual(result.avisos[0]?.gruposCodigo, ["SEM"]);
    assert.deepEqual(result.avisos[1]?.gruposCodigo, ["SEM"]);
    assert.equal(result.avisos[0]?.code, "IBC_PEDIDO_GRUPO_SEM_CONFIG");
    assert.deepEqual(listGruposConfigurados.mock.calls[0]?.arguments[0], [
      "SODA",
      "SEM",
      "ACIDO",
    ]);
  });
});
