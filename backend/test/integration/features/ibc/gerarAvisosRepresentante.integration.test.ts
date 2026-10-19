import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { AvisoRepresentanteRepository } from "../../../../src/features/ibc/repositories/AvisoRepresentanteRepository";
import { GerarAvisosRepresentanteUseCase } from "../../../../src/features/ibc/useCases/GerarAvisosRepresentante.use-case";
import { conciliacaoViagem } from "../../../../src/features/ibc/services/conciliacaoViagem";
import type { FicouNaViagem } from "../../../../src/features/ibc/services/planejarFechamentoViagem";
import prismaPadrao from "../../../../src/config/prisma";
import { ensureIbcCadastroSchema } from "../../../helpers/ensureIbcCadastroSchema";
import { ensureProcessedEventSchema } from "../../../helpers/ensureProcessedEventSchema";

const PREFIX = "test-aviso-39-";
const COD_CAR = 39039;
const PEDIDO_SAIDA = "3899";
const NUM_PED = "3901";
const NUM_PED_INCLUSO = "3903";
const NUM_PED_SEM_REP = "3902";
const COD_REP = 39;
const COD_REP_SAIDA = 7;
const COD_REP_INCLUSO = 88;
const CONSUMER = "IBC_AVISO_REPRESENTANTE";
const FECHADA_EM = new Date("2026-10-19T00:00:00.000Z");
const VENCIMENTO = conciliacaoViagem.vencimento(FECHADA_EM);
const PRAZO_MS = 90 * 24 * 60 * 60 * 1000;

const prisma = new PrismaClient();
const eventIds: string[] = [];

function isItemAviso(value: unknown): value is {
  modalidade: string;
  emprestimoVenceEm: string | null;
} {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  if (!("modalidade" in value) || !("emprestimoVenceEm" in value)) return false;
  const venceEm = value.emprestimoVenceEm;
  return (
    typeof value.modalidade === "string" &&
    (venceEm === null || typeof venceEm === "string")
  );
}

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

async function ensureAvisoSchema(): Promise<void> {
  await ensureIbcCadastroSchema(prisma);
  await ensureProcessedEventSchema(prisma);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "ExpedicaoIbc" ADD COLUMN IF NOT EXISTS "viagemFechadaPorId" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "ExpedicaoIbc" ADD COLUMN IF NOT EXISTS "viagemFechadaEm" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AlocacaoIbc" ADD COLUMN IF NOT EXISTS "encerradaEm" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AlocacaoIbc" ADD COLUMN IF NOT EXISTS "emprestimoIniciadoEm" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AlocacaoIbc" ADD COLUMN IF NOT EXISTS "emprestimoVenceEm" TIMESTAMP(3)`,
  );
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
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "baixaViagemEm" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "trocaEntradaId" TEXT`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AvisoRepresentanteIbc" (
      "id" TEXT NOT NULL,
      "expedicaoIbcId" TEXT NOT NULL,
      "codCar" INTEGER NOT NULL,
      "numPed" TEXT NOT NULL,
      "codCli" TEXT,
      "cliente" TEXT NOT NULL,
      "codRep" INTEGER NOT NULL,
      "itens" JSONB NOT NULL,
      "lidoEm" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AvisoRepresentanteIbc_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "AvisoRepresentanteIbc_expedicaoIbcId_numPed_key" ON "AvisoRepresentanteIbc"("expedicaoIbcId", "numPed")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "AvisoRepresentanteIbc_codRep_createdAt_idx" ON "AvisoRepresentanteIbc"("codRep", "createdAt")`,
  );
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "AvisoRepresentanteIbc"
        ADD CONSTRAINT "AvisoRepresentanteIbc_expedicaoIbcId_fkey"
        FOREIGN KEY ("expedicaoIbcId") REFERENCES "ExpedicaoIbc"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
}

async function cleanup(): Promise<void> {
  await prisma.avisoRepresentanteIbc.deleteMany({ where: { codCar: COD_CAR } });
  if (eventIds.length > 0) {
    await prisma.processedEvent.deleteMany({ where: { eventId: { in: eventIds.splice(0) } } });
  }
  await prisma.alocacaoIbc.deleteMany({ where: { cargaId: { startsWith: PREFIX } } });
  await prisma.expedicaoIbc.deleteMany({ where: { cargaId: { startsWith: PREFIX } } });
  await prisma.cargasFechadas.deleteMany({ where: { cargaId: { startsWith: PREFIX } } });
  await prisma.ibc.deleteMany({ where: { identificador: { startsWith: PREFIX } } });
  await prisma.cargas.deleteMany({
    where: { OR: [{ id: { startsWith: PREFIX } }, { codCar: COD_CAR }] },
  });
  await prisma.user.deleteMany({ where: { user: { startsWith: PREFIX } } });
}

function useCase(): GerarAvisosRepresentanteUseCase {
  return new GerarAvisosRepresentanteUseCase(new AvisoRepresentanteRepository(prisma));
}

describe("GerarAvisosRepresentante persiste na transação (#39)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureAvisoSchema();
    await cleanup();
  });

  after(async () => {
    await cleanup();
    await prisma.$disconnect();
    await prismaPadrao.$disconnect();
  });

  it("dois empréstimos e um incluso deixam um aviso só dos empréstimos, com o pedido da volta", async () => {
    const cargaId = `${PREFIX}carga`;
    const user = await prisma.user.create({
      data: {
        user: `${PREFIX}almox`,
        password: "hashed",
        role: Role.ALMOX,
        name: "Almox Teste",
      },
    });
    await prisma.cargas.create({
      data: {
        id: cargaId,
        codCar: COD_CAR,
        destino: "Cliente W",
        pesoMax: 10000,
        custoMin: 0,
        situacao: "FECHADA",
      },
    });
    const incluso = await prisma.ibc.create({
      data: { identificador: `${PREFIX}HM00001`, aptidao: "APTO", custodia: "PATIO" },
    });
    const emprestimo = await prisma.ibc.create({
      data: { identificador: `${PREFIX}HM00002`, aptidao: "APTO", custodia: "PATIO" },
    });
    const emprestimoDois = await prisma.ibc.create({
      data: { identificador: `${PREFIX}HM00004`, aptidao: "APTO", custodia: "PATIO" },
    });
    const semRep = await prisma.ibc.create({
      data: { identificador: `${PREFIX}HM00003`, aptidao: "APTO", custodia: "PATIO" },
    });
    const expedicao = await prisma.expedicaoIbc.create({
      data: { cargaId, fechadoPorId: user.id },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: incluso.id,
        cargaId,
        numPed: PEDIDO_SAIDA,
        alocadoPorId: user.id,
        expedicaoIbcId: expedicao.id,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: emprestimo.id,
        cargaId,
        numPed: PEDIDO_SAIDA,
        alocadoPorId: user.id,
        expedicaoIbcId: expedicao.id,
        emprestimoVenceEm: VENCIMENTO,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: emprestimoDois.id,
        cargaId,
        numPed: PEDIDO_SAIDA,
        alocadoPorId: user.id,
        expedicaoIbcId: expedicao.id,
        emprestimoVenceEm: VENCIMENTO,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: semRep.id,
        cargaId,
        numPed: PEDIDO_SAIDA,
        alocadoPorId: user.id,
        expedicaoIbcId: expedicao.id,
        emprestimoVenceEm: new Date("2030-01-01T00:00:00.000Z"),
      },
    });
    await prisma.cargasFechadas.create({
      data: {
        cargaId,
        pedidos: [
          { numPed: PEDIDO_SAIDA, codRep: COD_REP_SAIDA, codCli: "C0", cliente: "Cliente da Saída" },
          { numPed: NUM_PED, codRep: COD_REP, codCli: "C1", cliente: "Cliente da Volta" },
          { numPed: NUM_PED_INCLUSO, codRep: COD_REP_INCLUSO, codCli: "C2", cliente: "Cliente Incluso" },
          { numPed: NUM_PED_SEM_REP, cliente: "Cliente Sem Rep" },
        ],
      },
    });

    const ficaram: FicouNaViagem[] = [
      {
        ibcId: incluso.id,
        identificador: `${PREFIX}HM00001`,
        modalidade: "VENDA",
        codCli: "C2",
        cliente: "Cliente Incluso",
        numPed: NUM_PED_INCLUSO,
      },
      {
        ibcId: emprestimo.id,
        identificador: `${PREFIX}HM00002`,
        modalidade: "EMPRESTIMO",
        codCli: "C1",
        cliente: "Cliente da Volta",
        numPed: NUM_PED,
      },
      {
        ibcId: emprestimoDois.id,
        identificador: `${PREFIX}HM00004`,
        modalidade: "EMPRESTIMO",
        codCli: "C1",
        cliente: "Cliente da Volta",
        numPed: NUM_PED,
      },
      {
        ibcId: semRep.id,
        identificador: `${PREFIX}HM00003`,
        modalidade: "EMPRESTIMO",
        codCli: null,
        cliente: "Cliente Sem Rep",
        numPed: NUM_PED_SEM_REP,
      },
    ];
    const eventId = randomUUID();
    eventIds.push(eventId);
    const gerar = useCase();
    const avisosLog: string[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => {
      avisosLog.push(args.map((parte) => String(parte)).join(" "));
    };

    try {
      const primeiro = await gerar.execute({
        eventId,
        expedicaoIbcId: expedicao.id,
        codCar: COD_CAR,
        ficaram,
      });
      const segundo = await gerar.execute({
        eventId,
        expedicaoIbcId: expedicao.id,
        codCar: COD_CAR,
        ficaram,
      });
      assert.equal(primeiro.inseridos, 1);
      assert.equal(segundo.inseridos, 0);
    } finally {
      console.warn = original;
    }

    const doPedido = await prisma.avisoRepresentanteIbc.findMany({
      where: { expedicaoIbcId: expedicao.id },
    });
    assert.equal(doPedido.length, 1);
    assert.equal(doPedido[0]?.numPed, NUM_PED);
    assert.equal(doPedido[0]?.codRep, COD_REP);
    assert.equal(doPedido[0]?.cliente, "Cliente da Volta");
    const itens = doPedido[0]?.itens;
    assert.ok(Array.isArray(itens));
    assert.equal(itens.length, 2);
    assert.equal(itens.some((item) => isItemAviso(item) && item.modalidade === "VENDA"), false);
    assert.equal(VENCIMENTO.getTime() - FECHADA_EM.getTime(), PRAZO_MS);
    assert.deepEqual(
      itens.filter(isItemAviso).map((item) => ({
        modalidade: item.modalidade,
        emprestimoVenceEm: item.emprestimoVenceEm,
      })),
      [
        { modalidade: "EMPRESTIMO", emprestimoVenceEm: VENCIMENTO.toISOString() },
        { modalidade: "EMPRESTIMO", emprestimoVenceEm: VENCIMENTO.toISOString() },
      ],
    );
    assert.equal(
      await prisma.processedEvent.count({ where: { consumerName: CONSUMER, eventId } }),
      1,
    );
    assert.ok(avisosLog.some((linha) => linha.includes(NUM_PED_SEM_REP)));
    assert.equal(avisosLog.some((linha) => linha.includes(NUM_PED_INCLUSO)), false);

    const alocacao = await prisma.alocacaoIbc.findFirst({
      where: { ibcId: emprestimo.id },
      select: { emprestimoVenceEm: true, encerradaEm: true },
    });
    assert.equal(alocacao?.emprestimoVenceEm?.toISOString(), VENCIMENTO.toISOString());
    assert.equal(alocacao?.encerradaEm, null);
    const ibcEmprestimo = await prisma.ibc.findUnique({ where: { id: emprestimo.id } });
    assert.equal(ibcEmprestimo?.motivoBaixa, null);
    assert.equal(ibcEmprestimo?.custodia, "PATIO");
  });

  it("ficaram vazio deixa zero avisos e um ProcessedEvent", async () => {
    const eventId = randomUUID();
    const expedicaoIbcId = randomUUID();
    eventIds.push(eventId);

    const resultado = await useCase().execute({
      eventId,
      expedicaoIbcId,
      codCar: COD_CAR,
      ficaram: [],
    });

    assert.deepEqual(resultado, { inseridos: 0 });
    assert.equal(
      await prisma.avisoRepresentanteIbc.count({ where: { expedicaoIbcId } }),
      0,
    );
    assert.equal(
      await prisma.processedEvent.count({ where: { consumerName: CONSUMER, eventId } }),
      1,
    );
  });
});
