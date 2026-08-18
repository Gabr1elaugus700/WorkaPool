import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { CloseCargaUseCase } from "../../../../../src/features/cargo/useCases/CloseCarga.use-case";
import { Carga, SituacaoCarga } from "../../../../../src/features/cargo/entities/Carga";
import { Pedido } from "../../../../../src/features/cargo/entities/Pedido";
import { ICargoRepository } from "../../../../../src/features/cargo/repositories/ICargoRepository";
import { PedidoService } from "../../../../../src/features/pedidos/services/PedidoService";
import { AppError } from "../../../../../src/utils/AppError";

type CloseCargaRepositoryMock = Pick<
  ICargoRepository,
  "getCargaByCodCar" | "getPedidosPorCarga" | "validarCargaSapiens" | "closeCarga"
>;

const mockPedidoService = {} as PedidoService;

const buildCarga = (codCar: number): Carga =>
  new Carga({
    id: "carga-1",
    codCar,
    destino: "Blumenau",
    pesoMaximo: 10000,
    previsaoSaida: new Date("2026-03-25T10:00:00.000Z"),
    situacao: SituacaoCarga.ABERTA,
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

describe("CloseCargaUseCase", () => {
  after(async () => {
    // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("deve lançar erro com todos os pedidos sem carga no Sapiens", async () => {
    // Arrange
    const carga = buildCarga(101);
    const pedidos = [
      buildPedido("1", "1001"),
      buildPedido("2", "1002"),
      buildPedido("3", "1003"),
    ];

    const getCargaByCodCar = mock.fn(async () => carga);
    const getPedidosPorCarga = mock.fn(async () => pedidos);
    const validarCargaSapiens = mock.fn(async (numPed: number) => numPed === 1002);
    const closeCarga = mock.fn(async () => ({ carga, pedidosSalvos: pedidos.length }));

    const mockRepository: CloseCargaRepositoryMock = {
      getCargaByCodCar,
      getPedidosPorCarga,
      validarCargaSapiens,
      closeCarga,
    };

    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    // Act + Assert
    await assert.rejects(
      async () => useCase.execute(101),
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

    assert.strictEqual(validarCargaSapiens.mock.calls.length, 3);
    assert.strictEqual(closeCarga.mock.calls.length, 0);
  });

  it("deve fechar a carga quando todos os pedidos estão vinculados no Sapiens", async () => {
    // Arrange
    const carga = buildCarga(202);
    const pedidos = [buildPedido("1", "2001"), buildPedido("2", "2002")];

    const getCargaByCodCar = mock.fn(async () => carga);
    const getPedidosPorCarga = mock.fn(async () => pedidos);
    const validarCargaSapiens = mock.fn(async () => true);
    const closeCarga = mock.fn(async () => ({ carga, pedidosSalvos: pedidos.length }));

    const mockRepository: CloseCargaRepositoryMock = {
      getCargaByCodCar,
      getPedidosPorCarga,
      validarCargaSapiens,
      closeCarga,
    };

    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    // Act
    const resultado = await useCase.execute(202);

    // Assert
    assert.strictEqual(validarCargaSapiens.mock.calls.length, 2);
    assert.strictEqual(closeCarga.mock.calls.length, 1);
    assert.strictEqual(resultado.pedidosSalvos, 2);
    assert.deepStrictEqual(resultado.pedidosSemCargaSapiens, []);
    assert.strictEqual(resultado.carga.codCar, 202);
  });

  it("deve retornar erro quando um pedido da lista está com situação 1 no Sapiens", async () => {
    // Arrange
    const carga = buildCarga(303);
    const pedidos = [buildPedido("1", "3001"), buildPedido("2", "3002")];

    const getCargaByCodCar = mock.fn(async () => carga);
    const getPedidosPorCarga = mock.fn(async () => pedidos);
    const validarCargaSapiens = mock.fn(async (numPed: number) => numPed !== 3001);
    const closeCarga = mock.fn(async () => ({ carga, pedidosSalvos: pedidos.length }));

    const mockRepository: CloseCargaRepositoryMock = {
      getCargaByCodCar,
      getPedidosPorCarga,
      validarCargaSapiens,
      closeCarga,
    };

    const useCase = new CloseCargaUseCase(
      mockRepository as ICargoRepository,
      mockPedidoService,
    );

    // Act + Assert
    await assert.rejects(
      async () => useCase.execute(303),
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

    assert.strictEqual(validarCargaSapiens.mock.calls.length, 2);
    assert.strictEqual(closeCarga.mock.calls.length, 0);
  });
});
