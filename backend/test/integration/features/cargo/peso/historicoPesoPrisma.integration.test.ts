import assert from 'node:assert/strict';
import {
  after,
  afterEach,
  beforeEach,
  describe,
  it,
} from 'node:test';
import { PrismaClient } from '@prisma/client';
import {
  Carga,
  SituacaoCarga,
} from '../../../../../src/features/cargo/entities/Carga';
import { PesoCargaCalculator } from '../../../../../src/features/cargo/services/PesoCargaCalculator';
import { CheckPesoPedidoHistoricoUseCase } from '../../../../../src/features/cargo/useCases/CheckPesoPedidoHistorico.use-case';
import { PedidosRepository } from '../../../../../src/features/pedidos/repositories/PedidosRepository';
import { PedidoService } from '../../../../../src/features/pedidos/services/PedidoService';
import { PedidoRaw } from '../../../../../src/features/pedidos/types/PedidoRaw';
import { FakeSapiens } from '../../../../helpers/FakeSapiens';
import { FakeSapiensPrismaRepository } from '../../../../helpers/FakeSapiensPrismaRepository';

const fixturePrefix = 'test-peso-49-';
const prisma = new PrismaClient();
const pedidosRepository = new PedidosRepository(prisma);

const databaseUrl = new URL(process.env.DATABASE_URL ?? '');
if (databaseUrl.pathname !== '/workapool_test') {
  throw new Error(
    `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
  );
}

const cleanupFixtures = async (): Promise<void> => {
  await prisma.historicoPesoPedidos.deleteMany({
    where: { cargaId: { startsWith: fixturePrefix } },
  });
  await prisma.cargas.deleteMany({
    where: { id: { startsWith: fixturePrefix } },
  });
};

const createCargaFixture = async (
  id: string,
  codCar: number,
): Promise<void> => {
  await prisma.cargas.create({
    data: {
      id,
      codCar,
      destino: 'Blumenau',
      pesoMax: 1000,
      custoMin: 0,
      situacao: 'ABERTA',
      previsaoSaida: new Date('2026-08-20T10:00:00.000Z'),
    },
  });
};

const buildRow = (overrides: Partial<PedidoRaw>): PedidoRaw => ({
  NUM_PED: '49002',
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
  CODCAR: 4902,
  POSCAR: 1,
  SITCAR: 'A',
  QTD_ORI_PED: 1,
  ...overrides,
});

describe('histórico de peso com Prisma isolado', () => {
  beforeEach(cleanupFixtures);
  afterEach(cleanupFixtures);
  after(() => prisma.$disconnect());

  it('persiste o peso exato e retorna o registro mais recente por createdAt', async () => {
    const cargaId = `${fixturePrefix}round-trip`;
    const numPed = 49001;
    await createCargaFixture(cargaId, 4901);

    await pedidosRepository.createHistoricoPeso(numPed, cargaId, 100.49);
    await pedidosRepository.createHistoricoPeso(numPed, cargaId, 200.51);

    const registros = await prisma.historicoPesoPedidos.findMany({
      where: { numPed, cargaId },
      orderBy: { peso: 'asc' },
    });
    assert.deepStrictEqual(
      registros.map((registro) => Number(registro.peso)),
      [100.49, 200.51],
    );

    const createdAtMaisRecente = new Date('2026-08-14T15:00:00.000Z');
    await prisma.historicoPesoPedidos.update({
      where: { id: registros[0].id },
      data: { createdAt: createdAtMaisRecente },
    });
    await prisma.historicoPesoPedidos.update({
      where: { id: registros[1].id },
      data: { createdAt: new Date('2026-08-14T14:00:00.000Z') },
    });

    const ultimoHistorico =
      await pedidosRepository.getLastHistoricoPeso(numPed);

    assert.ok(ultimoHistorico);
    assert.strictEqual(ultimoHistorico.peso, 100.49);
    assert.strictEqual(ultimoHistorico.codCar, 4901);
    assert.deepStrictEqual(ultimoHistorico.createdAt, createdAtMaisRecente);
  });

  it('grava e lê 1355.5 sem arredondar', async () => {
    const cargaId = `${fixturePrefix}exact-1355`;
    const numPed = 49004;
    await createCargaFixture(cargaId, 4904);

    await pedidosRepository.createHistoricoPeso(numPed, cargaId, 1355.5);

    const ultimoHistorico =
      await pedidosRepository.getLastHistoricoPeso(numPed);

    assert.ok(ultimoHistorico);
    assert.strictEqual(ultimoHistorico.peso, 1355.5);
  });

  it('usa pesos do FakeSapiens e persiste no Prisma o fluxo completo de aumento', async () => {
    const cargaId = `${fixturePrefix}fluxo-misto`;
    const carga = new Carga({
      id: cargaId,
      codCar: 4902,
      destino: 'Blumenau',
      pesoMaximo: 1000,
      previsaoSaida: new Date('2026-08-20T10:00:00.000Z'),
      situacao: SituacaoCarga.ABERTA,
    });
    await createCargaFixture(cargaId, carga.codCar);

    const fakeSapiens = new FakeSapiens({
      cargas: [carga],
      rows: [
        buildRow({ DERIVACAO: '001', PESO: 200, POSCAR: 1 }),
        buildRow({ DERIVACAO: '002', PESO: 200, POSCAR: 1 }),
        buildRow({
          NUM_PED: '49003',
          DERIVACAO: '001',
          PESO: 300,
          POSCAR: 2,
        }),
      ],
    });
    const mixedRepository = new FakeSapiensPrismaRepository(
      fakeSapiens,
      pedidosRepository,
    );
    const pedidoService = new PedidoService(mixedRepository);
    const pesoCargaCalculator = new PesoCargaCalculator(
      fakeSapiens,
      pedidoService,
    );
    const useCase = new CheckPesoPedidoHistoricoUseCase({
      cargoRepository: fakeSapiens,
      pedidoService,
      pesoCargaCalculator,
    });
    await mixedRepository.createHistoricoPeso(49002, cargaId, 400);
    await mixedRepository.createHistoricoPeso(49003, cargaId, 300);

    fakeSapiens.updateItemWeight(49002, '002', 300);
    const cargasProcessadas = await useCase.execute();

    const pedidos = await fakeSapiens.getPedidosByCarga(carga.codCar);
    const pedidoReposicionado = pedidos.find(
      (pedido) => pedido.numPed === '49002',
    );
    const ultimoHistorico =
      await mixedRepository.getLastHistoricoPeso(49002);
    const quantidadeHistoricos = await prisma.historicoPesoPedidos.count({
      where: { numPed: 49002, cargaId },
    });

    assert.deepStrictEqual(cargasProcessadas, [carga]);
    assert.strictEqual(pedidoReposicionado?.poscar, 3);
    assert.strictEqual(ultimoHistorico?.peso, 500);
    assert.strictEqual(quantidadeHistoricos, 2);
  });
});
