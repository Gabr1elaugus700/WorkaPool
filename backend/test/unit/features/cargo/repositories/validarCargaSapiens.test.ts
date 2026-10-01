import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FakeSapiens } from "../../../../helpers/FakeSapiens";
import { Carga, SituacaoCarga } from "../../../../../src/features/cargo/entities/Carga";
import { PedidoRaw } from "../../../../../src/features/pedidos/types/PedidoRaw";

const buildRow = (overrides: Partial<PedidoRaw> = {}): PedidoRaw => ({
  NUM_PED: "305914",
  COD_CLI: "1",
  CLIENTE: "Cliente",
  CIDADE: "Cidade",
  ESTADO: "SP",
  VENDEDOR: "Rep",
  CODREP: 10,
  BLOQUEADO: "N",
  PESO: 100,
  PRODUTOS: "Produto",
  DERIVACAO: "UN",
  QUANTIDADE: 1,
  CODCAR: 382,
  POSCAR: 1,
  SITCAR: "0",
  QTD_ORI_PED: 1,
  ...overrides,
});

describe("FakeSapiens.validarCargaSapiens", () => {
  it("passa quando o pedido tem CODCAR > 0 (vínculo WorkaPool / usu_codcar)", async () => {
    const fake = new FakeSapiens({
      cargas: [
        new Carga({
          id: "c1",
          codCar: 382,
          destino: "SP",
          previsaoSaida: new Date(),
          createdAt: new Date(),
          situacao: SituacaoCarga.ABERTA,
          pesoMaximo: 10000,
        }),
      ],
      rows: [buildRow({ NUM_PED: "305914", CODCAR: 382 })],
    });

    assert.equal(await fake.validarCargaSapiens(305914), true);
  });

  it("falha quando o pedido existe mas CODCAR é 0 (não vinculado)", async () => {
    const fake = new FakeSapiens({
      cargas: [],
      rows: [buildRow({ NUM_PED: "305914", CODCAR: 0 })],
    });

    assert.equal(await fake.validarCargaSapiens(305914), false);
  });
});
