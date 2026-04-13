"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const PedidoService_1 = require("../../../../../src/features/pedidos/services/PedidoService");
const Pedido_1 = require("../../../../../src/features/cargo/entities/Pedido");
(0, node_test_1.describe)('PedidoService', () => {
    (0, node_test_1.after)(async () => {
        // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setTimeout(resolve, 100));
    });
    (0, node_test_1.describe)('getUltimoHistoricoPeso', () => {
        (0, node_test_1.it)('deve retornar o peso do histórico quando existe', async () => {
            // Arrange
            const mockGetLastHistorico = node_test_1.mock.fn(async () => ({
                peso: 1500,
                codCar: 123,
                numPed: 456,
                createdAt: new Date(),
            }));
            const mockRepository = {
                getLastHistoricoPeso: mockGetLastHistorico,
            };
            const service = new PedidoService_1.PedidoService(mockRepository);
            const pedido = new Pedido_1.Pedido({
                id: '1',
                numPed: '456',
                cliente: 'Cliente Teste',
                cidade: 'São Paulo',
                estado: 'SP',
                vendedor: 'Vendedor Teste',
                peso: 1000,
                qtdOri: 10,
            });
            // Act
            const resultado = await service.getUltimoHistoricoPeso(pedido);
            // Assert
            strict_1.default.strictEqual(resultado?.peso, 1500);
            strict_1.default.strictEqual(mockGetLastHistorico.mock.calls.length, 1);
            // @ts-expect-error - mock.calls typing issue
            strict_1.default.strictEqual(mockGetLastHistorico.mock.calls[0].arguments[0], 456);
        });
        (0, node_test_1.it)('deve retornar null quando não existe histórico', async () => {
            // Arrange
            const mockGetLastHistorico = node_test_1.mock.fn(async () => null);
            const mockRepository = {
                getLastHistoricoPeso: mockGetLastHistorico,
            };
            const service = new PedidoService_1.PedidoService(mockRepository);
            const pedido = new Pedido_1.Pedido({
                id: '2',
                numPed: '789',
                cliente: 'Cliente Teste 2',
                cidade: 'Rio de Janeiro',
                estado: 'RJ',
                vendedor: 'Vendedor Teste 2',
                peso: 2000,
                qtdOri: 20,
            });
            // Act
            const resultado = await service.getUltimoHistoricoPeso(pedido);
            // Assert
            strict_1.default.strictEqual(resultado, null);
            strict_1.default.strictEqual(mockGetLastHistorico.mock.calls.length, 1);
            // @ts-expect-error - mock.calls typing issue
            strict_1.default.strictEqual(mockGetLastHistorico.mock.calls[0].arguments[0], 789);
        });
        (0, node_test_1.it)('deve converter numPed de string para number corretamente', async () => {
            // Arrange
            const mockGetLastHistorico = node_test_1.mock.fn(async () => ({
                peso: 3500,
                codCar: 999,
                numPed: 12345,
                createdAt: new Date(),
            }));
            const mockRepository = {
                getLastHistoricoPeso: mockGetLastHistorico,
            };
            const service = new PedidoService_1.PedidoService(mockRepository);
            const pedido = new Pedido_1.Pedido({
                id: '3',
                numPed: '12345', // String
                cliente: 'Cliente Teste 3',
                cidade: 'Belo Horizonte',
                estado: 'MG',
                vendedor: 'Vendedor Teste 3',
                peso: 3000,
                qtdOri: 15,
            });
            // Act
            const resultado = await service.getUltimoHistoricoPeso(pedido);
            // Assert
            strict_1.default.ok(resultado, 'Resultado não deveria ser null');
            strict_1.default.strictEqual(resultado.peso, 3500);
            strict_1.default.strictEqual(mockGetLastHistorico.mock.calls.length, 1);
            // Verifica que o número foi convertido corretamente
            // @ts-expect-error - mock.calls typing issue
            strict_1.default.strictEqual(mockGetLastHistorico.mock.calls[0].arguments[0], 12345);
            // @ts-expect-error - mock.calls typing issue
            strict_1.default.strictEqual(typeof mockGetLastHistorico.mock.calls[0].arguments[0], 'number');
        });
    });
});
