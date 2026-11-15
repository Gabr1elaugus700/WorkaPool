import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import checklistModeloRoutes from "../../../../src/features/workOrder/routes/checklistModeloRoutes";
import itemChecklistRoutes from "../../../../src/features/workOrder/routes/itemChecklistRoutes";
import { ensureIbcChecklistSchema } from "../../../helpers/ensureIbcChecklistSchema";
import { ensureIbcInspecaoSchema } from "../../../helpers/ensureIbcInspecaoSchema";

const FIXTURE_PREFIX = "test-ibc-275-";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc", ibcRoutes);
  app.use("/api/checklist-modelo", checklistModeloRoutes);
  app.use("/api/item-checklist", itemChecklistRoutes);
  return app;
}

function bearer(role: Role): string {
  return `Bearer ${jwt.sign({ id: `${FIXTURE_PREFIX}user`, role }, JWT_SECRET)}`;
}

async function cleanupFixtures(): Promise<void> {
  await prisma.ibcInspecaoResposta.deleteMany({
    where: { checklistItem: { descricao: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.ibcInspecao.deleteMany({
    where: { ibc: { identificador: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.ibc.deleteMany({ where: { identificador: { startsWith: FIXTURE_PREFIX } } });
  await prisma.user.deleteMany({ where: { user: { startsWith: FIXTURE_PREFIX } } });
  await prisma.checklistModeloItem.deleteMany({
    where: { checklistItem: { descricao: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.checklistModelo.deleteMany({
    where: { nome: { startsWith: FIXTURE_PREFIX } },
  });
  await prisma.checklistItem.deleteMany({
    where: { descricao: { startsWith: FIXTURE_PREFIX } },
  });
}

describe("IBC checklist itens HTTP persistence (#275)", () => {
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

  it("creates, lists, edits and deactivates an item with critico", async () => {
    const app = createTestApp();

    const created = await request(app)
      .post("/api/ibc/checklist-itens")
      .set("Authorization", bearer(Role.ALMOX))
      .send({ descricao: `  ${FIXTURE_PREFIX}Tampa  `, critico: true });
    assert.equal(created.status, 201);
    assert.equal(created.body.descricao, `${FIXTURE_PREFIX}Tampa`);
    assert.equal(created.body.critico, true);
    assert.equal(created.body.ativo, true);

    const listed = await request(app)
      .get("/api/ibc/checklist-itens")
      .set("Authorization", bearer(Role.ADMIN));
    assert.equal(listed.status, 200);
    const found = listed.body.find((item: { id: string }) => item.id === created.body.id);
    assert.ok(found);

    const edited = await request(app)
      .patch(`/api/ibc/checklist-itens/${created.body.id}`)
      .set("Authorization", bearer(Role.ALMOX))
      .send({ descricao: `${FIXTURE_PREFIX}Tampa e lacre`, critico: false });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.descricao, `${FIXTURE_PREFIX}Tampa e lacre`);
    assert.equal(edited.body.critico, false);

    const deactivated = await request(app)
      .patch(`/api/ibc/checklist-itens/${created.body.id}`)
      .set("Authorization", bearer(Role.ALMOX))
      .send({ ativo: false });
    assert.equal(deactivated.status, 200);
    assert.equal(deactivated.body.ativo, false);

    const row = await prisma.checklistItem.findUnique({ where: { id: created.body.id } });
    assert.equal(row?.ativo, false);
  });

  it("critico defaults to false", async () => {
    const created = await request(createTestApp())
      .post("/api/ibc/checklist-itens")
      .set("Authorization", bearer(Role.ADMIN))
      .send({ descricao: `${FIXTURE_PREFIX}Base` });
    assert.equal(created.status, 201);
    assert.equal(created.body.critico, false);
    assert.equal(created.body.tipo, "NUMERICO");
    assert.equal(created.body.respostaEsperada, null);
    assert.equal(created.body.bloqueante, null);
  });

  it("creates sim/não item and rejects missing bloqueante", async () => {
    const app = createTestApp();
    const incomplete = await request(app)
      .post("/api/ibc/checklist-itens")
      .set("Authorization", bearer(Role.ALMOX))
      .send({
        descricao: `${FIXTURE_PREFIX}Lacre`,
        tipo: "SIM_NAO",
        respostaEsperada: "SIM",
      });
    assert.equal(incomplete.status, 400);
    assert.equal(incomplete.body.code, "IBC_CHECKLIST_ITEM_INVALID_BODY");

    const created = await request(app)
      .post("/api/ibc/checklist-itens")
      .set("Authorization", bearer(Role.ALMOX))
      .send({
        descricao: `${FIXTURE_PREFIX}Lacre`,
        tipo: "SIM_NAO",
        respostaEsperada: "SIM",
        bloqueante: true,
      });
    assert.equal(created.status, 201);
    assert.equal(created.body.tipo, "SIM_NAO");
    assert.equal(created.body.respostaEsperada, "SIM");
    assert.equal(created.body.bloqueante, true);
    assert.equal(created.body.critico, false);

    const listed = await request(app)
      .get("/api/ibc/checklist-itens")
      .set("Authorization", bearer(Role.ADMIN));
    const found = listed.body.find((item: { id: string }) => item.id === created.body.id);
    assert.equal(found?.tipo, "SIM_NAO");
  });

  it("PATCH troca tipo mesmo com IbcInspecaoResposta do item", async () => {
    await ensureIbcInspecaoSchema(prisma);
    const app = createTestApp();
    const user = await prisma.user.create({
      data: {
        user: `${FIXTURE_PREFIX}ana`,
        password: "hashed",
        role: Role.ALMOX,
        name: "Ana",
      },
    });
    const item = await prisma.checklistItem.create({
      data: { descricao: `${FIXTURE_PREFIX}Valvula`, critico: true },
    });
    const ibc = await prisma.ibc.create({
      data: { identificador: `${FIXTURE_PREFIX}H001`, aptidao: "APTO" },
    });
    const checklist = await prisma.checklistModelo.create({
      data: {
        nome: `${FIXTURE_PREFIX}Soda`,
        tipo: "IBC",
        notaMinimaCritico: 7,
        mediaMinima: 6,
        itens: { create: [{ checklistItemId: item.id, ordem: 0 }] },
      },
    });
    const inspecaoId = `${FIXTURE_PREFIX}inspecao`;
    await prisma.$executeRaw`
      INSERT INTO "IbcInspecao" (
        "id", "ibcId", "checklistModeloId", "resultado",
        "notaMinimaCritico", "mediaMinima", "inspetorId", "inspecionadoEm"
      ) VALUES (
        ${inspecaoId}, ${ibc.id}, ${checklist.id}, 'APROVADA'::"IbcInspecaoResultado",
        7, 6, ${user.id}, NOW()
      )
    `;
    await prisma.$executeRaw`
      INSERT INTO "IbcInspecaoResposta" (
        "id", "inspecaoId", "checklistItemId", "nota", "critico", "descricao"
      ) VALUES (
        ${`${FIXTURE_PREFIX}resposta`}, ${inspecaoId}, ${item.id}, 8, true, ${item.descricao}
      )
    `;

    const response = await request(app)
      .patch(`/api/ibc/checklist-itens/${item.id}`)
      .set("Authorization", bearer(Role.ALMOX))
      .send({
        tipo: "SIM_NAO",
        respostaEsperada: "NAO",
        bloqueante: false,
      });
    assert.equal(response.status, 200);
    assert.equal(response.body.tipo, "SIM_NAO");
    assert.equal(response.body.bloqueante, false);

    const respostas = await prisma.$queryRaw<{ nota: number }[]>`
      SELECT "nota" FROM "IbcInspecaoResposta" WHERE "checklistItemId" = ${item.id}
    `;
    assert.equal(respostas[0]?.nota, 8);
  });

  it("vistoria cria item só com descrição como numérico", async () => {
    const created = await request(createTestApp())
      .post("/api/item-checklist")
      .send({ descricao: `${FIXTURE_PREFIX}Vistoria item` });
    assert.equal(created.status, 201);
    const row = await prisma.checklistItem.findUnique({ where: { id: created.body.id } });
    assert.equal(row?.tipo, "NUMERICO");
    assert.equal(row?.respostaEsperada, null);
    assert.equal(row?.bloqueante, null);
  });

  it("rejects blank descricao and empty patch", async () => {
    const app = createTestApp();
    const blank = await request(app)
      .post("/api/ibc/checklist-itens")
      .set("Authorization", bearer(Role.ALMOX))
      .send({ descricao: "   " });
    assert.equal(blank.status, 400);
    assert.equal(blank.body.code, "IBC_CHECKLIST_ITEM_INVALID_BODY");

    const empty = await request(app)
      .patch("/api/ibc/checklist-itens/any-id")
      .set("Authorization", bearer(Role.ALMOX))
      .send({});
    assert.equal(empty.status, 400);
  });

  it("returns 404 when editing a missing item", async () => {
    const response = await request(createTestApp())
      .patch("/api/ibc/checklist-itens/00000000-0000-0000-0000-000000000000")
      .set("Authorization", bearer(Role.ALMOX))
      .send({ ativo: false });
    assert.equal(response.status, 404);
    assert.equal(response.body.code, "IBC_CHECKLIST_ITEM_NOT_FOUND");
  });

  it("Vistoria listing does not return IBC checklists", async () => {
    const vistoria = await prisma.checklistModelo.create({
      data: { nome: `${FIXTURE_PREFIX}Vistoria` },
    });
    const ibc = await prisma.checklistModelo.create({
      data: {
        nome: `${FIXTURE_PREFIX}Checklist Soda`,
        tipo: "IBC",
        notaMinimaCritico: 7,
        mediaMinima: 6,
      },
    });

    const response = await request(createTestApp()).get("/api/checklist-modelo");
    assert.equal(response.status, 200);
    const ids = response.body.map((modelo: { id: string }) => modelo.id);
    assert.ok(ids.includes(vistoria.id));
    assert.ok(!ids.includes(ibc.id));

    const byId = await request(createTestApp()).get(`/api/checklist-modelo/${ibc.id}`);
    assert.equal(byId.body?.id, undefined);
  });
});
