import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { IbcEmprestimoAtrasadoRepository } from "../../../../src/features/ibc/repositories/IbcEmprestimoAtrasadoRepository";
import { ListEmprestimosAtrasadosUseCase } from "../../../../src/features/ibc/useCases/ListEmprestimosAtrasados.use-case";
import { ensureIbcCadastroSchema } from "../../../helpers/ensureIbcCadastroSchema";

const PREFIX = "test-ibc-41-";
const CARGA_ID = `${PREFIX}carga`;
const COD_CAR = 41414141;
const NOW = new Date("2026-10-14T12:00:00.000Z");
const VENCIDO = new Date("2026-07-12T15:00:00.000Z");
const MAIS_ANTIGO = new Date("2026-01-02T00:00:00.000Z");
const NO_PRAZO = new Date("2027-01-11T00:00:00.000Z");
const VENCIDO_IGNORADO = new Date("2020-01-01T00:00:00.000Z");

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(`Integration tests require workapool_test, received ${databaseUrl.pathname}`);
  }
}

async function ensureLeituraSchema(): Promise<void> {
  await ensureIbcCadastroSchema(prisma);
  await prisma.$executeRawUnsafe(`ALTER TYPE "IbcCustodia" ADD VALUE IF NOT EXISTS 'CLIENTE'`);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "IbcMotivoBaixa" AS ENUM ('VENDA', 'TROCA');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "motivoBaixa" "IbcMotivoBaixa"`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AlocacaoIbc" ADD COLUMN IF NOT EXISTS "encerradaEm" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AlocacaoIbc" ADD COLUMN IF NOT EXISTS "emprestimoVenceEm" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "AlocacaoIbc_ibcId_key"`);
}

async function cleanupFixtures(): Promise<void> {
  await prisma.ibc.updateMany({
    where: { identificador: { startsWith: PREFIX } },
    data: { convertedToContainerId: null },
  });
  await prisma.alocacaoIbc.deleteMany({
    where: {
      OR: [{ ibc: { identificador: { startsWith: PREFIX } } }, { cargaId: CARGA_ID }],
    },
  });
  await prisma.ibc.deleteMany({ where: { identificador: { startsWith: PREFIX } } });
  await prisma.cargasFechadas.deleteMany({ where: { cargaId: CARGA_ID } });
  await prisma.cargaPedidoIbc.deleteMany({ where: { cargaId: CARGA_ID } });
  await prisma.cargas.deleteMany({ where: { id: CARGA_ID } });
  await prisma.user.deleteMany({ where: { user: { startsWith: PREFIX } } });
}

function useCase() {
  return new ListEmprestimosAtrasadosUseCase(new IbcEmprestimoAtrasadoRepository(prisma));
}

describe("empréstimos em atraso (#41)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureLeituraSchema();
    await cleanupFixtures();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  async function seed(): Promise<void> {
    const user = await prisma.user.create({
      data: { user: `${PREFIX}logistica`, password: "hashed", role: Role.LOGISTICA, name: "Log 41" },
    });
    await prisma.cargas.create({
      data: {
        id: CARGA_ID,
        codCar: COD_CAR,
        destino: "Blumenau",
        pesoMax: 1000,
        custoMin: 0,
        situacao: "FECHADA",
      },
    });
    await prisma.cargaPedidoIbc.createMany({
      data: [
        {
          cargaId: CARGA_ID,
          numPed: "1120",
          codCli: "C1",
          cliente: "Cliente Aberto",
          quantidadeEsperadaTotal: 1,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 1,
        },
        {
          cargaId: CARGA_ID,
          numPed: "1121",
          codCli: "C2",
          cliente: "Cliente Antigo",
          quantidadeEsperadaTotal: 1,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 1,
        },
      ],
    });
    await prisma.cargasFechadas.create({
      data: {
        cargaId: CARGA_ID,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        pedidos: [{ numPed: "1120", codRep: 1, cliente: "Foto Velha" }],
      },
    });
    await prisma.cargasFechadas.create({
      data: {
        cargaId: CARGA_ID,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        pedidos: [
          { numPed: "1120", codRep: 17, cliente: "Nome no JSON" },
          { numPed: "1121", codRep: 17, cliente: "Cliente Antigo" },
        ],
      },
    });

    const ancora = await prisma.ibc.create({
      data: { identificador: `${PREFIX}ancora`, aptidao: "APTO", custodia: "PATIO" },
    });
    const vencido = await prisma.ibc.create({
      data: { identificador: `${PREFIX}vencido`, aptidao: "APTO", custodia: "CLIENTE" },
    });
    const antigo = await prisma.ibc.create({
      data: { identificador: `${PREFIX}antigo`, aptidao: "APTO", custodia: "CLIENTE" },
    });
    const semFoto = await prisma.ibc.create({
      data: { identificador: `${PREFIX}sem-foto`, aptidao: "APTO", custodia: "CLIENTE" },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}no-prazo`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        alocacoes: {
          create: {
            cargaId: CARGA_ID,
            numPed: "1120",
            alocadoPorId: user.id,
            emprestimoVenceEm: NO_PRAZO,
          },
        },
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}no-instante`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        alocacoes: {
          create: {
            cargaId: CARGA_ID,
            numPed: "1120",
            alocadoPorId: user.id,
            emprestimoVenceEm: NOW,
          },
        },
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}encerrado`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        alocacoes: {
          create: {
            cargaId: CARGA_ID,
            numPed: "1120",
            alocadoPorId: user.id,
            emprestimoVenceEm: VENCIDO_IGNORADO,
            encerradaEm: new Date("2026-05-02T00:00:00.000Z"),
          },
        },
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}patio`,
        aptidao: "APTO",
        custodia: "PATIO",
        alocacoes: {
          create: {
            cargaId: CARGA_ID,
            numPed: "1120",
            alocadoPorId: user.id,
            emprestimoVenceEm: VENCIDO_IGNORADO,
          },
        },
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}venda`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        motivoBaixa: "VENDA",
        alocacoes: {
          create: {
            cargaId: CARGA_ID,
            numPed: "1120",
            alocadoPorId: user.id,
            emprestimoVenceEm: VENCIDO_IGNORADO,
          },
        },
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}troca`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        motivoBaixa: "TROCA",
        alocacoes: {
          create: {
            cargaId: CARGA_ID,
            numPed: "1120",
            alocadoPorId: user.id,
            emprestimoVenceEm: VENCIDO_IGNORADO,
          },
        },
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}substituido`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        convertedToContainerId: ancora.id,
        alocacoes: {
          create: {
            cargaId: CARGA_ID,
            numPed: "1120",
            alocadoPorId: user.id,
            emprestimoVenceEm: VENCIDO_IGNORADO,
          },
        },
      },
    });

    await prisma.alocacaoIbc.create({
      data: {
        ibcId: vencido.id,
        cargaId: CARGA_ID,
        numPed: "99",
        alocadoPorId: user.id,
        alocadoEm: new Date("2026-02-01T00:00:00.000Z"),
        emprestimoVenceEm: VENCIDO_IGNORADO,
        encerradaEm: new Date("2026-02-02T00:00:00.000Z"),
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: vencido.id,
        cargaId: CARGA_ID,
        numPed: "1120",
        alocadoPorId: user.id,
        alocadoEm: new Date("2026-04-01T00:00:00.000Z"),
        emprestimoVenceEm: VENCIDO,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: antigo.id,
        cargaId: CARGA_ID,
        numPed: "1121",
        alocadoPorId: user.id,
        emprestimoVenceEm: MAIS_ANTIGO,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: semFoto.id,
        cargaId: CARGA_ID,
        numPed: "1122",
        alocadoPorId: user.id,
        emprestimoVenceEm: VENCIDO,
      },
    });
  }

  it("lista o vencido e esconde devolvido, outra custódia, no prazo, venda e troca", async () => {
    await seed();
    const resultado = await useCase().execute({ role: Role.ADMIN, now: NOW });
    const daProva = resultado.itens.filter((item) => item.identificador.startsWith(PREFIX));

    assert.deepEqual(
      daProva.map((item) => item.identificador),
      [`${PREFIX}antigo`, `${PREFIX}sem-foto`, `${PREFIX}vencido`],
    );

    const vencido = daProva.find((item) => item.identificador === `${PREFIX}vencido`);
    assert.ok(vencido);
    assert.equal(vencido.cliente, "Cliente Aberto");
    assert.equal(vencido.codCli, "C1");
    assert.equal(vencido.numPed, "1120");
    assert.equal(vencido.codCar, COD_CAR);
    assert.equal(vencido.codRep, 17);
    assert.equal(vencido.emprestimoVenceEm.toISOString(), VENCIDO.toISOString());

    const semFoto = daProva.find((item) => item.identificador === `${PREFIX}sem-foto`);
    assert.equal(semFoto?.cliente, null);
    assert.equal(semFoto?.codCli, null);
    assert.equal(semFoto?.codRep, null);
    assert.equal(semFoto?.numPed, "1122");
  });
});
