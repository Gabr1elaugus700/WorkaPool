import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { FakeSaldoIbcErp } from "../../../../src/features/ibc/adapters/FakeSaldoIbcErp";
import { IbcCadastroRepository } from "../../../../src/features/ibc/repositories/IbcCadastroRepository";
import { IbcConciliacaoErpRepository } from "../../../../src/features/ibc/repositories/IbcConciliacaoErpRepository";
import { GetConciliacaoErpUseCase } from "../../../../src/features/ibc/useCases/GetConciliacaoErp.use-case";
import { AppError } from "../../../../src/utils/AppError";
import { ensureIbcCadastroSchema } from "../../../helpers/ensureIbcCadastroSchema";

const PREFIX = "test-ibc-119-";
const CARGA_ID = `${PREFIX}carga`;
const COD_CAR = 119119;
const VENCIMENTO = new Date("2026-06-01T00:00:00.000Z");
const VENCIMENTO_IGNORADO = new Date("2020-01-01T00:00:00.000Z");

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

async function ensureLeituraSchema(): Promise<void> {
  await ensureIbcCadastroSchema(prisma);
  await prisma.$executeRawUnsafe(`
    ALTER TYPE "IbcCustodia" ADD VALUE IF NOT EXISTS 'ENTRADA'
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TYPE "IbcCustodia" ADD VALUE IF NOT EXISTS 'CLIENTE'
  `);
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
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AlocacaoIbc" ADD COLUMN IF NOT EXISTS "encerradaEm" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "AlocacaoIbc" ADD COLUMN IF NOT EXISTS "emprestimoVenceEm" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Ibc_trocaEntradaId_key" ON "Ibc"("trocaEntradaId")
  `);
  // O helper de expedição recria o unique cheio em ibcId. A migration de
  // Fechar Viagem troca isso por um índice parcial (só alocação aberta),
  // para a encerrada poder coexistir.
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "AlocacaoIbc_ibcId_key"`);
}

async function cleanupFixtures(): Promise<void> {
  await prisma.ibc.updateMany({
    where: { identificador: { startsWith: PREFIX } },
    data: { convertedToContainerId: null, trocaEntradaId: null },
  });
  await prisma.alocacaoIbc.deleteMany({
    where: {
      OR: [{ ibc: { identificador: { startsWith: PREFIX } } }, { cargaId: CARGA_ID }],
    },
  });
  await prisma.ibc.deleteMany({
    where: { identificador: { startsWith: PREFIX } },
  });
  await prisma.ibcLote.deleteMany({
    where: { id: { startsWith: PREFIX } },
  });
  await prisma.cargaPedidoIbc.deleteMany({ where: { cargaId: CARGA_ID } });
  await prisma.cargas.deleteMany({ where: { id: CARGA_ID } });
  await prisma.user.deleteMany({ where: { user: { startsWith: PREFIX } } });
}

function useCase(quantity: number | null) {
  const saldo =
    quantity == null
      ? new FakeSaldoIbcErp({ status: "unavailable" })
      : new FakeSaldoIbcErp({ status: "available", quantity });
  return new GetConciliacaoErpUseCase(new IbcConciliacaoErpRepository(prisma), saldo);
}

function ids(prefixados: { identificador: string }[]): string[] {
  return prefixados
    .map((item) => item.identificador)
    .filter((identificador) => identificador.startsWith(PREFIX))
    .sort();
}

describe("conciliação ERP × pool (#119)", () => {
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
      data: {
        user: `${PREFIX}almox`,
        password: "hashed",
        role: Role.ALMOX,
        name: "Almox 119",
      },
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
          numPed: "42",
          codCli: "C1",
          cliente: "Cliente Aberto",
          quantidadeEsperadaTotal: 1,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 1,
        },
        {
          cargaId: CARGA_ID,
          numPed: "99",
          codCli: "C9",
          cliente: "Cliente Fechado",
          quantidadeEsperadaTotal: 1,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 1,
        },
        {
          cargaId: CARGA_ID,
          numPed: "7",
          codCli: "C2",
          cliente: "Comprador",
          quantidadeEsperadaTotal: 1,
          quantidadeEsperadaVenda: 1,
          quantidadeEsperadaEmprestimo: 0,
        },
        {
          cargaId: CARGA_ID,
          numPed: "3",
          codCli: "C3",
          cliente: "Troca Cliente",
          quantidadeEsperadaTotal: 1,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 0,
        },
        {
          cargaId: CARGA_ID,
          numPed: "8",
          codCli: "C8",
          cliente: "Viagem Cliente",
          quantidadeEsperadaTotal: 1,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 1,
        },
      ],
    });

    const loteComNf = await prisma.ibcLote.create({
      data: { id: `${PREFIX}lote-nf`, numeroNf: "NF-119", dataLimite: new Date("2099-01-01") },
    });
    const loteSemNf = await prisma.ibcLote.create({
      data: { id: `${PREFIX}lote-sem`, numeroNf: null, dataLimite: new Date("2099-01-01") },
    });

    const patio = await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}patio`,
        aptidao: "APTO",
        custodia: "PATIO",
        aquisicao: "COMPRA",
        loteId: loteComNf.id,
      },
    });
    const viagem = await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}viagem`,
        aptidao: "APTO",
        custodia: "EM_VIAGEM",
        aquisicao: "COMPRA",
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}entrada`,
        aptidao: "INAPTO",
        custodia: "ENTRADA",
        aquisicao: "COMPRA",
        loteId: loteSemNf.id,
      },
    });
    const emprestimo = await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}emprestimo`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        aquisicao: "COMPRA",
        loteId: loteComNf.id,
      },
    });
    const venda = await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}venda`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        motivoBaixa: "VENDA",
        aquisicao: "COMPRA",
      },
    });
    const trocaIn = await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}troca-in`,
        aptidao: "APTO",
        custodia: "PATIO",
        aquisicao: "TROCA",
      },
    });
    const trocaOut = await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}troca-out`,
        aptidao: "APTO",
        custodia: "CLIENTE",
        motivoBaixa: "TROCA",
        aquisicao: "COMPRA",
        trocaEntradaId: trocaIn.id,
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}baixado`,
        aptidao: "APTO",
        custodia: "PATIO",
        baixadoEm: new Date("2026-02-01T00:00:00.000Z"),
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: `${PREFIX}substituido`,
        aptidao: "APTO",
        custodia: "PATIO",
        convertedToContainerId: patio.id,
      },
    });

    await prisma.alocacaoIbc.create({
      data: {
        ibcId: emprestimo.id,
        cargaId: CARGA_ID,
        numPed: "42",
        alocadoPorId: user.id,
        alocadoEm: new Date("2026-03-01T00:00:00.000Z"),
        emprestimoVenceEm: VENCIMENTO,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: emprestimo.id,
        cargaId: CARGA_ID,
        numPed: "99",
        alocadoPorId: user.id,
        alocadoEm: new Date("2026-05-01T00:00:00.000Z"),
        encerradaEm: new Date("2026-05-02T00:00:00.000Z"),
        emprestimoVenceEm: VENCIMENTO_IGNORADO,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: venda.id,
        cargaId: CARGA_ID,
        numPed: "7",
        alocadoPorId: user.id,
        emprestimoVenceEm: VENCIMENTO_IGNORADO,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: trocaOut.id,
        cargaId: CARGA_ID,
        numPed: "3",
        alocadoPorId: user.id,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: viagem.id,
        cargaId: CARGA_ID,
        numPed: "8",
        alocadoPorId: user.id,
      },
    });
  }

  it("bate vivosWp com countVivosWp e separa os buckets do ciclo", async () => {
    await seed();
    const relatorio = await useCase(200).execute({ role: Role.ALMOX });
    const vivos = await new IbcCadastroRepository(prisma).countVivosWp();

    assert.equal(relatorio.vivosWp, vivos);
    assert.equal(relatorio.residual, 200 - vivos);
    assert.deepEqual(relatorio.itens, []);
    assert.deepEqual(relatorio.nfSemSerializar, { status: "indisponivel", count: null });
    const somaVivos = relatorio.buckets
      .filter((bucket) => bucket.entraNaSoma)
      .reduce((total, bucket) => total + bucket.count, 0);
    assert.equal(somaVivos, relatorio.vivosWp);

    const patio = await useCase(200).execute({ role: Role.ALMOX, bucket: "PATIO" });
    assert.deepEqual(ids(patio.itens), [`${PREFIX}patio`, `${PREFIX}troca-in`]);
    const trocaIn = patio.itens.find((item) => item.identificador === `${PREFIX}troca-in`);
    assert.equal(trocaIn?.parIdentificador, `${PREFIX}troca-out`);
    assert.equal(trocaIn?.numeroNf, null);
    const patioNf = patio.itens.find((item) => item.identificador === `${PREFIX}patio`);
    assert.equal(patioNf?.numeroNf, "NF-119");
    assert.equal(patioNf?.cliente, null);

    const viagem = await useCase(200).execute({ role: Role.LOGISTICA, bucket: "EM_VIAGEM" });
    assert.deepEqual(ids(viagem.itens), [`${PREFIX}viagem`]);
    assert.equal(viagem.itens.find((item) => item.identificador.startsWith(PREFIX))?.cliente, null);

    const entrada = await useCase(200).execute({ role: Role.ADMIN, bucket: "ENTRADA" });
    assert.deepEqual(ids(entrada.itens), [`${PREFIX}entrada`]);

    const noCliente = await useCase(200).execute({ role: Role.GERENTE_DPTO, bucket: "NO_CLIENTE" });
    const emprestimo = noCliente.itens.find((item) => item.identificador === `${PREFIX}emprestimo`);
    assert.ok(emprestimo);
    assert.equal(emprestimo.cliente, "Cliente Aberto");
    assert.equal(emprestimo.codCli, "C1");
    assert.equal(emprestimo.numPed, "42");
    assert.equal(emprestimo.emprestimoVenceEm?.toISOString(), VENCIMENTO.toISOString());
    assert.equal("atrasado" in emprestimo, false);

    const vendidos = await useCase(200).execute({ role: Role.ALMOX, bucket: "VENDIDOS" });
    const venda = vendidos.itens.find((item) => item.identificador === `${PREFIX}venda`);
    assert.equal(venda?.cliente, "Comprador");
    assert.equal(venda?.numPed, "7");
    assert.equal(venda?.emprestimoVenceEm, null);

    const troca = await useCase(200).execute({ role: Role.ALMOX, bucket: "TROCA" });
    const trocaOut = troca.itens.find((item) => item.identificador === `${PREFIX}troca-out`);
    assert.equal(trocaOut?.parIdentificador, `${PREFIX}troca-in`);
    assert.equal(trocaOut?.cliente, "Troca Cliente");

    const baixados = await useCase(200).execute({ role: Role.ALMOX, bucket: "BAIXADOS" });
    assert.ok(ids(baixados.itens).includes(`${PREFIX}baixado`));

    const substituidos = await useCase(200).execute({ role: Role.ALMOX, bucket: "SUBSTITUIDOS" });
    assert.ok(ids(substituidos.itens).includes(`${PREFIX}substituido`));

    const semNf = await useCase(200).execute({ role: Role.ALMOX, bucket: "SERIAL_SEM_NF" });
    assert.deepEqual(ids(semNf.itens), [`${PREFIX}entrada`, `${PREFIX}viagem`]);
  });

  it("mantém o residual nulo quando o saldo ERP não vem", async () => {
    await seed();
    const relatorio = await useCase(null).execute({ role: Role.ALMOX });
    const vivos = await new IbcCadastroRepository(prisma).countVivosWp();
    assert.equal(relatorio.residual, null);
    assert.equal(relatorio.vivosWp, vivos);
    assert.deepEqual(relatorio.saldoErp, { status: "unavailable" });
  });

  it("recusa VENDAS antes de classificar", async () => {
    await seed();
    await assert.rejects(
      () => useCase(200).execute({ role: Role.VENDAS }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "IBC_CONCILIACAO_ERP_FORBIDDEN");
        return true;
      },
    );
  });
});
