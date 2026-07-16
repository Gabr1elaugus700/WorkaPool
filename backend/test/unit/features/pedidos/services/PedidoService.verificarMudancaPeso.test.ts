import { describe, it, mock, after } from 'node:test';
import assert from 'node:assert/strict';
import { PedidoService } from '../../../../../src/features/pedidos/services/PedidoService';
import { IPedidosRepository } from '../../../../../src/features/pedidos/repositories/IPedidosRepository';
import { PedidoCargo } from '../../../../../src/features/pedidos/types/PedidoCargo.types';
import { HistoricoPesoPedido } from '../../../../../src/features/pedidos/entities/HistoricoPesoPedido';

const buildPedido = (numPed: string): PedidoCargo =>
  new PedidoCargo({
    id: numPed,
    numPed,
    cliente: 'Cliente Teste',
    cidade: 'Blumenau',
    estado: 'SC',
    vendedor: 'Vendedor Teste',
    peso: 100,
    qtdOri: 1,
  });

const buildHistorico = (peso: number): HistoricoPesoPedido =>
  new HistoricoPesoPedido(456, peso, 10, new Date('2026-01-01T00:00:00.000Z'));

const buildService = (
  pesoAtual: number,
  historico: HistoricoPesoPedido | null,
): PedidoService => {
  const mockRepository: IPedidosRepository = {
    getPedidoWeight: mock.fn(async (numPed: number) => ({
      numPed,
      peso: pesoAtual,
    })),
    getLastHistoricoPeso: mock.fn(async () => historico),
  } as any;

  return new PedidoService(mockRepository);
};

describe('PedidoService.verificarMudancaPeso', () => {
  after(async () => {
    // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('TC-S1 - detecta mudança com peso agregado', () => {
    it('TC-S1.1 - peso total 500 vs histórico 400 => aumentou', async () => {
      // Arrange
      const service = buildService(500, buildHistorico(400));

      // Act
      const resultado = await service.verificarMudancaPeso(buildPedido('456'));

      // Assert
      assert.deepStrictEqual(resultado, {
        mudou: true,
        aumentou: true,
        reducao: false,
        pesoAnterior: 400,
        pesoAtual: 500,
        diferenca: 100,
      });
    });

    it('TC-S1.2 - peso total 300 vs histórico 500 => reduziu', async () => {
      // Arrange
      const service = buildService(300, buildHistorico(500));

      // Act
      const resultado = await service.verificarMudancaPeso(buildPedido('456'));

      // Assert
      assert.strictEqual(resultado.mudou, true);
      assert.strictEqual(resultado.aumentou, false);
      assert.strictEqual(resultado.reducao, true);
      assert.strictEqual(resultado.diferenca, -200);
    });

    it('TC-S1.3 - peso total 500 vs histórico 500 => sem mudança', async () => {
      // Arrange
      const service = buildService(500, buildHistorico(500));

      // Act
      const resultado = await service.verificarMudancaPeso(buildPedido('456'));

      // Assert
      assert.strictEqual(resultado.mudou, false);
      assert.strictEqual(resultado.aumentou, false);
      assert.strictEqual(resultado.reducao, false);
      assert.strictEqual(resultado.diferenca, 0);
    });

    it('TC-S1.4 - sem histórico anterior => registro inicial', async () => {
      // Arrange
      const service = buildService(500, null);

      // Act
      const resultado = await service.verificarMudancaPeso(buildPedido('456'));

      // Assert
      assert.strictEqual(resultado.mudou, false);
      assert.strictEqual(resultado.pesoAnterior, null);
      assert.strictEqual(resultado.pesoAtual, 500);
    });
  });

  describe('TC-S2 - não gera mudança falsa por arredondamento', () => {
    it('TC-S2.1 - peso atual 1234.6 vs histórico 1235 => mudou=false', async () => {
      // Arrange
      const service = buildService(1234.6, buildHistorico(1235));

      // Act
      const resultado = await service.verificarMudancaPeso(buildPedido('456'));

      // Assert
      assert.strictEqual(resultado.mudou, false);
    });

    it('TC-S2.2 - peso atual 1234.4 vs histórico 1234 => mudou=false', async () => {
      // Arrange
      const service = buildService(1234.4, buildHistorico(1234));

      // Act
      const resultado = await service.verificarMudancaPeso(buildPedido('456'));

      // Assert
      assert.strictEqual(resultado.mudou, false);
    });

    it('TC-S2.3 - peso atual 1240.0 vs histórico 1234 => mudou=true, aumentou=true', async () => {
      // Arrange
      const service = buildService(1240.0, buildHistorico(1234));

      // Act
      const resultado = await service.verificarMudancaPeso(buildPedido('456'));

      // Assert
      assert.strictEqual(resultado.mudou, true);
      assert.strictEqual(resultado.aumentou, true);
    });
  });
});
