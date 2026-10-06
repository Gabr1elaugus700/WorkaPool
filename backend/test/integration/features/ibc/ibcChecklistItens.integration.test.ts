import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import checklistModeloRoutes from "../../../../src/features/workOrder/routes/checklistModeloRoutes";
import { ensureIbcChecklistSchema } from "../../../helpers/ensureIbcChecklistSchema";

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
  return app;
}

function bearer(role: Role): string {
  return `Bearer ${jwt.sign({ id: `${FIXTURE_PREFIX}user`, role }, JWT_SECRET)}`;
}

async function cleanupFixtures(): Promise<void> {
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
