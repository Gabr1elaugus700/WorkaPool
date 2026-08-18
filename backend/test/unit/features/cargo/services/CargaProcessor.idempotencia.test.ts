import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  Carga,
  SituacaoCarga,
} from '../../../../../src/features/cargo/entities/Carga';
import { CargaProcessor } from '../../../../../src/features/cargo/services/CargaProcessor';
import { PesoCargaCalculator } from '../../../../../src/features/cargo/services/PesoCargaCalculator';
import { HistoricoPesoPedido } from '../../../../../src/features/pedidos/entities/HistoricoPesoPedido';
import { PedidoService } from '../../../../../src/features/pedidos/services/PedidoService';
import { PedidoRaw } from '../../../../../src/features/pedidos/types/PedidoRaw';
import { FakeSapiens } from '../../../../helpers/FakeSapiens';

const buildRow = (overrides: Partial<PedidoRaw>): PedidoRaw => ({
  NUM_PED: '1001',
  COD_CLI: 'C1',
  CLIENTE: 'Cliente Teste',
  CIDADE: 'Blumenau',
  ESTADO: 'SC',
  VENDEDOR: 'Vendedor Teste',
  CODREP: 1,
  BLOQUEADO: 'N',
  PESO: 250,
  PRODUTOS: 'Produto',
  DERIVACAO: '001',
  QUANTIDADE: 1,
  CODCAR: 10,
  POSCAR: 2,
  SITCAR: 'A',
  QTD_ORI_PED: 1,
  ...overrides,
});

describe('CargaProcessor idempotência de posição', () => {
  it('não reposiciona pedido que já tem a maior posCar', async () => {
    const carga = new Carga({
      id: 'carga-1',
      codCar: 10,
      destino: 'Blumenau',
      pesoMaximo: 1000,
      previsaoSaida: new Date('2026-08-20T10:00:00.000Z'),
      situacao: SituacaoCarga.ABERTA,
    });
    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [
        buildRow({ DERIVACAO: '001', PESO: 250 }),
        buildRow({ DERIVACAO: '002', PESO: 250 }),
        buildRow({
          NUM_PED: '2002',
          DERIVACAO: '001',
          PESO: 200,
          POSCAR: 1,
        }),
      ],
      historicos: [
        new HistoricoPesoPedido(
          1001,
          400,
          carga.codCar,
          new Date('2026-08-14T10:00:00.000Z'),
        ),
        new HistoricoPesoPedido(
          2002,
          200,
          carga.codCar,
          new Date('2026-08-14T10:00:00.000Z'),
        ),
      ],
    });
    const pedidoService = new PedidoService(fakeSapiens);
    const processor = new CargaProcessor(
      fakeSapiens,
      new PesoCargaCalculator(fakeSapiens, pedidoService),
      pedidoService,
    );

    const resultado = await processor.processarMudancasPesoPedidos(carga);

    const pedidos = await fakeSapiens.getPedidosByCarga(carga.codCar);
    const pedido = pedidos.find((item) => item.numPed === '1001');
    const historicosDoPedido = fakeSapiens
      .getHistoricos()
      .filter((historico) => historico.numPed === 1001);

    assert.strictEqual(pedido?.poscar, 2);
    assert.deepStrictEqual(resultado.pedidosReposicionados, []);
    assert.strictEqual(fakeSapiens.getWriteCounts().historicosCriados, 1);
    assert.strictEqual(historicosDoPedido[historicosDoPedido.length - 1].peso, 500);
  });
});
