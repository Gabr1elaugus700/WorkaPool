import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { PedidoProcessor } from '../../../../../src/features/cargo/services/PedidoProcessor';
import { Pedido } from '../../../../../src/features/cargo/entities/Pedido';
import { Carga, SituacaoCarga } from '../../../../../src/features/cargo/entities/Carga';
import { ICargoRepository } from '../../../../../src/features/cargo/repositories/ICargoRepository';

describe('PedidoProcessor', () => {
  describe('getUltimoHistoricoPeso', () => {
    it('deve retornar o peso do histórico quando existe', async () => {
      // Arrange
      const mockGetLastHistorico = mock.fn(async () => ({
        peso: 1500,
        codCar: 123,
        numPed: 456,
        createdAt: new Date(),
      }));

      const mockRepository: ICargoRepository = {
        getLastHistoricoPesoPedido: mockGetLastHistorico,
      } as any;

      const processor = new PedidoProcessor(mockRepository);

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

      const carga = new Carga({
        id: 'carga-1',
        codCar: 123,
        destino: 'São Paulo',
        pesoMaximo: 5000,
        previsaoSaida: new Date(),
        situacao: SituacaoCarga.ABERTA,
      });

      // Act
      const resultado = await processor.getUltimoHistoricoPeso(pedido);

      // Assert
      assert.strictEqual(resultado, 1500);
      assert.strictEqual(mockGetLastHistorico.mock.calls.length, 1);
      // @ts-expect-error - mock.calls typing issue
      assert.strictEqual(mockGetLastHistorico.mock.calls[0].arguments[0], 456);
    });

    it('deve retornar null quando não existe histórico', async () => {
      // Arrange
      const mockGetLastHistorico = mock.fn(async () => null);

      const mockRepository: ICargoRepository = {
        getLastHistoricoPesoPedido: mockGetLastHistorico,
      } as any;

      const processor = new PedidoProcessor(mockRepository);

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

      const carga = new Carga({
        id: 'carga-2',
        codCar: 456,
        destino: 'Rio de Janeiro',
        pesoMaximo: 8000,
        previsaoSaida: new Date(),
        situacao: SituacaoCarga.ABERTA,
      });

      // Act
      const resultado = await processor.getUltimoHistoricoPeso(pedido);

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

      const mockRepository: ICargoRepository = {
        getLastHistoricoPesoPedido: mockGetLastHistorico,
      } as any;

      const processor = new PedidoProcessor(mockRepository);

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

      const carga = new Carga({
        id: 'carga-3',
        codCar: 999,
        destino: 'Belo Horizonte',
        pesoMaximo: 10000,
        previsaoSaida: new Date(),
        situacao: SituacaoCarga.ABERTA,
      });

      // Act
      const resultado = await processor.getUltimoHistoricoPeso(pedido);

      // Assert
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
