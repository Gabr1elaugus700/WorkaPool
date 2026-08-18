import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  Carga,
  SituacaoCarga,
} from '../../../../../src/features/cargo/entities/Carga';
import { HistoricoPesoPedido } from '../../../../../src/features/pedidos/entities/HistoricoPesoPedido';
import { PedidoService } from '../../../../../src/features/pedidos/services/PedidoService';
import { PedidoRaw } from '../../../../../src/features/pedidos/types/PedidoRaw';
import { FakeSapiens } from '../../../../helpers/FakeSapiens';

const carga = new Carga({
  id: 'carga-1',
  codCar: 10,
  destino: 'Blumenau',
  pesoMaximo: 1000,
  previsaoSaida: new Date('2026-08-20T10:00:00.000Z'),
  situacao: SituacaoCarga.ABERTA,
});

const row: PedidoRaw = {
  NUM_PED: '1001',
  COD_CLI: 'C1',
  CLIENTE: 'Cliente Teste',
  CIDADE: 'Blumenau',
  ESTADO: 'SC',
  VENDEDOR: 'Vendedor Teste',
  CODREP: 1,
  BLOQUEADO: 'N',
  PESO: 500,
  PRODUTOS: 'Produto',
  DERIVACAO: '001',
  QUANTIDADE: 1,
  CODCAR: carga.codCar,
  POSCAR: 1,
  SITCAR: 'A',
  QTD_ORI_PED: 1,
};

describe('PedidoService.salvarHistoricoPeso', () => {
  it('cria histórico quando o total difere só na fração', async () => {
    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [row],
      historicos: [
        new HistoricoPesoPedido(
          1001,
          500,
          carga.codCar,
          new Date('2026-08-14T10:00:00.000Z'),
        ),
      ],
    });
    const service = new PedidoService(fakeSapiens);
    const [pedido] = await fakeSapiens.getPedidosByCarga(carga.codCar);

    await service.salvarHistoricoPeso(pedido, carga.id, 500.4);

    assert.strictEqual(fakeSapiens.getHistoricos().length, 2);
    assert.strictEqual(fakeSapiens.getHistoricos()[1].peso, 500.4);
  });

  it('não cria histórico quando o total é exatamente igual', async () => {
    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [row],
      historicos: [
        new HistoricoPesoPedido(
          1001,
          500,
          carga.codCar,
          new Date('2026-08-14T10:00:00.000Z'),
        ),
      ],
    });
    const service = new PedidoService(fakeSapiens);
    const [pedido] = await fakeSapiens.getPedidosByCarga(carga.codCar);

    await service.salvarHistoricoPeso(pedido, carga.id, 500);

    assert.strictEqual(fakeSapiens.getHistoricos().length, 1);
  });

  it('cria histórico quando o total mudou', async () => {
    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [row],
      historicos: [
        new HistoricoPesoPedido(
          1001,
          500,
          carga.codCar,
          new Date('2026-08-14T10:00:00.000Z'),
        ),
      ],
    });
    const service = new PedidoService(fakeSapiens);
    const [pedido] = await fakeSapiens.getPedidosByCarga(carga.codCar);

    await service.salvarHistoricoPeso(pedido, carga.id, 501);

    assert.strictEqual(fakeSapiens.getHistoricos().length, 2);
    assert.strictEqual(fakeSapiens.getHistoricos()[1].peso, 501);
  });
});
