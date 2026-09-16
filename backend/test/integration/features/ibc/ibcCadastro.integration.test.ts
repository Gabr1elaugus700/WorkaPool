import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { ensureIbcCadastroSchema } from "../../../helpers/ensureIbcCadastroSchema";

const FIXTURE_PREFIX = "test-ibc-91-";
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

function createToken(role: Role, id = "ibc-cadastro-almox"): string {
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
        { identificador: { startsWith: "TCA" } },
        { produto: { is: { nome: { startsWith: FIXTURE_PREFIX } } } },
      ],
    },
  });
  await prisma.ibcProduto.deleteMany({
    where: {
      OR: [
        { nome: { startsWith: FIXTURE_PREFIX } },
        { abreviacao: { equals: "SA" } },
      ],
    },
  });
  await prisma.user.deleteMany({
    where: { user: { startsWith: FIXTURE_PREFIX } },
  });
}

describe("IBC cadastro HTTP persistence (#91)", () => {
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
    const created = await request(createIbcTestApp())
      .post("/api/ibc/produtos")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: `${FIXTURE_PREFIX}Soda`, abreviacao: "SA" });
    assert.equal(created.status, 201);
    return String(created.body.id);
  }

  it("POST creates Novo IBC persisted with HM identifier", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);
    const produtoId = await createProduto(token);

    const response = await request(app)
      .post("/api/ibc")
      .set("Authorization", `Bearer ${token}`)
      .send({ dataLimite: FUTURE_DATA_LIMITE, produtoId });

    assert.equal(response.status, 201);
    assert.match(response.body.identificador, /^HMSA\d{5}$/);
    assert.equal(response.body.tipoCadastro, "NOVO");
    assert.equal(response.body.aptidao, "INAPTO");
    assert.equal(response.body.motivoInaptidao, "AGUARDANDO_INSPECAO");
    assert.equal(response.body.custodia, "PATIO");

    const row = await prisma.ibc.findUnique({
      where: { identificador: response.body.identificador },
    });
    assert.ok(row);
    assert.equal(row.tipoCadastro, "NOVO");
    assert.equal(row.motivoInaptidao, "AGUARDANDO_INSPECAO");
    assert.equal(row.produtoId, produtoId);
  });

  it("produto endpoints create, list and edit", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);

    const created = await request(app)
      .post("/api/ibc/produtos")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: `${FIXTURE_PREFIX}Acido`, abreviacao: "a" });
    assert.equal(created.status, 201);
    assert.equal(created.body.abreviacao, "A");

    const list = await request(app)
      .get("/api/ibc/produtos")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(list.status, 200);
    assert.ok(
      list.body.some(
        (row: { id: string; abreviacao: string }) =>
          row.id === created.body.id && row.abreviacao === "A",
      ),
    );

    const updated = await request(app)
      .patch(`/api/ibc/produtos/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: `${FIXTURE_PREFIX}Acido Novo`, abreviacao: "SO" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.abreviacao, "SO");
  });

  it("GET pool lists active IBCs and omits baixados by default", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);

    const active = await prisma.ibc.create({
      data: {
        identificador: "TCA0101",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        tipoCadastro: "NOVO",
        dataLimite: new Date("2099-12-31T00:00:00.000Z"),
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: "TCA0102",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        tipoCadastro: "NOVO",
        dataLimite: new Date("2099-12-31T00:00:00.000Z"),
        baixadoEm: new Date("2026-09-01T00:00:00.000Z"),
      },
    });

    const response = await request(app)
      .get("/api/ibc")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
    const ids = response.body.map((row: { id: string }) => row.id);
    assert.ok(ids.includes(active.id));
    assert.equal(
      response.body.some((row: { identificador: string }) => row.identificador === "TCA0102"),
      false,
    );
  });

  it("GET alerts returns awaiting and expired identifiers", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);

    await prisma.ibc.create({
      data: {
        identificador: "TCA0201",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        tipoCadastro: "NOVO",
        dataLimite: new Date("2099-12-31T00:00:00.000Z"),
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: "TCA0202",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        tipoCadastro: "NOVO",
        dataLimite: new Date("2020-01-01T00:00:00.000Z"),
      },
    });

    const response = await request(app)
      .get("/api/ibc/alerts")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    const byId = new Map(
      response.body.map((row: { identificador: string; motivo: string }) => [
        row.identificador,
        row.motivo,
      ]),
    );
    assert.equal(byId.get("TCA0201"), "AGUARDANDO_INSPECAO");
    assert.equal(byId.get("TCA0202"), "DATA_LIMITE");
  });

  it("PATCH data limite and DELETE soft-delete round-trip", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);
    const created = await prisma.ibc.create({
      data: {
        identificador: "TCA0301",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        tipoCadastro: "NOVO",
        dataLimite: new Date("2099-06-01T00:00:00.000Z"),
      },
    });

    const patched = await request(app)
      .patch(`/api/ibc/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ dataLimite: "2099-08-15" });

    assert.equal(patched.status, 200);
    assert.ok(String(patched.body.dataLimite).startsWith("2099-08-15"));

    const deleted = await request(app)
      .delete(`/api/ibc/${created.id}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(deleted.status, 200);
    assert.ok(deleted.body.baixadoEm != null);

    const listDefault = await request(app)
      .get("/api/ibc")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(
      listDefault.body.some(
        (row: { identificador: string }) => row.identificador === "TCA0301",
      ),
      false,
    );

    const listAudit = await request(app)
      .get("/api/ibc?incluirBaixados=true")
      .set("Authorization", `Bearer ${token}`);
    const baixado = listAudit.body.find(
      (row: { identificador: string }) => row.identificador === "TCA0301",
    );
    assert.ok(baixado);
    assert.ok(baixado.baixadoEm != null);
  });
});
