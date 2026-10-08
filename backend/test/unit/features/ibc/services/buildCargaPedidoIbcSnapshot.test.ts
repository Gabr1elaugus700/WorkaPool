import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildCargaPedidoIbcSnapshot } from "../../../../../src/features/ibc/services/buildCargaPedidoIbcSnapshot";
import {
  PedidoCargo,
  PedidoCargoProps,
} from "../../../../../src/features/pedidos/types/PedidoCargo.types";

const buildPedido = (
  numPed: string,
  overrides: Partial<PedidoCargoProps> = {},
): PedidoCargo =>
  new PedidoCargo({
    id: numPed,
    numPed,
    codCli: `C-${numPed}`,
    cliente: `Cliente ${numPed}`,
    cidade: "Blumenau",
    vendedor: "Vendedor",
    peso: 100,
    qtdOri: 1,
    ...overrides,
  });

describe("buildCargaPedidoIbcSnapshot (#295)", () => {
  it("records a valid 251001 pedido with total, venda and emprestimo", () => {
    const snapshot = buildCargaPedidoIbcSnapshot([
      buildPedido("1001", {
        isContainer: true,
        quantidadeEsperadaTotal: 5,
        quantidadeEsperadaVenda: 3,
        quantidadeEsperadaEmprestimo: 2,
      }),
    ]);

    assert.deepEqual(snapshot, [
      {
        numPed: "1001",
        codCli: "C-1001",
        cliente: "Cliente 1001",
        quantidadeEsperadaTotal: 5,
        quantidadeEsperadaVenda: 3,
        quantidadeEsperadaEmprestimo: 2,
        ibcInvalido: false,
      },
    ]);
  });

  it("records a Pedido IBC inválido with ibcInvalido true and zero quantities", () => {
    const snapshot = buildCargaPedidoIbcSnapshot([
      buildPedido("1002", { ibcInvalido: true }),
    ]);

    assert.deepEqual(snapshot, [
      {
        numPed: "1002",
        codCli: "C-1002",
        cliente: "Cliente 1002",
        quantidadeEsperadaTotal: 0,
        quantidadeEsperadaVenda: 0,
        quantidadeEsperadaEmprestimo: 0,
        ibcInvalido: true,
      },
    ]);
  });

  it("skips pedidos without the 251001 signal", () => {
    const snapshot = buildCargaPedidoIbcSnapshot([
      buildPedido("1003"),
      buildPedido("1004", { isContainer: true, quantidadeEsperadaTotal: 1 }),
    ]);

    assert.deepEqual(
      snapshot.map((item) => item.numPed),
      ["1004"],
    );
  });

  it("returns an empty list when the carga has no IBC", () => {
    assert.deepEqual(buildCargaPedidoIbcSnapshot([buildPedido("1005")]), []);
    assert.deepEqual(buildCargaPedidoIbcSnapshot([]), []);
  });

  it("collapses repeated rows of the same pedido into one record", () => {
    const snapshot = buildCargaPedidoIbcSnapshot([
      buildPedido("1006", { isContainer: true, quantidadeEsperadaTotal: 2 }),
      buildPedido("1006", { isContainer: true, quantidadeEsperadaTotal: 2 }),
    ]);

    assert.equal(snapshot.length, 1);
    assert.equal(snapshot[0]?.numPed, "1006");
  });

  it("keeps codCli null when Sapiens does not provide it", () => {
    const snapshot = buildCargaPedidoIbcSnapshot([
      buildPedido("1007", {
        codCli: undefined,
        isContainer: true,
        quantidadeEsperadaTotal: 1,
      }),
    ]);

    assert.equal(snapshot[0]?.codCli, null);
  });
});
