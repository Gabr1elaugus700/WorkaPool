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

describe('processamento colaborativo de mudança de peso', () => {
  it('move ao fim e salva um histórico com o peso total quando o aumento cabe', async () => {
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

    const cargasProcessadas = await useCase.execute();

    const pedidos = await fakeSapiens.getPedidosByCarga(carga.codCar);
    const pedidoReposicionado = pedidos.find(
      (pedido) => pedido.numPed === '1001',
    );
    const novosHistoricos = fakeSapiens
      .getHistoricos()
      .slice(historicosAntes);

    assert.deepStrictEqual(cargasProcessadas, [carga]);
    assert.strictEqual(pedidoReposicionado?.poscar, 3);
    assert.strictEqual(pedidoReposicionado?.codCar, carga.codCar);
    assert.strictEqual(novosHistoricos.length, 1);
    assert.strictEqual(novosHistoricos[0].numPed, 1001);
    assert.strictEqual(novosHistoricos[0].peso, 500);
  });

  it('remove da carga e salva um histórico com o peso total quando o aumento excede a capacidade', async () => {
    const carga = new Carga({
      id: 'carga-1',
      codCar: 10,
      destino: 'Blumenau',
      pesoMaximo: 750,
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

    const cargasProcessadas = await useCase.execute();

    const todosPedidos = await fakeSapiens.getPedidos();
    const pedidoRemovido = todosPedidos.find(
      (pedido) => pedido.numPed === '1001',
    );
    const outroPedido = todosPedidos.find(
      (pedido) => pedido.numPed === '2002',
    );
    const novosHistoricos = fakeSapiens
      .getHistoricos()
      .slice(historicosAntes);

    assert.deepStrictEqual(cargasProcessadas, [carga]);
    assert.strictEqual(pedidoRemovido?.codCar, 0);
    assert.strictEqual(pedidoRemovido?.poscar, 0);
    assert.strictEqual(outroPedido?.codCar, carga.codCar);
    assert.strictEqual(outroPedido?.poscar, 2);
    assert.strictEqual(novosHistoricos.length, 1);
    assert.strictEqual(novosHistoricos[0].numPed, 1001);
    assert.strictEqual(novosHistoricos[0].peso, 500);
  });

  it('mantém a posição e salva um histórico com o peso menor quando o peso reduz', async () => {
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

    fakeSapiens.updateItemWeight(1001, '002', 100);

    await useCase.execute();

    const pedidos = await fakeSapiens.getPedidosByCarga(carga.codCar);
    const pedidoComPesoReduzido = pedidos.find(
      (pedido) => pedido.numPed === '1001',
    );
    const outroPedido = pedidos.find((pedido) => pedido.numPed === '2002');
    const novosHistoricos = fakeSapiens
      .getHistoricos()
      .slice(historicosAntes);

    assert.strictEqual(pedidoComPesoReduzido?.codCar, carga.codCar);
    assert.strictEqual(pedidoComPesoReduzido?.poscar, 1);
    assert.strictEqual(outroPedido?.codCar, carga.codCar);
    assert.strictEqual(outroPedido?.poscar, 2);
    assert.strictEqual(novosHistoricos.length, 1);
    assert.strictEqual(novosHistoricos[0].numPed, 1001);
    assert.strictEqual(novosHistoricos[0].peso, 300);
  });

  it('não cria histórico nem atualiza posição ou carga quando o peso não muda', async () => {
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

    await useCase.execute();

    const pedidos = await fakeSapiens.getPedidosByCarga(carga.codCar);
    const pedidoSemMudanca = pedidos.find(
      (pedido) => pedido.numPed === '1001',
    );
    const outroPedido = pedidos.find((pedido) => pedido.numPed === '2002');

    assert.deepStrictEqual(fakeSapiens.getWriteCounts(), {
      historicosCriados: 0,
      pedidosCargaAtualizados: 0,
      cargasAtualizadas: 0,
    });
    assert.strictEqual(pedidoSemMudanca?.codCar, carga.codCar);
    assert.strictEqual(pedidoSemMudanca?.poscar, 1);
    assert.strictEqual(outroPedido?.codCar, carga.codCar);
    assert.strictEqual(outroPedido?.poscar, 2);
  });

  it('não reposiciona nem grava histórico quando o total exato 1355.5 já está no histórico', async () => {
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
          1355.5,
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

    await useCase.execute();

    const pedidos = await fakeSapiens.getPedidosByCarga(carga.codCar);
    const pedido = pedidos.find((item) => item.numPed === '1001');

    assert.deepStrictEqual(fakeSapiens.getWriteCounts(), {
      historicosCriados: 0,
      pedidosCargaAtualizados: 0,
      cargasAtualizadas: 0,
    });
    assert.strictEqual(pedido?.poscar, 1);
    assert.strictEqual(pedido?.codCar, carga.codCar);
  });
});
