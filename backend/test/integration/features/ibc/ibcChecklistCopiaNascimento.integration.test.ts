import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { IbcCadastroRepository } from "../../../../src/features/ibc/repositories/IbcCadastroRepository";
import { ensureIbcChecklistSchema } from "../../../helpers/ensureIbcChecklistSchema";

const FIXTURE_PREFIX = "test-ibc-453-";
const GRUPO_PREFIX = "t453";
const SEM_PRODUTO_PREFIXO = "NHZT";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const FUTURE_DATA_LIMITE = "2099-12-31";

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(`Integration tests require workapool_test, received ${databaseUrl.pathname}`);
  }
}

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc", ibcRoutes);
  return app;
}

function bearer(userId: string): string {
  return `Bearer ${jwt.sign({ id: userId, role: Role.ALMOX }, JWT_SECRET)}`;
}

async function cleanupFixtures(): Promise<void> {
  const ibcs = await prisma.ibc.findMany({
    where: {
      OR: [
        { identificador: { startsWith: FIXTURE_PREFIX } },
        { prefixo: SEM_PRODUTO_PREFIXO },
        { produto: { is: { grupoCodigo: { startsWith: GRUPO_PREFIX } } } },
      ],
    },
    select: { id: true },
  });
  const ids = ibcs.map((ibc) => ibc.id);
  await prisma.ibcConversionHistory.deleteMany({
    where: { OR: [{ fromContainerId: { in: ids } }, { toContainerId: { in: ids } }] },
  });
  await prisma.ibc.updateMany({ where: { id: { in: ids } }, data: { convertedToContainerId: null } });
  await prisma.ibcChecklistVinculo.deleteMany({ where: { ibcId: { in: ids } } });
  await prisma.ibc.deleteMany({ where: { id: { in: ids } } });
  await prisma.ibcChecklistPadrao.deleteMany({
    where: { produto: { grupoCodigo: { startsWith: GRUPO_PREFIX } } },
  });
  await prisma.ibcProduto.deleteMany({ where: { grupoCodigo: { startsWith: GRUPO_PREFIX } } });
  await prisma.produtoGrupoMap.deleteMany({ where: { grupoCodigo: { startsWith: GRUPO_PREFIX } } });
  await prisma.checklistModelo.deleteMany({ where: { nome: { startsWith: FIXTURE_PREFIX } } });
  await prisma.user.deleteMany({ where: { user: { startsWith: FIXTURE_PREFIX } } });
}

async function createUser(login: string) {
  return prisma.user.create({
    data: { user: `${FIXTURE_PREFIX}${login}`, password: "hashed", role: Role.ALMOX, name: login },
  });
}

async function createChecklist(nome: string, ativo = true) {
  return prisma.checklistModelo.create({
    data: { nome: `${FIXTURE_PREFIX}${nome}`, tipo: "IBC", notaMinimaCritico: 7, mediaMinima: 6, ativo },
  });
}

async function createProduto(sufixo: string, sigla: string, corHex: string) {
  const grupoCodigo = `${GRUPO_PREFIX}${sufixo}`;
  await prisma.produtoGrupoMap.create({
    data: { produtoCodigo: grupoCodigo, grupoCodigo, grupoDescricao: `${FIXTURE_PREFIX}${sufixo}`, syncedAt: new Date() },
  });
  return prisma.ibcProduto.create({ data: { grupoCodigo, sigla, corHex, universal: false } });
}

async function padrao(produtoId: string, checklistModeloIds: string[], autorId: string): Promise<void> {
  await prisma.ibcChecklistPadrao.createMany({
    data: checklistModeloIds.map((checklistModeloId) => ({
      produtoId,
      checklistModeloId,
      situacao: "ENTRADA_PATIO" as const,
      vinculadoPorId: autorId,
    })),
  });
}

async function vinculosDe(ibcId: string) {
  return prisma.ibcChecklistVinculo.findMany({
    where: { ibcId },
    select: { checklistModeloId: true, situacao: true, vinculadoPorId: true },
  });
}

describe("IBC nasce com a cópia do checklist padrão (#453)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureIbcChecklistSchema(prisma);
    await cleanupFixtures();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("cadastro unitário copia só os ativos do padrão, com o autor do cadastro, e o padrão mudado depois não altera a unidade", async () => {
    const app = createTestApp();
    const dono = await createUser("dono");
    const ana = await createUser("ana");
    const grupo = await createProduto("A", "YA", "#453A01");
    const ativo = await createChecklist("Ativo");
    const inativo = await createChecklist("Inativo", false);
    await padrao(grupo.id, [ativo.id, inativo.id], dono.id);

    const response = await request(app)
      .post("/api/ibc")
      .set("Authorization", bearer(ana.id))
      .send({ dataLimite: FUTURE_DATA_LIMITE, homologado: true, grupoCodigo: grupo.grupoCodigo });

    assert.equal(response.status, 201);
    assert.equal(response.body.aptidao, "APTO");
    assert.equal(response.body.motivoInaptidao, null);
    assert.equal(response.body.primeiraInspecaoEm, null);
    assert.deepEqual(await vinculosDe(response.body.id), [
      { checklistModeloId: ativo.id, situacao: "ENTRADA_PATIO", vinculadoPorId: ana.id },
    ]);

    const outro = await createChecklist("Outro");
    await prisma.ibcChecklistPadrao.deleteMany({ where: { produtoId: grupo.id } });
    await padrao(grupo.id, [outro.id], dono.id);
    assert.deepEqual(
      (await vinculosDe(response.body.id)).map((vinculo) => vinculo.checklistModeloId),
      [ativo.id],
    );
  });

  it("lote copia o padrão para cada IBC do lote", async () => {
    const app = createTestApp();
    const ana = await createUser("ana");
    const grupo = await createProduto("B", "YB", "#453B01");
    const ativo = await createChecklist("Ativo");
    const segundo = await createChecklist("Segundo");
    await padrao(grupo.id, [ativo.id, segundo.id], ana.id);

    const response = await request(app)
      .post("/api/ibc/lote")
      .set("Authorization", bearer(ana.id))
      .send({ quantidade: 3, dataLimite: FUTURE_DATA_LIMITE, homologado: true, grupoCodigo: grupo.grupoCodigo });

    assert.equal(response.status, 201);
    const items = response.body.items as { id: string }[];
    assert.equal(items.length, 3);
    for (const item of items) {
      const ids = (await vinculosDe(item.id)).map((vinculo) => vinculo.checklistModeloId).sort();
      assert.deepEqual(ids, [ativo.id, segundo.id].sort());
    }
  });

  it("mudança de produto copia o padrão do destino e não os vínculos da origem", async () => {
    const app = createTestApp();
    const ana = await createUser("ana");
    const bia = await createUser("bia");
    const origem = await createProduto("C", "YC", "#453C01");
    const destino = await createProduto("D", "YD", "#453D01");
    const daOrigem = await createChecklist("Da origem");
    const doDestino = await createChecklist("Do destino");
    const inativoDestino = await createChecklist("Inativo destino", false);
    await padrao(origem.id, [daOrigem.id], ana.id);
    await padrao(destino.id, [doDestino.id, inativoDestino.id], ana.id);

    const source = await request(app)
      .post("/api/ibc")
      .set("Authorization", bearer(ana.id))
      .send({ dataLimite: FUTURE_DATA_LIMITE, homologado: false, grupoCodigo: origem.grupoCodigo });
    assert.equal(source.status, 201);
    assert.equal((await vinculosDe(source.body.id)).length, 1);

    const changed = await request(app)
      .patch(`/api/ibc/${source.body.id}/produto`)
      .set("Authorization", bearer(bia.id))
      .send({ produtoId: destino.id, confirmado: true });

    assert.equal(changed.status, 201);
    assert.deepEqual(await vinculosDe(changed.body.id), [
      { checklistModeloId: doDestino.id, situacao: "ENTRADA_PATIO", vinculadoPorId: bia.id },
    ]);
    assert.equal((await vinculosDe(source.body.id)).length, 1);
  });

  it("conversão copia o padrão do destino e não o vínculo manual da origem", async () => {
    const app = createTestApp();
    const ana = await createUser("ana");
    const grupo = await createProduto("E", "YE", "#453E01");
    const doPadrao = await createChecklist("Do padrão");
    const manual = await createChecklist("Manual");
    await padrao(grupo.id, [doPadrao.id], ana.id);

    const source = await request(app)
      .post("/api/ibc")
      .set("Authorization", bearer(ana.id))
      .send({ dataLimite: FUTURE_DATA_LIMITE, homologado: true, grupoCodigo: grupo.grupoCodigo });
    assert.equal(source.status, 201);
    await prisma.ibcChecklistVinculo.create({
      data: { ibcId: source.body.id, checklistModeloId: manual.id, vinculadoPorId: ana.id },
    });

    const converted = await request(app)
      .patch(`/api/ibc/${source.body.id}/converter-nao-homologado`)
      .set("Authorization", bearer(ana.id))
      .send({ confirmado: true, destino: "manter_grupo" });

    assert.equal(converted.status, 201);
    assert.equal(converted.body.aptidao, source.body.aptidao);
    assert.deepEqual(
      (await vinculosDe(converted.body.id)).map((vinculo) => vinculo.checklistModeloId),
      [doPadrao.id],
    );
  });

  it("produto sem padrão e IBC derivado sem produto nascem com zero vínculos", async () => {
    const app = createTestApp();
    const ana = await createUser("ana");
    const grupo = await createProduto("F", "YF", "#453F01");

    const semPadrao = await request(app)
      .post("/api/ibc")
      .set("Authorization", bearer(ana.id))
      .send({ dataLimite: FUTURE_DATA_LIMITE, homologado: true, grupoCodigo: grupo.grupoCodigo });
    assert.equal(semPadrao.status, 201);
    assert.equal((await vinculosDe(semPadrao.body.id)).length, 0);

    const source = await prisma.ibc.create({
      data: { identificador: `${FIXTURE_PREFIX}HM001`, aptidao: "APTO" },
    });
    const derivado = await new IbcCadastroRepository(prisma).createDerivedIbcFromSource({
      sourceIbcId: source.id,
      prefixo: SEM_PRODUTO_PREFIXO,
      produtoId: null,
      actorId: ana.id,
      observation: null,
      changeType: "conversion",
      placa: { identificadorAnterior: source.identificador, corAnterior: null, corNova: null },
    });
    assert.equal((await vinculosDe(derivado.id)).length, 0);
  });

  it("entrada de troca copia o padrão e mantém a inaptidão do cadastro", async () => {
    const ana = await createUser("ana");
    const grupo = await createProduto("G", "YG", "#453A0C");
    const ativo = await createChecklist("Ativo");
    await padrao(grupo.id, [ativo.id], ana.id);

    const [entrada] = await new IbcCadastroRepository(prisma).createNovoIbcs(
      {
        prefixo: "HMYG",
        tipoCadastro: "TROCA",
        aquisicao: "TROCA",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        dataLimite: new Date(`${FUTURE_DATA_LIMITE}T00:00:00.000Z`),
        primeiraInspecaoEm: null,
        produtoId: grupo.id,
        autorId: ana.id,
      },
      1,
    );

    assert.ok(entrada);
    assert.equal(entrada.aptidao, "INAPTO");
    assert.equal(entrada.motivoInaptidao, "AGUARDANDO_INSPECAO");
    assert.deepEqual(await vinculosDe(entrada.id), [
      { checklistModeloId: ativo.id, situacao: "ENTRADA_PATIO", vinculadoPorId: ana.id },
    ]);
  });

  it("falha na cópia desfaz o cadastro", async () => {
    const ana = await createUser("ana");
    const grupo = await createProduto("H", "YH", "#453A0B");
    const ativo = await createChecklist("Ativo");
    await padrao(grupo.id, [ativo.id], ana.id);

    await assert.rejects(() =>
      new IbcCadastroRepository(prisma).createNovoIbcs(
        {
          prefixo: "HMYH",
          tipoCadastro: "NOVO",
          aptidao: "APTO",
          motivoInaptidao: null,
          custodia: "PATIO",
          dataLimite: new Date(`${FUTURE_DATA_LIMITE}T00:00:00.000Z`),
          primeiraInspecaoEm: null,
          produtoId: grupo.id,
          autorId: "00000000-0000-4000-8000-000000000453",
        },
        2,
      ),
    );
    assert.equal(await prisma.ibc.count({ where: { produtoId: grupo.id } }), 0);
  });
});
