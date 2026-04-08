import { describe, it, mock, after } from 'node:test';
import assert from 'node:assert/strict';
import { PedidoService } from '../../../../../src/features/pedidos/services/PedidoService';
import { Pedido } from '../../../../../src/features/cargo/entities/Pedido';
import { IPedidosRepository } from '../../../../../src/features/pedidos/repositories/IPedidosRepository';

describe('PedidoService', () => {
  after(async () => {
    // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('getUltimoHistoricoPeso', () => {
    it('deve retornar o peso do histórico quando existe', async () => {
      // Arrange
      const mockGetLastHistorico = mock.fn(async () => ({
        peso: 1500,
        codCar: 123,
        numPed: 456,
        createdAt: new Date(),
      }));

      const mockRepository: IPedidosRepository = {
        getLastHistoricoPeso: mockGetLastHistorico,
      } as any;

      const service = new PedidoService(mockRepository);

      const pedido = new Pedido({
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
      assert.strictEqual(resultado?.peso, 1500);
      assert.strictEqual(mockGetLastHistorico.mock.calls.length, 1);
      // @ts-expect-error - mock.calls typing issue
      assert.strictEqual(mockGetLastHistorico.mock.calls[0].arguments[0], 456);
    });

    it('deve retornar null quando não existe histórico', async () => {
      // Arrange
      const mockGetLastHistorico = mock.fn(async () => null);

      const mockRepository: IPedidosRepository = {
        getLastHistoricoPeso: mockGetLastHistorico,
      } as any;

      const service = new PedidoService(mockRepository);

      const pedido = new Pedido({
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
      assert.strictEqual(resultado, null);
      assert.strictEqual(mockGetLastHistorico.mock.calls.length, 1);
      // @ts-expect-error - mock.calls typing issue
      assert.strictEqual(mockGetLastHistorico.mock.calls[0].arguments[0], 789);
    });

    it('deve converter numPed de string para number corretamente', async () => {
      // Arrange
      const mockGetLastHistorico = mock.fn(async () => ({
        peso: 3500,
        codCar: 999,
        numPed: 12345,
        createdAt: new Date(),
      }));

      const mockRepository: IPedidosRepository = {
        getLastHistoricoPeso: mockGetLastHistorico,
      } as any;

      const service = new PedidoService(mockRepository);

      const pedido = new Pedido({
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
      assert.ok(resultado, 'Resultado não deveria ser null');
      assert.strictEqual(resultado.peso, 3500);
      assert.strictEqual(mockGetLastHistorico.mock.calls.length, 1);
      // Verifica que o número foi convertido corretamente
      // @ts-expect-error - mock.calls typing issue
      assert.strictEqual(mockGetLastHistorico.mock.calls[0].arguments[0], 12345);
      // @ts-expect-error - mock.calls typing issue
      assert.strictEqual(typeof mockGetLastHistorico.mock.calls[0].arguments[0], 'number');
    });
  });
});
