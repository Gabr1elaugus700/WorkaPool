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
});
