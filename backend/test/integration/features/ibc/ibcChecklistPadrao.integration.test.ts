import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { ensureIbcChecklistSchema } from "../../../helpers/ensureIbcChecklistSchema";

const FIXTURE_PREFIX = "test-ibc-452-";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

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

function bearer(userId: string, role: Role): string {
  return `Bearer ${jwt.sign({ id: userId, role }, JWT_SECRET)}`;
}

async function cleanupFixtures(): Promise<void> {
  await prisma.ibcChecklistPadrao.deleteMany({
    where: { produto: { corHex: { startsWith: "#452" } } },
  });
  await prisma.ibcChecklistVinculo.deleteMany({
    where: { ibc: { identificador: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.ibc.deleteMany({ where: { identificador: { startsWith: FIXTURE_PREFIX } } });
  await prisma.ibcProduto.deleteMany({ where: { corHex: { startsWith: "#452" } } });
  await prisma.checklistModelo.deleteMany({ where: { nome: { startsWith: FIXTURE_PREFIX } } });
  await prisma.user.deleteMany({ where: { user: { startsWith: FIXTURE_PREFIX } } });
}

async function createUser(login: string, name: string, role: Role = Role.ALMOX) {
  return prisma.user.create({
    data: { user: `${FIXTURE_PREFIX}${login}`, password: "hashed", role, name },
  });
}

async function createProduto(corHex: string) {
  return prisma.ibcProduto.create({
    data: {
      corHex,
      universal: false,
      grupoCodigo: corHex.slice(1),
      sigla: corHex.slice(5).toUpperCase(),
    },
  });
}

async function createChecklist(nome: string, ativo = true) {
  return prisma.checklistModelo.create({
    data: { nome: `${FIXTURE_PREFIX}${nome}`, tipo: "IBC", notaMinimaCritico: 7, mediaMinima: 6, ativo },
  });
}

describe("IBC checklist padrão HTTP (#452)", () => {
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

  it("lists padrões by name for a group and for the universal config, or []", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const grupo = await createProduto("#4521A1");
    const universalExistente = await prisma.ibcProduto.findFirst({ where: { universal: true } });
    const universal = universalExistente ?? (await prisma.ibcProduto.create({
      data: { corHex: "#4521B2", universal: true },
    }));
    const vazio = await createProduto("#4521C3");
    const estrutural = await createChecklist("A Estrutural");
    const soda = await createChecklist("B Soda");
    const vinculadoEm = new Date("2026-11-09T12:00:00.000Z");
    await prisma.ibcChecklistPadrao.create({
      data: {
        produtoId: grupo.id,
        checklistModeloId: soda.id,
        situacao: "ENTRADA_PATIO",
        vinculadoPorId: ana.id,
        vinculadoEm,
      },
    });
    await prisma.ibcChecklistPadrao.create({
      data: {
        produtoId: grupo.id,
        checklistModeloId: estrutural.id,
        situacao: "ENTRADA_PATIO",
        vinculadoPorId: ana.id,
        vinculadoEm,
      },
    });
    await prisma.checklistModelo.update({ where: { id: estrutural.id }, data: { ativo: false } });

    const lista = await request(app)
      .get(`/api/ibc/produtos/${grupo.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.LOGISTICA));
    assert.equal(lista.status, 200);
    assert.deepEqual(
      (lista.body as { checklistModeloId: string; ativo: boolean }[]).map((item) => ({
        id: item.checklistModeloId,
        ativo: item.ativo,
      })),
      [
        { id: estrutural.id, ativo: false },
        { id: soda.id, ativo: true },
      ],
    );
    assert.equal("situacao" in (lista.body as object[])[0], false);

    const universalAntes = await request(app)
      .get(`/api/ibc/produtos/${universal.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.GERENTE_DPTO));
    assert.equal(universalAntes.status, 200);
    const universalCriado = await request(app)
      .post(`/api/ibc/produtos/${universal.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.ALMOX))
      .send({ checklistModeloId: soda.id });
    assert.equal(universalCriado.status, 201);
    const universalLista = await request(app)
      .get(`/api/ibc/produtos/${universal.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.GERENTE_DPTO));
    assert.equal((universalLista.body as unknown[]).length, (universalAntes.body as unknown[]).length + 1);
    await request(app)
      .delete(`/api/ibc/produtos/${universal.id}/checklists/${soda.id}`)
      .set("Authorization", bearer(ana.id, Role.ALMOX));

    const vazia = await request(app)
      .get(`/api/ibc/produtos/${vazio.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.ADMIN));
    assert.deepEqual(vazia.body, []);
  });

  it("creates ENTRADA_PATIO padrão, refuses invalid cases, and deletes without touching unit links", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const vendas = await createUser("vendas", "Vera", Role.VENDAS);
    const grupo = await createProduto("#4522A1");
    const outro = await createProduto("#4522B2");
    const soda = await createChecklist("Soda");
    const inativo = await createChecklist("Inativo", false);
    const vistoria = await prisma.checklistModelo.create({ data: { nome: `${FIXTURE_PREFIX}Vistoria` } });
    const ibc = await prisma.ibc.create({
      data: { identificador: `${FIXTURE_PREFIX}H001`, aptidao: "APTO", produtoId: grupo.id },
    });
    await prisma.ibcChecklistVinculo.create({
      data: { ibcId: ibc.id, checklistModeloId: soda.id, vinculadoPorId: ana.id },
    });

    const post = (produtoId: string, body: object, role: Role = Role.ALMOX, userId = ana.id) =>
      request(app)
        .post(`/api/ibc/produtos/${produtoId}/checklists`)
        .set("Authorization", bearer(userId, role))
        .send(body);

    const forbidden = await post(grupo.id, { checklistModeloId: soda.id }, Role.LOGISTICA);
    assert.equal(forbidden.status, 403);

    const invalidBody = await post(grupo.id, {});
    assert.equal(invalidBody.status, 400);
    assert.equal(invalidBody.body.code, "IBC_CHECKLIST_PADRAO_INVALID_BODY");

    const badProduto = await post("nao-uuid", { checklistModeloId: soda.id });
    assert.equal(badProduto.status, 404);
    assert.equal(badProduto.body.code, "IBC_PRODUTO_NOT_FOUND");

    const missingProduto = await post("00000000-0000-4000-8000-000000000000", { checklistModeloId: soda.id });
    assert.equal(missingProduto.status, 404);
    assert.equal(missingProduto.body.code, "IBC_PRODUTO_NOT_FOUND");

    const cases: [string, number, string][] = [
      [vistoria.id, 422, "IBC_CHECKLIST_TIPO_INVALIDO"],
      [inativo.id, 422, "IBC_CHECKLIST_INATIVO"],
      ["00000000-0000-4000-8000-000000000001", 404, "IBC_CHECKLIST_NOT_FOUND"],
    ];
    for (const [checklistModeloId, status, code] of cases) {
      const response = await post(grupo.id, { checklistModeloId });
      assert.equal(response.status, status);
      assert.equal(response.body.code, code);
    }

    const created = await post(grupo.id, { checklistModeloId: soda.id });
    assert.equal(created.status, 201);
    assert.equal(created.body.checklistModeloId, soda.id);
    assert.equal(created.body.vinculadoPor.id, ana.id);
    assert.equal("situacao" in created.body, false);
    const stored = await prisma.ibcChecklistPadrao.findFirstOrThrow({
      where: { produtoId: grupo.id, checklistModeloId: soda.id },
    });
    assert.equal(stored.situacao, "ENTRADA_PATIO");

    const duplicate = await post(grupo.id, { checklistModeloId: soda.id });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.code, "IBC_CHECKLIST_PADRAO_JA_VINCULADO");

    const otherProduct = await post(outro.id, { checklistModeloId: soda.id });
    assert.equal(otherProduct.status, 201);

    const unread = await request(app)
      .get(`/api/ibc/produtos/${grupo.id}/checklists`)
      .set("Authorization", bearer(vendas.id, Role.VENDAS));
    assert.equal(unread.status, 403);

    const removed = await request(app)
      .delete(`/api/ibc/produtos/${grupo.id}/checklists/${soda.id}`)
      .set("Authorization", bearer(ana.id, Role.ALMOX));
    assert.equal(removed.status, 204);
    assert.equal(await prisma.ibcChecklistPadrao.count({ where: { produtoId: grupo.id } }), 0);
    assert.equal(await prisma.ibcChecklistVinculo.count({ where: { ibcId: ibc.id } }), 1);
    assert.equal(await prisma.ibc.count({ where: { id: ibc.id } }), 1);

    const missing = await request(app)
      .delete(`/api/ibc/produtos/${grupo.id}/checklists/${soda.id}`)
      .set("Authorization", bearer(ana.id, Role.ADMIN));
    assert.equal(missing.status, 404);
    assert.equal(missing.body.code, "IBC_CHECKLIST_PADRAO_NOT_FOUND");
  });

  it("keeps a single padrão when two requests race", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const grupo = await createProduto("#4523C3");
    const soda = await createChecklist("Soda");
    const responses = await Promise.all([
      request(app)
        .post(`/api/ibc/produtos/${grupo.id}/checklists`)
        .set("Authorization", bearer(ana.id, Role.ALMOX))
        .send({ checklistModeloId: soda.id }),
      request(app)
        .post(`/api/ibc/produtos/${grupo.id}/checklists`)
        .set("Authorization", bearer(ana.id, Role.ADMIN))
        .send({ checklistModeloId: soda.id }),
    ]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
    assert.equal(responses.find((response) => response.status === 409)?.body.code, "IBC_CHECKLIST_PADRAO_JA_VINCULADO");
    assert.equal(await prisma.ibcChecklistPadrao.count({ where: { produtoId: grupo.id } }), 1);
  });

  it("does not create unit links for an IBC that already exists when the schema is ensured", async () => {
    const ibc = await prisma.ibc.create({
      data: { identificador: `${FIXTURE_PREFIX}H900`, aptidao: "APTO" },
    });
    await ensureIbcChecklistSchema(prisma);
    assert.equal(await prisma.ibcChecklistVinculo.count({ where: { ibcId: ibc.id } }), 0);
  });
});
