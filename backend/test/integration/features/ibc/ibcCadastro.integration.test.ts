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
  await prisma.$executeRawUnsafe(
    `DELETE FROM "AlocacaoIbc" WHERE "ibcId" IN (SELECT id FROM "Ibc" WHERE "identificador" LIKE '${FIXTURE_PREFIX}%' OR "identificador" LIKE 'HM%')`,
  ).catch(() => undefined);
  await prisma.ibc.deleteMany({
    where: {
      OR: [
        { identificador: { startsWith: FIXTURE_PREFIX } },
        { identificador: { startsWith: "HM" } },
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

  it("POST creates Novo IBC persisted with HM identifier", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);

    const response = await request(app)
      .post("/api/ibc")
      .set("Authorization", `Bearer ${token}`)
      .send({ dataLimite: FUTURE_DATA_LIMITE });

    assert.equal(response.status, 201);
    assert.match(response.body.identificador, /^HM\d{4}$/);
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
  });

  it("GET pool lists active IBCs and omits baixados by default", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);

    const active = await prisma.ibc.create({
      data: {
        identificador: "HM0101",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        tipoCadastro: "NOVO",
        dataLimite: new Date("2099-12-31T00:00:00.000Z"),
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: "HM0102",
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
      response.body.some((row: { identificador: string }) => row.identificador === "HM0102"),
      false,
    );
  });

  it("GET alerts returns awaiting and expired identifiers", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);

    await prisma.ibc.create({
      data: {
        identificador: "HM0201",
        aptidao: "INAPTO",
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        custodia: "PATIO",
        tipoCadastro: "NOVO",
        dataLimite: new Date("2099-12-31T00:00:00.000Z"),
      },
    });
    await prisma.ibc.create({
      data: {
        identificador: "HM0202",
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
    assert.equal(byId.get("HM0201"), "AGUARDANDO_INSPECAO");
    assert.equal(byId.get("HM0202"), "DATA_LIMITE");
  });

  it("PATCH data limite and DELETE soft-delete round-trip", async () => {
    const app = createIbcTestApp();
    const token = createToken(Role.ALMOX);
    const created = await prisma.ibc.create({
      data: {
        identificador: "HM0301",
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
        (row: { identificador: string }) => row.identificador === "HM0301",
      ),
      false,
    );

    const listAudit = await request(app)
      .get("/api/ibc?incluirBaixados=true")
      .set("Authorization", `Bearer ${token}`);
    const baixado = listAudit.body.find(
      (row: { identificador: string }) => row.identificador === "HM0301",
    );
    assert.ok(baixado);
    assert.ok(baixado.baixadoEm != null);
  });
});
