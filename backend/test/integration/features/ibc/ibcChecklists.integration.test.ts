import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { ensureIbcChecklistSchema } from "../../../helpers/ensureIbcChecklistSchema";

const FIXTURE_PREFIX = "test-ibc-276-";
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
  return app;
}

function bearer(role: Role): string {
  return `Bearer ${jwt.sign({ id: `${FIXTURE_PREFIX}user`, role }, JWT_SECRET)}`;
}

async function cleanupFixtures(): Promise<void> {
  await prisma.checklistModeloItem.deleteMany({
    where: {
      OR: [
        { checklistItem: { descricao: { startsWith: FIXTURE_PREFIX } } },
        { checklistModelo: { nome: { startsWith: FIXTURE_PREFIX } } },
      ],
    },
  });
  await prisma.checklistModelo.deleteMany({ where: { nome: { startsWith: FIXTURE_PREFIX } } });
  await prisma.checklistItem.deleteMany({ where: { descricao: { startsWith: FIXTURE_PREFIX } } });
}

async function createItem(descricao: string, ativo = true): Promise<string> {
  const item = await prisma.checklistItem.create({
    data: { descricao: `${FIXTURE_PREFIX}${descricao}`, ativo },
  });
  return item.id;
}

type ItemNoChecklist = { itemId: string; ordem: number; ativo: boolean };

describe("IBC checklists HTTP persistence (#276)", () => {
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

  it("creates, lists, reads, edits itens order and deactivates a checklist", async () => {
    const app = createTestApp();
    const tampa = await createItem("Tampa");
    const base = await createItem("Base");
    const valvula = await createItem("Válvula");

    const created = await request(app)
      .post("/api/ibc/checklists")
      .set("Authorization", bearer(Role.ALMOX))
      .send({
        nome: `  ${FIXTURE_PREFIX}Checklist Soda  `,
        notaMinimaCritico: 7,
        mediaMinima: 6.5,
        itensIds: [tampa, base],
      });
    assert.equal(created.status, 201);
    assert.equal(created.body.nome, `${FIXTURE_PREFIX}Checklist Soda`);
    assert.equal(created.body.notaMinimaCritico, 7);
    assert.equal(created.body.mediaMinima, 6.5);
    assert.equal(created.body.ativo, true);
    assert.deepEqual(
      created.body.itens.map((item: ItemNoChecklist) => [item.itemId, item.ordem]),
      [[tampa, 0], [base, 1]],
    );
    const id: string = created.body.id;

    const row = await prisma.checklistModelo.findUnique({ where: { id } });
    assert.equal(row?.tipo, "IBC");

    const listed = await request(app)
      .get("/api/ibc/checklists")
      .set("Authorization", bearer(Role.LOGISTICA));
    assert.equal(listed.status, 200);
    const summary = listed.body.find((checklist: { id: string }) => checklist.id === id);
    assert.equal(summary?.totalItens, 2);

    const edited = await request(app)
      .patch(`/api/ibc/checklists/${id}`)
      .set("Authorization", bearer(Role.ADMIN))
      .send({ nome: `${FIXTURE_PREFIX}Estrutural`, mediaMinima: 8, itensIds: [valvula, tampa] });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.nome, `${FIXTURE_PREFIX}Estrutural`);
    assert.equal(edited.body.mediaMinima, 8);
    assert.equal(edited.body.notaMinimaCritico, 7);
    assert.deepEqual(
      edited.body.itens.map((item: ItemNoChecklist) => [item.itemId, item.ordem]),
      [[valvula, 0], [tampa, 1]],
    );

    const deactivated = await request(app)
      .patch(`/api/ibc/checklists/${id}`)
      .set("Authorization", bearer(Role.ALMOX))
      .send({ ativo: false });
    assert.equal(deactivated.status, 200);
    assert.equal(deactivated.body.ativo, false);
    assert.equal(deactivated.body.itens.length, 2);

    const read = await request(app)
      .get(`/api/ibc/checklists/${id}`)
      .set("Authorization", bearer(Role.ALMOX));
    assert.equal(read.status, 200);
    assert.equal(read.body.ativo, false);
  });

  it("requires notas between 0 and 10 and rejects duplicate itens", async () => {
    const app = createTestApp();
    const tampa = await createItem("Tampa");
    const valid = { nome: `${FIXTURE_PREFIX}Soda`, notaMinimaCritico: 7, mediaMinima: 6, itensIds: [tampa] };

    const bodies = [
      { ...valid, notaMinimaCritico: undefined },
      { ...valid, mediaMinima: undefined },
      { ...valid, notaMinimaCritico: -1 },
      { ...valid, mediaMinima: 10.5 },
      { ...valid, mediaMinima: null },
      { ...valid, itensIds: [tampa, tampa] },
      { ...valid, itensIds: [] },
    ];
    for (const body of bodies) {
      const response = await request(app)
        .post("/api/ibc/checklists")
        .set("Authorization", bearer(Role.ALMOX))
        .send(body);
      assert.equal(response.status, 400, JSON.stringify(body));
      assert.equal(response.body.code, "IBC_CHECKLIST_INVALID_BODY");
    }

    const boundaries = await request(app)
      .post("/api/ibc/checklists")
      .set("Authorization", bearer(Role.ALMOX))
      .send({ ...valid, notaMinimaCritico: 0, mediaMinima: 10 });
    assert.equal(boundaries.status, 201);

    const patchNull = await request(app)
      .patch(`/api/ibc/checklists/${boundaries.body.id}`)
      .set("Authorization", bearer(Role.ALMOX))
      .send({ notaMinimaCritico: null });
    assert.equal(patchNull.status, 400);
  });

  it("refuses inactive item on create and on newly added, keeps one already present", async () => {
    const app = createTestApp();
    const tampa = await createItem("Tampa");
    const inativo = await createItem("Inativo", false);

    const createWithInactive = await request(app)
      .post("/api/ibc/checklists")
      .set("Authorization", bearer(Role.ALMOX))
      .send({ nome: `${FIXTURE_PREFIX}Soda`, notaMinimaCritico: 7, mediaMinima: 6, itensIds: [tampa, inativo] });
    assert.equal(createWithInactive.status, 422);
    assert.equal(createWithInactive.body.code, "IBC_CHECKLIST_ITEM_INATIVO");
    assert.deepEqual(createWithInactive.body.details, { itensIds: [inativo] });

    const created = await request(app)
      .post("/api/ibc/checklists")
      .set("Authorization", bearer(Role.ALMOX))
      .send({ nome: `${FIXTURE_PREFIX}Soda`, notaMinimaCritico: 7, mediaMinima: 6, itensIds: [tampa] });
    assert.equal(created.status, 201);

    const addInactive = await request(app)
      .patch(`/api/ibc/checklists/${created.body.id}`)
      .set("Authorization", bearer(Role.ALMOX))
      .send({ itensIds: [tampa, inativo] });
    assert.equal(addInactive.status, 422);
    assert.equal(addInactive.body.code, "IBC_CHECKLIST_ITEM_INATIVO");

    await prisma.checklistItem.update({ where: { id: tampa }, data: { ativo: false } });
    const keep = await request(app)
      .patch(`/api/ibc/checklists/${created.body.id}`)
      .set("Authorization", bearer(Role.ALMOX))
      .send({ itensIds: [tampa] });
    assert.equal(keep.status, 200);
    assert.equal(keep.body.itens[0].ativo, false);
  });

  it("returns 404 for unknown item, missing checklist and Vistoria checklist", async () => {
    const app = createTestApp();
    const unknownItem = await request(app)
      .post("/api/ibc/checklists")
      .set("Authorization", bearer(Role.ALMOX))
      .send({
        nome: `${FIXTURE_PREFIX}Soda`,
        notaMinimaCritico: 7,
        mediaMinima: 6,
        itensIds: ["00000000-0000-0000-0000-000000000000"],
      });
    assert.equal(unknownItem.status, 404);
    assert.equal(unknownItem.body.code, "IBC_CHECKLIST_ITEM_NOT_FOUND");

    const vistoria = await prisma.checklistModelo.create({ data: { nome: `${FIXTURE_PREFIX}Vistoria` } });
    for (const id of [vistoria.id, "00000000-0000-0000-0000-000000000000"]) {
      const get = await request(app)
        .get(`/api/ibc/checklists/${id}`)
        .set("Authorization", bearer(Role.ALMOX));
      const patch = await request(app)
        .patch(`/api/ibc/checklists/${id}`)
        .set("Authorization", bearer(Role.ALMOX))
        .send({ ativo: false });
      assert.equal(get.status, 404);
      assert.equal(get.body.code, "IBC_CHECKLIST_NOT_FOUND");
      assert.equal(patch.status, 404);
    }

    const listed = await request(app)
      .get("/api/ibc/checklists")
      .set("Authorization", bearer(Role.ALMOX));
    const ids = listed.body.map((checklist: { id: string }) => checklist.id);
    assert.ok(!ids.includes(vistoria.id));
  });
});
