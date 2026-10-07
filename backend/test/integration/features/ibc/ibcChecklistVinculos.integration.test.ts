import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { ChecklistTipo, PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { ensureIbcChecklistSchema } from "../../../helpers/ensureIbcChecklistSchema";

const FIXTURE_PREFIX = "test-ibc-277-";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const ACTOR_ID = `${FIXTURE_PREFIX}user`;

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
  return `Bearer ${jwt.sign({ id: ACTOR_ID, role }, JWT_SECRET)}`;
}

async function cleanupFixtures(): Promise<void> {
  await prisma.ibcChecklistVinculo.deleteMany({
    where: { ibc: { identificador: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.checklistModeloItem.deleteMany({
    where: { checklistModelo: { nome: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.checklistModelo.deleteMany({ where: { nome: { startsWith: FIXTURE_PREFIX } } });
  await prisma.checklistItem.deleteMany({ where: { descricao: { startsWith: FIXTURE_PREFIX } } });
  await prisma.ibc.deleteMany({ where: { identificador: { startsWith: FIXTURE_PREFIX } } });
}

async function createIbc(): Promise<string> {
  const ibc = await prisma.ibc.create({
    data: {
      identificador: `${FIXTURE_PREFIX}H0001`,
      aptidao: "INAPTO",
      motivoInaptidao: "DATA_LIMITE",
      custodia: "PATIO",
      tipoCadastro: "NOVO",
      dataLimite: new Date("2020-01-01T00:00:00.000Z"),
    },
  });
  return ibc.id;
}

async function createChecklist(
  nome: string,
  options: { tipo?: ChecklistTipo; ativo?: boolean } = {},
): Promise<string> {
  const item = await prisma.checklistItem.create({ data: { descricao: `${FIXTURE_PREFIX}${nome}-item` } });
  const checklist = await prisma.checklistModelo.create({
    data: {
      nome: `${FIXTURE_PREFIX}${nome}`,
      tipo: options.tipo ?? ChecklistTipo.IBC,
      ativo: options.ativo ?? true,
      notaMinimaCritico: 7,
      mediaMinima: 6,
      itens: { create: [{ checklistItemId: item.id, ordem: 0 }] },
    },
  });
  return checklist.id;
}

type VinculoBody = {
  checklistModeloId: string;
  ativo: boolean;
  totalItens: number;
  vinculadoPorId: string;
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

  it("lists linked checklists by name, including inactive ones", async () => {
    const app = createTestApp();
    const ibcId = await createIbc();
    const soda = await createChecklist("Soda", { ativo: false });
    const estrutural = await createChecklist("Estrutural");
    await prisma.ibcChecklistVinculo.createMany({
      data: [soda, estrutural].map((checklistModeloId) => ({
        ibcId,
        checklistModeloId,
        vinculadoPorId: ACTOR_ID,
      })),
    });

    const listed = await request(app)
      .get(`/api/ibc/${ibcId}/checklists`)
      .set("Authorization", bearer(Role.LOGISTICA));

    assert.equal(listed.status, 200);
    assert.deepEqual(
      (listed.body as VinculoBody[]).map(({ checklistModeloId, ativo, totalItens, vinculadoPorId }) => ({
        checklistModeloId,
        ativo,
        totalItens,
        vinculadoPorId,
      })),
      [
        { checklistModeloId: estrutural, ativo: true, totalItens: 1, vinculadoPorId: ACTOR_ID },
        { checklistModeloId: soda, ativo: false, totalItens: 1, vinculadoPorId: ACTOR_ID },
      ],
    );
  });

  it("returns 404 for unknown IBC", async () => {
    const response = await request(createTestApp())
      .get("/api/ibc/8d7f903e-f53d-4c62-80b2-48f3c9655d71/checklists")
      .set("Authorization", bearer(Role.ALMOX));
    assert.equal(response.status, 404);
    assert.equal(response.body.code, "IBC_NOT_FOUND");
  });
});
