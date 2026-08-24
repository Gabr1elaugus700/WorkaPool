import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { CloseCargaUseCase } from "../../../../../src/features/cargo/useCases/CloseCarga.use-case";
import { Carga, SituacaoCarga } from "../../../../../src/features/cargo/entities/Carga";
import { Pedido } from "../../../../../src/features/cargo/entities/Pedido";
import { ICargoRepository } from "../../../../../src/features/cargo/repositories/ICargoRepository";
import { PedidoService } from "../../../../../src/features/pedidos/services/PedidoService";
import { AppError } from "../../../../../src/utils/AppError";
import { Role } from "@prisma/client";

type CloseCargaRepositoryMock = Pick<
  ICargoRepository,
  | "getCargaByCodCar"
  | "getPedidosPorCarga"
  | "validarCargaSapiens"
  | "closeCarga"
  | "findUserById"
  | "findTruckById"
  | "findDespachoByCargaId"
>;

const mockPedidoService = {} as PedidoService;

const MOTORISTA_ID = "motorista-1";
const CAMINHAO_ID = "truck-1";
const FECHADO_POR_ID = "logistica-1";

const buildCarga = (
  codCar: number,
  situacao: SituacaoCarga = SituacaoCarga.ABERTA,
): Carga =>
  new Carga({
    id: `carga-${codCar}`,
    codCar,
    destino: "Blumenau",
    pesoMaximo: 10000,
    previsaoSaida: new Date("2026-03-25T10:00:00.000Z"),
    situacao,
  });

const buildPedido = (id: string, numPed: string): Pedido =>
  new Pedido({
    id,
    numPed,
    cliente: "Cliente Teste",
    cidade: "Blumenau",
    estado: "SC",
    vendedor: "Vendedor Teste",
    peso: 120,
    qtdOri: 1,
  });

const despachoInput = (codCar: number) => ({
  codCar,
  motoristaId: MOTORISTA_ID,
  caminhaoId: CAMINHAO_ID,
  fechadoPorId: FECHADO_POR_ID,
});

const buildHappyRepository = (
  carga: Carga,
  pedidos: Pedido[],
  overrides: Partial<CloseCargaRepositoryMock> = {},
): CloseCargaRepositoryMock => {
  const closedCarga = new Carga({
    ...carga,
    situacao: SituacaoCarga.FECHADA,
    closedAt: new Date("2026-08-24T12:00:00.000Z"),
  });

  return {
    getCargaByCodCar: mock.fn(async () => carga),
    getPedidosPorCarga: mock.fn(async () => pedidos),
    validarCargaSapiens: mock.fn(async () => true),
    findUserById: mock.fn(async (id: string) =>
      id === MOTORISTA_ID
        ? { id: MOTORISTA_ID, role: Role.MOTORISTA, name: "Motorista Teste" }
        : null,
    ),
    findTruckById: mock.fn(async (id: string) =>
      id === CAMINHAO_ID ? { id: CAMINHAO_ID, name: "Truck 01" } : null,
    ),
    findDespachoByCargaId: mock.fn(async () => null),
    closeCarga: mock.fn(async () => ({
      carga: closedCarga,
      pedidosSalvos: pedidos.length,
      despacho: {
        id: "despacho-1",
        cargaId: carga.id,
        motoristaId: MOTORISTA_ID,
        caminhaoId: CAMINHAO_ID,
        fechadoPorId: FECHADO_POR_ID,
        fechadoEm: new Date("2026-08-24T12:00:00.000Z"),
      },
    })),
    ...overrides,
  };
};

describe("CloseCargaUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("rejeita fechar carga sem motoristaId e caminhaoId; carga permanece ABERTA e sem CargaDespacho", async () => {
    const carga = buildCarga(101);
    const pedidos = [buildPedido("1", "1001")];
    const closeCarga = mock.fn(async () => {
      throw new Error("closeCarga não deve ser chamado");
    });

    const mockRepository = buildHappyRepository(carga, pedidos, { closeCarga });
    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: 101,
          fechadoPorId: FECHADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 400);
        assert.strictEqual(error.code, "CARGO_DESPACHO_REQUIRED");
        return true;
      },
    );

    assert.strictEqual(closeCarga.mock.calls.length, 0);
    assert.strictEqual(carga.situacao, SituacaoCarga.ABERTA);
  });

  it("fecha carga com MOTORISTA e Trucks válidos e cria CargaDespacho com auditoria", async () => {
    const carga = buildCarga(202);
    const pedidos = [buildPedido("1", "2001"), buildPedido("2", "2002")];
    const mockRepository = buildHappyRepository(carga, pedidos);
    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    const resultado = await useCase.execute(despachoInput(202));

    assert.strictEqual(resultado.carga.situacao, SituacaoCarga.FECHADA);
    assert.strictEqual(resultado.pedidosSalvos, 2);
    assert.ok(resultado.despacho);
    assert.strictEqual(resultado.despacho.motoristaId, MOTORISTA_ID);
    assert.strictEqual(resultado.despacho.caminhaoId, CAMINHAO_ID);
    assert.strictEqual(resultado.despacho.fechadoPorId, FECHADO_POR_ID);
    assert.ok(resultado.despacho.fechadoEm instanceof Date);

    const closeCall = mockRepository.closeCarga.mock.calls[0];
    assert.ok(closeCall);
    assert.deepStrictEqual(closeCall.arguments[0], {
      codCar: 202,
      motoristaId: MOTORISTA_ID,
      caminhaoId: CAMINHAO_ID,
      fechadoPorId: FECHADO_POR_ID,
    });
  });

  it("rejeita fechar carga já FECHADA (1:1 CargaDespacho)", async () => {
    const carga = buildCarga(404, SituacaoCarga.FECHADA);
    const pedidos = [buildPedido("1", "4001")];
    const closeCarga = mock.fn(async () => {
      throw new Error("closeCarga não deve ser chamado");
    });
    const mockRepository = buildHappyRepository(carga, pedidos, {
      closeCarga,
      findDespachoByCargaId: mock.fn(async () => ({
        id: "despacho-existente",
        cargaId: carga.id,
        motoristaId: MOTORISTA_ID,
        caminhaoId: CAMINHAO_ID,
        fechadoPorId: FECHADO_POR_ID,
        fechadoEm: new Date("2026-08-20T10:00:00.000Z"),
      })),
    });
    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    await assert.rejects(
      async () => useCase.execute(despachoInput(404)),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 409);
        assert.strictEqual(error.code, "CARGO_JA_FECHADA");
        return true;
      },
    );

    assert.strictEqual(closeCarga.mock.calls.length, 0);
  });

  it("rejeita motorista inexistente ou sem role MOTORISTA", async () => {
    const carga = buildCarga(505);
    const pedidos = [buildPedido("1", "5001")];
    const closeCarga = mock.fn(async () => {
      throw new Error("closeCarga não deve ser chamado");
    });
    const mockRepository = buildHappyRepository(carga, pedidos, {
      closeCarga,
      findUserById: mock.fn(async () => ({
        id: MOTORISTA_ID,
        role: Role.LOGISTICA,
        name: "Não motorista",
      })),
    });
    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    await assert.rejects(
      async () => useCase.execute(despachoInput(505)),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 400);
        assert.strictEqual(error.code, "CARGO_MOTORISTA_INVALIDO");
        return true;
      },
    );

    assert.strictEqual(closeCarga.mock.calls.length, 0);
  });

  it("rejeita caminhão (Trucks) inexistente", async () => {
    const carga = buildCarga(606);
    const pedidos = [buildPedido("1", "6001")];
    const closeCarga = mock.fn(async () => {
      throw new Error("closeCarga não deve ser chamado");
    });
    const mockRepository = buildHappyRepository(carga, pedidos, {
      closeCarga,
      findTruckById: mock.fn(async () => null),
    });
    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    await assert.rejects(
      async () => useCase.execute(despachoInput(606)),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 404);
        assert.strictEqual(error.code, "CARGO_CAMINHAO_NAO_ENCONTRADO");
        return true;
      },
    );

    assert.strictEqual(closeCarga.mock.calls.length, 0);
  });

  it("deve lançar erro com todos os pedidos sem carga no Sapiens", async () => {
    const carga = buildCarga(101);
    const pedidos = [
      buildPedido("1", "1001"),
      buildPedido("2", "1002"),
      buildPedido("3", "1003"),
    ];
    const closeCarga = mock.fn(async () => {
      throw new Error("closeCarga não deve ser chamado");
    });
    const mockRepository = buildHappyRepository(carga, pedidos, {
      closeCarga,
      validarCargaSapiens: mock.fn(async (numPed: number) => numPed === 1002),
    });
    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    await assert.rejects(
      async () => useCase.execute(despachoInput(101)),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(
          error.message,
          "Os seguintes pedidos não estão vinculados a nenhuma carga no sistema Sapiens: 1001, 1003",
        );
        assert.strictEqual(error.code, "CARGO_PEDIDOS_FORA_DO_SAPIENS");
        return true;
      },
    );

    assert.strictEqual(mockRepository.validarCargaSapiens.mock.calls.length, 3);
    assert.strictEqual(closeCarga.mock.calls.length, 0);
  });

  it("deve fechar a carga quando todos os pedidos estão vinculados no Sapiens", async () => {
    const carga = buildCarga(202);
    const pedidos = [buildPedido("1", "2001"), buildPedido("2", "2002")];
    const mockRepository = buildHappyRepository(carga, pedidos);
    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    const resultado = await useCase.execute(despachoInput(202));

    assert.strictEqual(mockRepository.validarCargaSapiens.mock.calls.length, 2);
    assert.strictEqual(mockRepository.closeCarga.mock.calls.length, 1);
    assert.strictEqual(resultado.pedidosSalvos, 2);
    assert.deepStrictEqual(resultado.pedidosSemCargaSapiens, []);
    assert.strictEqual(resultado.carga.codCar, 202);
  });

  it("deve retornar erro quando um pedido da lista está com situação 1 no Sapiens", async () => {
    const carga = buildCarga(303);
    const pedidos = [buildPedido("1", "3001"), buildPedido("2", "3002")];
    const closeCarga = mock.fn(async () => {
      throw new Error("closeCarga não deve ser chamado");
    });
    const mockRepository = buildHappyRepository(carga, pedidos, {
      closeCarga,
      validarCargaSapiens: mock.fn(async (numPed: number) => numPed !== 3001),
    });
    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    await assert.rejects(
      async () => useCase.execute(despachoInput(303)),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(
          error.message,
          "Os seguintes pedidos não estão vinculados a nenhuma carga no sistema Sapiens: 3001",
        );
        assert.strictEqual(error.code, "CARGO_PEDIDOS_FORA_DO_SAPIENS");
        return true;
      },
    );

    assert.strictEqual(mockRepository.validarCargaSapiens.mock.calls.length, 2);
    assert.strictEqual(closeCarga.mock.calls.length, 0);
  });
});
