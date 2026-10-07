import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { ensureIbcChecklistSchema } from "../../../helpers/ensureIbcChecklistSchema";

const FIXTURE_PREFIX = "test-ibc-277-";
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

function bearer(userId: string, role: Role): string {
  return `Bearer ${jwt.sign({ id: userId, role }, JWT_SECRET)}`;
}

async function cleanupFixtures(): Promise<void> {
  await prisma.ibcChecklistVinculo.deleteMany({
    where: { ibc: { identificador: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.ibc.deleteMany({ where: { identificador: { startsWith: FIXTURE_PREFIX } } });
  await prisma.checklistModelo.deleteMany({ where: { nome: { startsWith: FIXTURE_PREFIX } } });
  await prisma.user.deleteMany({ where: { user: { startsWith: FIXTURE_PREFIX } } });
}

async function createUser(login: string, name: string) {
  return prisma.user.create({
    data: { user: `${FIXTURE_PREFIX}${login}`, password: "hashed", role: Role.ALMOX, name },
  });
}

async function createIbc(identificador: string, baixadoEm: Date | null = null) {
  return prisma.ibc.create({
    data: { identificador: `${FIXTURE_PREFIX}${identificador}`, aptidao: "APTO", baixadoEm },
  });
}

async function createIbcInapto(identificador: string) {
  return prisma.ibc.create({
    data: {
      identificador: `${FIXTURE_PREFIX}${identificador}`,
      aptidao: "INAPTO",
      motivoInaptidao: "DATA_LIMITE",
      primeiraInspecaoEm: new Date("2026-09-01T10:00:00.000Z"),
    },
  });
}

async function readAptidao(ibcId: string) {
  return prisma.ibc.findUniqueOrThrow({
    where: { id: ibcId },
    select: { aptidao: true, motivoInaptidao: true, primeiraInspecaoEm: true },
  });
}

async function createChecklist(nome: string, ativo = true) {
  return prisma.checklistModelo.create({
    data: { nome: `${FIXTURE_PREFIX}${nome}`, tipo: "IBC", notaMinimaCritico: 7, mediaMinima: 6, ativo },
  });
}

type VinculoBody = {
  checklistModeloId: string;
  nome: string;
  ativo: boolean;
  vinculadoEm: string;
  vinculadoPor: { id: string; nome: string };
};

describe("IBC checklist vínculos HTTP persistence (#277)", () => {
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

  it("lists vínculos by checklist name, including deactivated checklists", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const ibc = await createIbc("H001");
    const soda = await createChecklist("B Soda");
    const estrutural = await createChecklist("A Estrutural");
    const vinculadoEm = new Date("2026-10-06T12:00:00.000Z");
    for (const checklist of [soda, estrutural]) {
      await prisma.ibcChecklistVinculo.create({
        data: { ibcId: ibc.id, checklistModeloId: checklist.id, vinculadoPorId: ana.id, vinculadoEm },
      });
    }
    await prisma.checklistModelo.update({ where: { id: estrutural.id }, data: { ativo: false } });

    const response = await request(app)
      .get(`/api/ibc/${ibc.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.LOGISTICA));

    assert.equal(response.status, 200);
    assert.deepEqual(response.body as VinculoBody[], [
      {
        checklistModeloId: estrutural.id,
        nome: `${FIXTURE_PREFIX}A Estrutural`,
        ativo: false,
        vinculadoEm: vinculadoEm.toISOString(),
        vinculadoPor: { id: ana.id, nome: "Ana Almox" },
      },
      {
        checklistModeloId: soda.id,
        nome: `${FIXTURE_PREFIX}B Soda`,
        ativo: true,
        vinculadoEm: vinculadoEm.toISOString(),
        vinculadoPor: { id: ana.id, nome: "Ana Almox" },
      },
    ]);
  });

  it("returns [] for IBC without vínculos and lists a baixado IBC", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const semVinculo = await createIbc("H002");
    const baixado = await createIbc("H003", new Date("2026-10-05T00:00:00.000Z"));
    const soda = await createChecklist("Soda");
    await prisma.ibcChecklistVinculo.create({
      data: { ibcId: baixado.id, checklistModeloId: soda.id, vinculadoPorId: ana.id },
    });

    const vazio = await request(app)
      .get(`/api/ibc/${semVinculo.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.ALMOX));
    assert.equal(vazio.status, 200);
    assert.deepEqual(vazio.body, []);

    const listaBaixado = await request(app)
      .get(`/api/ibc/${baixado.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.ALMOX));
    assert.equal(listaBaixado.status, 200);
    assert.deepEqual(
      (listaBaixado.body as VinculoBody[]).map((v) => v.checklistModeloId),
      [soda.id],
    );
  });

  it("returns 404 IBC_NOT_FOUND for unknown or non-UUID IBC id", async () => {
    const app = createTestApp();
    for (const id of ["00000000-0000-0000-0000-000000000000", "nao-e-uuid"]) {
      const response = await request(app)
        .get(`/api/ibc/${id}/checklists`)
        .set("Authorization", bearer(`${FIXTURE_PREFIX}user`, Role.ALMOX));
      assert.equal(response.status, 404, id);
      assert.equal(response.body.code, "IBC_NOT_FOUND");
    }
  });

  it("links a checklist with the JWT user as author, keeps aptidão and allows it on another IBC", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const ibc = await createIbcInapto("H010");
    const outroIbc = await createIbc("H011");
    const soda = await createChecklist("Soda");
    const antes = await readAptidao(ibc.id);
    const inicio = Date.now();

    const created = await request(app)
      .post(`/api/ibc/${ibc.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.ALMOX))
      .send({ checklistModeloId: soda.id });

    assert.equal(created.status, 201);
    assert.equal(created.body.checklistModeloId, soda.id);
    assert.equal(created.body.nome, `${FIXTURE_PREFIX}Soda`);
    assert.equal(created.body.ativo, true);
    assert.deepEqual(created.body.vinculadoPor, { id: ana.id, nome: "Ana Almox" });
    assert.ok(Date.parse(created.body.vinculadoEm) >= inicio - 1000);
    assert.deepEqual(await readAptidao(ibc.id), antes);

    const listed = await request(app)
      .get(`/api/ibc/${ibc.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.ALMOX));
    assert.deepEqual(listed.body, [created.body]);

    const outro = await request(app)
      .post(`/api/ibc/${outroIbc.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.ADMIN))
      .send({ checklistModeloId: soda.id });
    assert.equal(outro.status, 201);
  });

  it("refuses VISTORIA, inactive, unknown and duplicate checklists and invalid bodies", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const ibc = await createIbc("H020");
    const soda = await createChecklist("Soda");
    const inativo = await createChecklist("Inativo", false);
    const vistoria = await prisma.checklistModelo.create({ data: { nome: `${FIXTURE_PREFIX}Vistoria` } });
    const post = (body: object) =>
      request(app)
        .post(`/api/ibc/${ibc.id}/checklists`)
        .set("Authorization", bearer(ana.id, Role.ALMOX))
        .send(body);

    const cases: [object, number, string][] = [
      [{ checklistModeloId: vistoria.id }, 422, "IBC_CHECKLIST_TIPO_INVALIDO"],
      [{ checklistModeloId: inativo.id }, 422, "IBC_CHECKLIST_INATIVO"],
      [{ checklistModeloId: "00000000-0000-0000-0000-000000000000" }, 404, "IBC_CHECKLIST_NOT_FOUND"],
      [{}, 400, "IBC_CHECKLIST_VINCULO_INVALID_BODY"],
      [{ checklistModeloId: "nao-e-uuid" }, 400, "IBC_CHECKLIST_VINCULO_INVALID_BODY"],
    ];
    for (const [body, status, code] of cases) {
      const response = await post(body);
      assert.equal(response.status, status, JSON.stringify(body));
      assert.equal(response.body.code, code);
    }

    assert.equal((await post({ checklistModeloId: soda.id })).status, 201);
    const duplicado = await post({ checklistModeloId: soda.id });
    assert.equal(duplicado.status, 409);
    assert.equal(duplicado.body.code, "IBC_CHECKLIST_JA_VINCULADO");
    assert.equal(await prisma.ibcChecklistVinculo.count({ where: { ibcId: ibc.id } }), 1);
  });

  it("creates a single vínculo under concurrent requests", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const ibc = await createIbc("H030");
    const soda = await createChecklist("Soda");

    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app)
          .post(`/api/ibc/${ibc.id}/checklists`)
          .set("Authorization", bearer(ana.id, Role.ALMOX))
          .send({ checklistModeloId: soda.id }),
      ),
    );

    assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
    assert.equal(responses.find((r) => r.status === 409)?.body.code, "IBC_CHECKLIST_JA_VINCULADO");
    assert.equal(await prisma.ibcChecklistVinculo.count({ where: { ibcId: ibc.id } }), 1);
  });

  it("refuses linking to a baixado or unknown IBC with 404 IBC_NOT_FOUND", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const baixado = await createIbc("H040", new Date("2026-10-05T00:00:00.000Z"));
    const soda = await createChecklist("Soda");

    for (const id of [baixado.id, "00000000-0000-0000-0000-000000000000"]) {
      const response = await request(app)
        .post(`/api/ibc/${id}/checklists`)
        .set("Authorization", bearer(ana.id, Role.ALMOX))
        .send({ checklistModeloId: soda.id });
      assert.equal(response.status, 404, id);
      assert.equal(response.body.code, "IBC_NOT_FOUND");
    }
  });

  it("unlinks (204) keeping aptidão, 404s a missing vínculo and relinks with new author", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const bruno = await createUser("bruno", "Bruno Admin");
    const ibc = await createIbcInapto("H050");
    const soda = await createChecklist("Soda");
    const antes = await readAptidao(ibc.id);
    const vincular = (userId: string) =>
      request(app)
        .post(`/api/ibc/${ibc.id}/checklists`)
        .set("Authorization", bearer(userId, Role.ALMOX))
        .send({ checklistModeloId: soda.id });
    const desvincular = () =>
      request(app)
        .delete(`/api/ibc/${ibc.id}/checklists/${soda.id}`)
        .set("Authorization", bearer(ana.id, Role.ALMOX));

    assert.equal((await vincular(ana.id)).status, 201);
    const removed = await desvincular();
    assert.equal(removed.status, 204);
    assert.deepEqual(await readAptidao(ibc.id), antes);

    const listed = await request(app)
      .get(`/api/ibc/${ibc.id}/checklists`)
      .set("Authorization", bearer(ana.id, Role.ALMOX));
    assert.deepEqual(listed.body, []);

    const missing = await desvincular();
    assert.equal(missing.status, 404);
    assert.equal(missing.body.code, "IBC_CHECKLIST_VINCULO_NOT_FOUND");

    const relinked = await vincular(bruno.id);
    assert.equal(relinked.status, 201);
    assert.deepEqual(relinked.body.vinculadoPor, { id: bruno.id, nome: "Bruno Admin" });
  });

  it("unlinks a checklist deactivated after linking", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const ibc = await createIbc("H060");
    const soda = await createChecklist("Soda");
    await prisma.ibcChecklistVinculo.create({
      data: { ibcId: ibc.id, checklistModeloId: soda.id, vinculadoPorId: ana.id },
    });
    await prisma.checklistModelo.update({ where: { id: soda.id }, data: { ativo: false } });

    const response = await request(app)
      .delete(`/api/ibc/${ibc.id}/checklists/${soda.id}`)
      .set("Authorization", bearer(ana.id, Role.ADMIN));
    assert.equal(response.status, 204);
    assert.equal(await prisma.ibcChecklistVinculo.count({ where: { ibcId: ibc.id } }), 0);
  });

  it("refuses unlinking from a baixado or unknown IBC with 404 IBC_NOT_FOUND", async () => {
    const app = createTestApp();
    const ana = await createUser("ana", "Ana Almox");
    const baixado = await createIbc("H070", new Date("2026-10-05T00:00:00.000Z"));
    const soda = await createChecklist("Soda");
    await prisma.ibcChecklistVinculo.create({
      data: { ibcId: baixado.id, checklistModeloId: soda.id, vinculadoPorId: ana.id },
    });

    for (const id of [baixado.id, "00000000-0000-0000-0000-000000000000"]) {
      const response = await request(app)
        .delete(`/api/ibc/${id}/checklists/${soda.id}`)
        .set("Authorization", bearer(ana.id, Role.ALMOX));
      assert.equal(response.status, 404, id);
      assert.equal(response.body.code, "IBC_NOT_FOUND");
    }
    assert.equal(await prisma.ibcChecklistVinculo.count({ where: { ibcId: baixado.id } }), 1);
  });
});
