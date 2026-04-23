"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const CloseCarga_use_case_1 = require("../../../../../src/features/cargo/useCases/CloseCarga.use-case");
const Carga_1 = require("../../../../../src/features/cargo/entities/Carga");
const Pedido_1 = require("../../../../../src/features/cargo/entities/Pedido");
const buildCarga = (codCar) => new Carga_1.Carga({
    id: "carga-1",
    codCar,
    destino: "Blumenau",
    pesoMaximo: 10000,
    previsaoSaida: new Date("2026-03-25T10:00:00.000Z"),
    situacao: Carga_1.SituacaoCarga.ABERTA,
});
const buildPedido = (id, numPed) => new Pedido_1.Pedido({
    id,
    numPed,
    cliente: "Cliente Teste",
    cidade: "Blumenau",
    estado: "SC",
    vendedor: "Vendedor Teste",
    peso: 120,
    qtdOri: 1,
});
(0, node_test_1.describe)("CloseCargaUseCase", () => {
    (0, node_test_1.after)(async () => {
        // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setTimeout(resolve, 100));
    });
    (0, node_test_1.it)("deve lançar erro com todos os pedidos sem carga no Sapiens", async () => {
        // Arrange
        const carga = buildCarga(101);
        const pedidos = [
            buildPedido("1", "1001"),
            buildPedido("2", "1002"),
            buildPedido("3", "1003"),
        ];
        const getCargaByCodCar = node_test_1.mock.fn(async () => carga);
        const getPedidosPorCarga = node_test_1.mock.fn(async () => pedidos);
        const closeCarga = node_test_1.mock.fn(async () => ({ carga, pedidosSalvos: pedidos.length }));
        const validarCargaSapiens = node_test_1.mock.fn(async (numPed) => numPed === 1002);
        const mockRepository = {
            getCargaByCodCar,
            getPedidosPorCarga,
            closeCarga,
            validarCargaSapiens,
        };
        const useCase = new CloseCarga_use_case_1.CloseCargaUseCase(mockRepository, {});
        // Act + Assert
        await strict_1.default.rejects(async () => useCase.execute(101), (error) => {
            strict_1.default.match(error.message, /Os seguintes pedidos não estão vinculados a nenhuma carga no sistema Sapiens: 1001, 1003/);
            return true;
        });
        strict_1.default.strictEqual(validarCargaSapiens.mock.calls.length, 3);
        strict_1.default.strictEqual(closeCarga.mock.calls.length, 0);
    });
    (0, node_test_1.it)("deve fechar a carga quando todos os pedidos estão vinculados no Sapiens", async () => {
        // Arrange
        const carga = buildCarga(202);
        const pedidos = [buildPedido("1", "2001"), buildPedido("2", "2002")];
        const getCargaByCodCar = node_test_1.mock.fn(async () => carga);
        const getPedidosPorCarga = node_test_1.mock.fn(async () => pedidos);
        const closeCarga = node_test_1.mock.fn(async () => ({ carga, pedidosSalvos: pedidos.length }));
        const validarCargaSapiens = node_test_1.mock.fn(async () => true);
        const mockRepository = {
            getCargaByCodCar,
            getPedidosPorCarga,
            closeCarga,
            validarCargaSapiens,
        };
        const useCase = new CloseCarga_use_case_1.CloseCargaUseCase(mockRepository, {});
        // Act
        const resultado = await useCase.execute(202);
        // Assert
        strict_1.default.strictEqual(validarCargaSapiens.mock.calls.length, 2);
        strict_1.default.strictEqual(closeCarga.mock.calls.length, 1);
        strict_1.default.strictEqual(resultado.pedidosSalvos, 2);
        strict_1.default.deepStrictEqual(resultado.pedidosSemCargaSapiens, []);
        strict_1.default.strictEqual(resultado.carga.codCar, 202);
    });
    (0, node_test_1.it)("deve retornar erro quando um pedido da lista está com situação 1 no Sapiens", async () => {
        // Arrange
        const carga = buildCarga(303);
        const pedidos = [buildPedido("1", "3001"), buildPedido("2", "3002")];
        const getCargaByCodCar = node_test_1.mock.fn(async () => carga);
        const getPedidosPorCarga = node_test_1.mock.fn(async () => pedidos);
        const closeCarga = node_test_1.mock.fn(async () => ({ carga, pedidosSalvos: pedidos.length }));
        const validarCargaSapiens = node_test_1.mock.fn(async (numPed) => numPed !== 3001);
        const mockRepository = {
            getCargaByCodCar,
            getPedidosPorCarga,
            closeCarga,
            validarCargaSapiens,
        };
        const useCase = new CloseCarga_use_case_1.CloseCargaUseCase(mockRepository, {});
        // Act + Assert
        await strict_1.default.rejects(async () => useCase.execute(303), (error) => {
            strict_1.default.match(error.message, /Os seguintes pedidos não estão vinculados a nenhuma carga no sistema Sapiens: 3001/);
            return true;
        });
        strict_1.default.strictEqual(validarCargaSapiens.mock.calls.length, 2);
        strict_1.default.strictEqual(closeCarga.mock.calls.length, 0);
    });
});
