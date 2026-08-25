import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import {
  Carga,
  SituacaoCarga,
} from "../../../../../src/features/cargo/entities/Carga";
import { UpdatePedidoCargaUseCase } from "../../../../../src/features/cargo/useCases/UpdatePedidoCarga.use-case";
import { AppError } from "../../../../../src/utils/AppError";
import { PedidoRaw } from "../../../../../src/features/pedidos/types/PedidoRaw";
import { FakeSapiens } from "../../../../helpers/FakeSapiens";

const buildRow = (overrides: Partial<PedidoRaw> = {}): PedidoRaw => ({
  NUM_PED: "1001",
  COD_CLI: "C1",
  CLIENTE: "Cliente Teste",
  CIDADE: "Blumenau",
  ESTADO: "SC",
  VENDEDOR: "Vendedor Teste",
  CODREP: 1,
  BLOQUEADO: "N",
  PESO: 100,
  PRODUTOS: "Produto",
  DERIVACAO: "001",
  QUANTIDADE: 1,
  CODCAR: 0,
  POSCAR: 0,
  SITCAR: "",
  QTD_ORI_PED: 1,
  ...overrides,
});

describe("UpdatePedidoCargaUseCase capacity by Role", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("rejects VENDAS when full-sum allocation exceeds pesoMaximo", async () => {
    const carga = new Carga({
      id: "carga-10",
      codCar: 10,
      destino: "Blumenau",
      pesoMaximo: 1000,
      previsaoSaida: new Date("2026-08-20T10:00:00.000Z"),
      situacao: SituacaoCarga.ABERTA,
    });

    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [
        // Occupied full-sum 900 on the Carga
        buildRow({
          NUM_PED: "2002",
          DERIVACAO: "001",
          PESO: 400,
          CODCAR: 10,
          POSCAR: 1,
        }),
        buildRow({
          NUM_PED: "2002",
          DERIVACAO: "002",
          PESO: 500,
          CODCAR: 10,
          POSCAR: 1,
        }),
        // Pedido to allocate: full-sum 150 (solto)
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "001",
          PESO: 80,
          CODCAR: 0,
          POSCAR: 0,
        }),
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "002",
          PESO: 70,
          CODCAR: 0,
          POSCAR: 0,
        }),
      ],
    });

    const useCase = new UpdatePedidoCargaUseCase(fakeSapiens, fakeSapiens);

    await assert.rejects(
      () => useCase.execute(3003, 10, 2, Role.VENDAS),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "CARGO_CAPACIDADE_EXCEDIDA");
        assert.strictEqual(error.statusCode, 422);
        return true;
      },
    );

    const pedidosNaCarga = await fakeSapiens.getPedidosByCarga(10);
    assert.equal(
      pedidosNaCarga.some((pedido) => pedido.numPed === "3003"),
      false,
    );
    assert.strictEqual(
      fakeSapiens.getWriteCounts().pedidosCargaAtualizados,
      0,
    );
  });

  it("allows VENDAS when full-sum weight fits exactly", async () => {
    const carga = new Carga({
      id: "carga-11",
      codCar: 11,
      destino: "Blumenau",
      pesoMaximo: 1000,
      previsaoSaida: new Date("2026-08-20T10:00:00.000Z"),
      situacao: SituacaoCarga.ABERTA,
    });

    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [
        // Occupied full-sum 850
        buildRow({
          NUM_PED: "2002",
          DERIVACAO: "001",
          PESO: 450,
          CODCAR: 11,
          POSCAR: 1,
        }),
        buildRow({
          NUM_PED: "2002",
          DERIVACAO: "002",
          PESO: 400,
          CODCAR: 11,
          POSCAR: 1,
        }),
        // Pedido full-sum 150
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "001",
          PESO: 100,
          CODCAR: 0,
          POSCAR: 0,
        }),
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "002",
          PESO: 50,
          CODCAR: 0,
          POSCAR: 0,
        }),
      ],
    });

    const useCase = new UpdatePedidoCargaUseCase(fakeSapiens, fakeSapiens);

    await useCase.execute(3003, 11, 2, Role.VENDAS);

    const pedidosNaCarga = await fakeSapiens.getPedidosByCarga(11);
    assert.equal(
      pedidosNaCarga.some((pedido) => pedido.numPed === "3003"),
      true,
    );
  });

  it("allows privileged actor to allocate beyond pesoMaximo", async () => {
    const carga = new Carga({
      id: "carga-12",
      codCar: 12,
      destino: "Blumenau",
      pesoMaximo: 1000,
      previsaoSaida: new Date("2026-08-20T10:00:00.000Z"),
      situacao: SituacaoCarga.ABERTA,
    });

    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [
        buildRow({
          NUM_PED: "2002",
          DERIVACAO: "001",
          PESO: 400,
          CODCAR: 12,
          POSCAR: 1,
        }),
        buildRow({
          NUM_PED: "2002",
          DERIVACAO: "002",
          PESO: 500,
          CODCAR: 12,
          POSCAR: 1,
        }),
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "001",
          PESO: 80,
          CODCAR: 0,
          POSCAR: 0,
        }),
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "002",
          PESO: 70,
          CODCAR: 0,
          POSCAR: 0,
        }),
      ],
    });

    const useCase = new UpdatePedidoCargaUseCase(fakeSapiens, fakeSapiens);

    await useCase.execute(3003, 12, 2, Role.LOGISTICA);

    const pedidosNaCarga = await fakeSapiens.getPedidosByCarga(12);
    assert.equal(
      pedidosNaCarga.some((pedido) => pedido.numPed === "3003"),
      true,
    );
  });

  it("skips capacity validation when removing Pedido to solto", async () => {
    const carga = new Carga({
      id: "carga-13",
      codCar: 13,
      destino: "Blumenau",
      pesoMaximo: 1000,
      previsaoSaida: new Date("2026-08-20T10:00:00.000Z"),
      situacao: SituacaoCarga.ABERTA,
    });

    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "001",
          PESO: 80,
          CODCAR: 13,
          POSCAR: 1,
        }),
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "002",
          PESO: 70,
          CODCAR: 13,
          POSCAR: 1,
        }),
      ],
    });

    const useCase = new UpdatePedidoCargaUseCase(fakeSapiens, fakeSapiens);

    await useCase.execute(3003, 0, 0, Role.VENDAS);

    const pedidosNaCarga = await fakeSapiens.getPedidosByCarga(13);
    assert.equal(
      pedidosNaCarga.some((pedido) => pedido.numPed === "3003"),
      false,
    );
  });

  it("rejects multi-item Pedido using full sum not first item", async () => {
    const carga = new Carga({
      id: "carga-14",
      codCar: 14,
      destino: "Blumenau",
      pesoMaximo: 1000,
      previsaoSaida: new Date("2026-08-20T10:00:00.000Z"),
      situacao: SituacaoCarga.ABERTA,
    });

    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [
        // Remaining capacity 80 (occupied 920)
        buildRow({
          NUM_PED: "2002",
          DERIVACAO: "001",
          PESO: 920,
          CODCAR: 14,
          POSCAR: 1,
        }),
        // Pedido items 40 + 50 = 90 (first item 40 would wrongly fit)
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "001",
          PESO: 40,
          CODCAR: 0,
          POSCAR: 0,
        }),
        buildRow({
          NUM_PED: "3003",
          DERIVACAO: "002",
          PESO: 50,
          CODCAR: 0,
          POSCAR: 0,
        }),
      ],
    });

    const useCase = new UpdatePedidoCargaUseCase(fakeSapiens, fakeSapiens);

    await assert.rejects(
      () => useCase.execute(3003, 14, 2, Role.VENDAS),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "CARGO_CAPACIDADE_EXCEDIDA");
        return true;
      },
    );

    assert.strictEqual(
      fakeSapiens.getWriteCounts().pedidosCargaAtualizados,
      0,
    );
  });
});
