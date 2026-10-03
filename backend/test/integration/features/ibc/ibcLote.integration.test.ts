import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { ensureIbcCadastroSchema } from "../../../helpers/ensureIbcCadastroSchema";

const FIXTURE_PREFIX = "test-ibc-117-";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const FUTURE_DATA_LIMITE = "2099-12-31";

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

function createIbcTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc", ibcRoutes);
  return app;
}

function createToken(role: Role, id = "ibc-lote-almox"): string {
  return jwt.sign({ id, role }, JWT_SECRET);
}

async function cleanupFixtures(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DELETE FROM "AlocacaoIbc"
    WHERE "ibcId" IN (
      SELECT i.id
      FROM "Ibc" i
      LEFT JOIN "IbcProduto" p ON p.id = i."produtoId"
      WHERE i."identificador" LIKE '${FIXTURE_PREFIX}%'
         OR p.nome LIKE '${FIXTURE_PREFIX}%'
    )
  `).catch(() => undefined);
  await prisma.ibc.deleteMany({
    where: {
      OR: [
        { identificador: { startsWith: FIXTURE_PREFIX } },
        { produto: { is: { nome: { startsWith: FIXTURE_PREFIX } } } },
      ],
    },
  });
  try {
    await prisma.ibcLote.deleteMany({});
  } catch {
    // table may not exist until ensure schema runs
  }
  try {
    await prisma.ibcProduto.deleteMany({
      where: {
        OR: [
          { nome: { startsWith: FIXTURE_PREFIX } },
          { abreviacao: { in: ["LO", "LX"] } },
        ],
      },
    });
  } catch {
    // table may not exist until ensure schema runs
  }
  await prisma.user.deleteMany({
    where: { user: { startsWith: FIXTURE_PREFIX } },
  });
}

describe("IBC lote HTTP persistence (#117 / #121)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureIbcCadastroSchema(prisma);
    await cleanupFixtures();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  async function createProduto(token: string): Promise<string> {
    const app = createIbcTestApp();
    const created = await request(app)
      .post("/api/ibc/produtos")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: `${FIXTURE_PREFIX}Soda`, abreviacao: "LO" });
    assert.equal(created.status, 201);
    return String(created.body.id);
  }

  it("POST lote persists N rows and returns identifiers", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);
    const produtoId = await createProduto(token);

    const response = await request(app)
      .post("/api/ibc/lote")
      .set("Authorization", `Bearer ${token}`)
      .send({ quantidade: 5, dataLimite: FUTURE_DATA_LIMITE, produtoId });

    assert.equal(response.status, 201);
    assert.equal(response.body.items.length, 5);
    assert.ok(response.body.lote?.id);
    assert.equal(response.body.lote.numeroNf, null);
    for (const item of response.body.items) {
      assert.match(item.identificador, /^HMLO\d{5}$/);
      assert.equal(item.tipoCadastro, "NOVO");
      assert.equal(item.aptidao, "INAPTO");
      assert.equal(item.motivoInaptidao, "AGUARDANDO_INSPECAO");
      assert.equal(item.custodia, "PATIO");
      assert.equal(item.loteId, response.body.lote.id);
      assert.equal(item.produtoId, produtoId);
    }

    const pool = await request(app)
      .get("/api/ibc")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(pool.status, 200);
    const ids = new Set(
      response.body.items.map((i: { identificador: string }) => i.identificador),
    );
    const listed = pool.body.filter((i: { identificador: string }) =>
      ids.has(i.identificador),
    );
    assert.equal(listed.length, 5);
  });

  it("POST lote with NF round-trips the NF trace", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);
    const produtoId = await createProduto(token);

    const response = await request(app)
      .post("/api/ibc/lote")
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantidade: 2,
        dataLimite: FUTURE_DATA_LIMITE,
        numeroNf: "998877",
        produtoId,
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.lote.numeroNf, "998877");

    const lote = await prisma.ibcLote.findUnique({
      where: { id: response.body.lote.id },
    });
    assert.ok(lote);
    assert.equal(lote.numeroNf, "998877");
  });
});
