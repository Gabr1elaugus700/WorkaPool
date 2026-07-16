import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { mapRawToPedidos } from '../../../../../src/features/pedidos/mappers/PedidoMapper';
import { PedidoRaw } from '../../../../../src/features/pedidos/types/PedidoRaw';

const buildRow = (overrides: Partial<PedidoRaw> = {}): PedidoRaw => ({
  NUM_PED: '1001',
  COD_CLI: 'C1',
  CLIENTE: 'Cliente Teste',
  CIDADE: 'Blumenau',
  ESTADO: 'SC',
  VENDEDOR: 'Vendedor Teste',
  CODREP: 1,
  BLOQUEADO: 'N',
  PESO: 100,
  PRODUTOS: 'Produto',
  DERIVACAO: '001',
  QUANTIDADE: 1,
  CODCAR: 0,
  POSCAR: 0,
  SITCAR: '',
  QTD_ORI_PED: 1,
  ...overrides,
});

describe('mapRawToPedidos', () => {
  after(async () => {
    // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('TC-G1.1 - agrega o peso de múltiplas linhas do mesmo pedido', () => {
    // Arrange
    const rows: PedidoRaw[] = [
      buildRow({ NUM_PED: '1001', PESO: 100, DERIVACAO: '001' }),
      buildRow({ NUM_PED: '1001', PESO: 250, DERIVACAO: '002' }),
      buildRow({ NUM_PED: '1001', PESO: 150, DERIVACAO: '003' }),
    ];

    // Act
    const pedidos = mapRawToPedidos(rows);

    // Assert
    assert.strictEqual(pedidos.length, 1);
    assert.strictEqual(pedidos[0].peso, 500);
  });

  it('TC-G1.2 - soma o peso por pedido para pedidos distintos', () => {
    // Arrange
    const rows: PedidoRaw[] = [
      buildRow({ NUM_PED: '1001', PESO: 100, DERIVACAO: '001' }),
      buildRow({ NUM_PED: '1001', PESO: 200, DERIVACAO: '002' }),
      buildRow({ NUM_PED: '2002', PESO: 300, DERIVACAO: '001' }),
      buildRow({ NUM_PED: '2002', PESO: 400, DERIVACAO: '002' }),
      buildRow({ NUM_PED: '2002', PESO: 50, DERIVACAO: '003' }),
    ];

    // Act
    const pedidos = mapRawToPedidos(rows);

    // Assert
    assert.strictEqual(pedidos.length, 2);

    const pedido1 = pedidos.find((p) => p.numPed === '1001');
    const pedido2 = pedidos.find((p) => p.numPed === '2002');

    assert.strictEqual(pedido1?.peso, 300);
    assert.strictEqual(pedido2?.peso, 750);
  });

  it('TC-G1.3 - mantém o peso da única linha do pedido', () => {
    // Arrange
    const rows: PedidoRaw[] = [buildRow({ NUM_PED: '3003', PESO: 175 })];

    // Act
    const pedidos = mapRawToPedidos(rows);

    // Assert
    assert.strictEqual(pedidos.length, 1);
    assert.strictEqual(pedidos[0].peso, 175);
  });

  it('TC-G1.4 - soma o peso fracionário sem arredondar no mapper', () => {
    // Arrange
    const rows: PedidoRaw[] = [
      buildRow({ NUM_PED: '4004', PESO: 100.4, DERIVACAO: '001' }),
      buildRow({ NUM_PED: '4004', PESO: 100.4, DERIVACAO: '002' }),
    ];

    // Act
    const pedidos = mapRawToPedidos(rows);

    // Assert
    assert.strictEqual(pedidos.length, 1);
    assert.strictEqual(pedidos[0].peso, 200.8);
  });
});
