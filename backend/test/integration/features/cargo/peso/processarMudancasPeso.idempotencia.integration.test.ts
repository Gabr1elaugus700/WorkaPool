import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  Carga,
  SituacaoCarga,
} from '../../../../../src/features/cargo/entities/Carga';
import { PesoCargaCalculator } from '../../../../../src/features/cargo/services/PesoCargaCalculator';
import { CheckPesoPedidoHistoricoUseCase } from '../../../../../src/features/cargo/useCases/CheckPesoPedidoHistorico.use-case';
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
  PESO: 200,
  PRODUTOS: 'Produto',
  DERIVACAO: '001',
  QUANTIDADE: 1,
  CODCAR: 10,
  POSCAR: 1,
  SITCAR: 'A',
  QTD_ORI_PED: 1,
  ...overrides,
});

describe('idempotência do ciclo de mudança de peso', () => {
  it('segundo ciclo não cria histórico nem reposiciona novamente', async () => {
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
        buildRow({ DERIVACAO: '001', PESO: 200, POSCAR: 1 }),
        buildRow({ DERIVACAO: '002', PESO: 200, POSCAR: 1 }),
        buildRow({
          NUM_PED: '2002',
          DERIVACAO: '001',
          PESO: 300,
          POSCAR: 2,
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
          300,
          carga.codCar,
          new Date('2026-08-14T10:00:00.000Z'),
        ),
      ],
    });
    const pedidoService = new PedidoService(fakeSapiens);
    const pesoCargaCalculator = new PesoCargaCalculator(
      fakeSapiens,
      pedidoService,
    );
    const useCase = new CheckPesoPedidoHistoricoUseCase({
      cargoRepository: fakeSapiens,
      pedidoService,
      pesoCargaCalculator,
    });
    const historicosAntes = fakeSapiens.getHistoricos().length;

    fakeSapiens.updateItemWeight(1001, '002', 300);

    await useCase.execute();
    const historicosAposPrimeiroCiclo = fakeSapiens.getHistoricos().length;
    const pedidoAposPrimeiroCiclo = (
      await fakeSapiens.getPedidosByCarga(carga.codCar)
    ).find((pedido) => pedido.numPed === '1001');

    await useCase.execute();
    const pedidoAposSegundoCiclo = (
      await fakeSapiens.getPedidosByCarga(carga.codCar)
    ).find((pedido) => pedido.numPed === '1001');

    assert.strictEqual(historicosAposPrimeiroCiclo, historicosAntes + 1);
    assert.strictEqual(fakeSapiens.getHistoricos().length, historicosAntes + 1);
    assert.strictEqual(pedidoAposPrimeiroCiclo?.poscar, 3);
    assert.strictEqual(pedidoAposSegundoCiclo?.poscar, 3);
  });

  it('grava 1355.5 uma vez após histórico arredondado e o tick seguinte não faz nada', async () => {
    const carga = new Carga({
      id: 'carga-1',
      codCar: 10,
      destino: 'Blumenau',
      pesoMaximo: 2000,
      previsaoSaida: new Date('2026-08-20T10:00:00.000Z'),
      situacao: SituacaoCarga.ABERTA,
    });
    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [
        buildRow({ DERIVACAO: '001', PESO: 700, POSCAR: 1 }),
        buildRow({ DERIVACAO: '002', PESO: 655.5, POSCAR: 1 }),
        buildRow({
          NUM_PED: '2002',
          DERIVACAO: '001',
          PESO: 300,
          POSCAR: 2,
        }),
      ],
      historicos: [
        new HistoricoPesoPedido(
          1001,
          1355,
          carga.codCar,
          new Date('2026-08-14T10:00:00.000Z'),
        ),
        new HistoricoPesoPedido(
          2002,
          300,
          carga.codCar,
          new Date('2026-08-14T10:00:00.000Z'),
        ),
      ],
    });
    const pedidoService = new PedidoService(fakeSapiens);
    const useCase = new CheckPesoPedidoHistoricoUseCase({
      cargoRepository: fakeSapiens,
      pedidoService,
      pesoCargaCalculator: new PesoCargaCalculator(fakeSapiens, pedidoService),
    });
    const historicosAntes = fakeSapiens.getHistoricos().length;

    await useCase.execute();
    const historicosAposPrimeiroCiclo = fakeSapiens.getHistoricos();
    const pedidoAposPrimeiroCiclo = (
      await fakeSapiens.getPedidosByCarga(carga.codCar)
    ).find((pedido) => pedido.numPed === '1001');

    await useCase.execute();
    const pedidoAposSegundoCiclo = (
      await fakeSapiens.getPedidosByCarga(carga.codCar)
    ).find((pedido) => pedido.numPed === '1001');

    assert.strictEqual(historicosAposPrimeiroCiclo.length, historicosAntes + 1);
    assert.strictEqual(
      historicosAposPrimeiroCiclo[historicosAposPrimeiroCiclo.length - 1].peso,
      1355.5,
    );
    assert.strictEqual(fakeSapiens.getHistoricos().length, historicosAntes + 1);
    assert.strictEqual(pedidoAposPrimeiroCiclo?.poscar, 3);
    assert.strictEqual(pedidoAposSegundoCiclo?.poscar, 3);
  });
});
