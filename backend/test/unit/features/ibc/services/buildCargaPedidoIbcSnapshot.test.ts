import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildCargaPedidoIbcSnapshot } from "../../../../../src/features/ibc/services/buildCargaPedidoIbcSnapshot";
import { mapRawToPedidos } from "../../../../../src/features/pedidos/mappers/PedidoMapper";
import {
  PedidoCargo,
  PedidoCargoProps,
} from "../../../../../src/features/pedidos/types/PedidoCargo.types";
import { PedidoRaw } from "../../../../../src/features/pedidos/types/PedidoRaw";

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
        posCar: null,
        gruposCodigo: [],
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
        posCar: null,
        gruposCodigo: [],
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

  it("records posCar from the Sapiens delivery order (#318)", () => {
    const snapshot = buildCargaPedidoIbcSnapshot([
      buildPedido("1008", {
        isContainer: true,
        quantidadeEsperadaTotal: 1,
        poscar: 3,
      }),
    ]);

    assert.equal(snapshot[0]?.posCar, 3);
  });

  it("keeps posCar null when Sapiens does not provide it (#318)", () => {
    const snapshot = buildCargaPedidoIbcSnapshot([
      buildPedido("1009", {
        isContainer: true,
        quantidadeEsperadaTotal: 1,
        poscar: null,
      }),
    ]);

    assert.equal(snapshot[0]?.posCar, null);
  });

  it("records posCar 0 from Sapiens as null (no delivery position) (#318)", () => {
    const snapshot = buildCargaPedidoIbcSnapshot([
      buildPedido("1010", {
        isContainer: true,
        quantidadeEsperadaTotal: 1,
        poscar: 0,
      }),
    ]);

    assert.equal(snapshot[0]?.posCar, null);
  });

  it("records the groups of the 251001 product lines only (#437)", () => {
    const linha = (
      derivacao: string,
      grupo: string | null,
      embalagem: number | null,
    ): PedidoRaw => ({
      NUM_PED: "1011",
      COD_CLI: "C-1011",
      CLIENTE: "Cliente 1011",
      CIDADE: "Blumenau",
      ESTADO: "SC",
      VENDEDOR: "Vendedor",
      CODREP: 1,
      BLOQUEADO: "N",
      PESO: 10,
      PRODUTOS: derivacao,
      DERIVACAO: derivacao,
      QUANTIDADE: embalagem === 251001 ? 1000 : 1,
      CODCAR: 1,
      POSCAR: 1,
      SITCAR: "A",
      QTD_ORI_PED: 1,
      COD_GRP: grupo,
      CODIGO_EMBALAGEM: embalagem,
      VOLUME_EMBALAGEM: 1000,
      INCLUSO: "S",
    });

    const snapshot = buildCargaPedidoIbcSnapshot(mapRawToPedidos([
      linha("001", "SODA", 251001),
      linha("002", "CLORO", 251001),
      linha("003", "BOMBONA", 20),
      linha("004", "SODA", 251001),
      linha("005", "  ", 251001),
    ]));

    assert.deepEqual(snapshot[0]?.gruposCodigo, ["SODA", "CLORO"]);
  });
});
