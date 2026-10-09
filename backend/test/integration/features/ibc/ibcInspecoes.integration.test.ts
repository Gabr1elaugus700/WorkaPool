import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import request from "supertest";
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import { IbcCustodia, PrismaClient, Role } from "@prisma/client";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { ensureIbcExpedicaoSchema } from "../../../helpers/ensureIbcExpedicaoSchema";
import { ensureIbcInspecaoSchema } from "../../../helpers/ensureIbcInspecaoSchema";

const FIXTURE_PREFIX = "test-ibc-304-";
const COD_CAR = 304001;
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
  const ibcFilter = { ibc: { identificador: { startsWith: FIXTURE_PREFIX } } };
  const cargaFilter = { cargaId: { startsWith: FIXTURE_PREFIX } };
  await prisma.alocacaoIbc.deleteMany({ where: cargaFilter });
  await prisma.cargaPedidoIbc.deleteMany({ where: cargaFilter });
  await prisma.cargas.deleteMany({ where: { id: { startsWith: FIXTURE_PREFIX } } });
  await prisma.ibcInspecao.deleteMany({ where: ibcFilter });
  await prisma.ibcChecklistVinculo.deleteMany({ where: ibcFilter });
  await prisma.ibc.deleteMany({ where: { identificador: { startsWith: FIXTURE_PREFIX } } });
  await prisma.checklistModeloItem.deleteMany({
    where: { checklistModelo: { nome: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.checklistModelo.deleteMany({ where: { nome: { startsWith: FIXTURE_PREFIX } } });
  await prisma.checklistItem.deleteMany({ where: { descricao: { startsWith: FIXTURE_PREFIX } } });
  await prisma.user.deleteMany({ where: { user: { startsWith: FIXTURE_PREFIX } } });
}

async function createIbc(identificador: string, custodia: IbcCustodia = "PATIO") {
  return prisma.ibc.create({
    data: { identificador: `${FIXTURE_PREFIX}${identificador}`, aptidao: "APTO", custodia },
  });
}

async function createChecklist(nome: string) {
  const [valvula, tampa] = await Promise.all(
    [
      { descricao: `${FIXTURE_PREFIX}${nome} Válvula`, critico: true },
      { descricao: `${FIXTURE_PREFIX}${nome} Tampa`, critico: false },
    ].map((data) => prisma.checklistItem.create({ data })),
  );
  const checklist = await prisma.checklistModelo.create({
    data: {
      nome: `${FIXTURE_PREFIX}${nome}`,
      tipo: "IBC",
      notaMinimaCritico: 7,
      mediaMinima: 6,
      itens: {
        create: [
          { checklistItemId: valvula.id, ordem: 0 },
          { checklistItemId: tampa.id, ordem: 1 },
        ],
      },
    },
  });
  return { checklist, valvula, tampa };
}

type ChecklistFixture = Awaited<ReturnType<typeof createChecklist>>;

function respostas({ valvula, tampa }: ChecklistFixture, notaValvula: number, notaTampa = 9) {
  return [
    { checklistItemId: valvula.id, nota: notaValvula },
    { checklistItemId: tampa.id, nota: notaTampa },
  ];
}

const aprovada = (fixture: ChecklistFixture) => ({
  checklistModeloId: fixture.checklist.id,
  respostas: respostas(fixture, 8),
});

const reprovada = (fixture: ChecklistFixture) => ({
  checklistModeloId: fixture.checklist.id,
  respostas: respostas(fixture, 5),
});

async function readAptidao(ibcId: string) {
  return prisma.ibc.findUniqueOrThrow({
    where: { id: ibcId },
    select: { aptidao: true, motivoInaptidao: true, primeiraInspecaoEm: true },
  });
}

describe("IBC inspeções HTTP (#304)", () => {
  let app: Express;
  let anaId: string;

  async function vincular(ibcId: string, checklistModeloId: string): Promise<void> {
    await prisma.ibcChecklistVinculo.create({
      data: { ibcId, checklistModeloId, vinculadoPorId: anaId },
    });
  }

  function post(ibcId: string, body: object) {
    return request(app)
      .post(`/api/ibc/${ibcId}/inspecoes`)
      .set("Authorization", bearer(anaId, Role.ALMOX))
      .send(body);
  }

  before(async () => {
    assertTestDatabase();
    await ensureIbcInspecaoSchema(prisma);
    await ensureIbcExpedicaoSchema(prisma);
    await cleanupFixtures();
    app = createTestApp();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  async function seed() {
    const ana = await prisma.user.create({
      data: { user: `${FIXTURE_PREFIX}ana`, password: "hashed", role: Role.ALMOX, name: "Ana Almox" },
    });
    anaId = ana.id;
  }

  it("registers an approved inspeção with snapshots and records primeiraInspecaoEm", async () => {
    await seed();
    const ibc = await createIbc("H001");
    const soda = await createChecklist("Soda");
    await vincular(ibc.id, soda.checklist.id);

    const response = await post(ibc.id, { ...aprovada(soda), observacao: "  ok  " });

    assert.equal(response.status, 201);
    assert.equal(response.body.aviso, undefined);
    assert.equal(response.body.inspecao.resultado, "APROVADA");
    assert.equal(response.body.inspecao.ibcId, ibc.id);
    assert.equal(response.body.inspecao.inspetorId, anaId);
    assert.equal(response.body.inspecao.observacao, "ok");
    assert.equal(response.body.inspecao.mediaObtida, 9);
    assert.equal(response.body.inspecao.notaMinimaCritico, 7);
    assert.equal(response.body.inspecao.mediaMinima, 6);
    assert.deepEqual(response.body.inspecao.respostas, [
      { checklistItemId: soda.valvula.id, descricao: soda.valvula.descricao, critico: true, nota: 8 },
      { checklistItemId: soda.tampa.id, descricao: soda.tampa.descricao, critico: false, nota: 9 },
    ]);
    const persisted = await readAptidao(ibc.id);
    assert.equal(persisted.aptidao, "APTO");
    assert.ok(persisted.primeiraInspecaoEm);
    assert.deepEqual(response.body.ibc, {
      aptidao: "APTO",
      motivoInaptidao: null,
      primeiraInspecaoEm: persisted.primeiraInspecaoEm.toISOString(),
    });
    assert.equal(await prisma.ibcInspecaoResposta.count({ where: { inspecaoId: response.body.inspecao.id } }), 2);
  });

  it("marks a reprovada IBC Inapto without primeiraInspecaoEm and blocks alocação", async () => {
    await seed();
    const ibc = await createIbc("H010");
    const soda = await createChecklist("Soda");
    await vincular(ibc.id, soda.checklist.id);
    await prisma.cargas.create({
      data: {
        id: `${FIXTURE_PREFIX}${COD_CAR}`,
        codCar: COD_CAR,
        destino: "Blumenau",
        pesoMax: 10000,
        custoMin: 0,
        situacao: "FECHADA",
        previsaoSaida: new Date("2026-10-10T10:00:00.000Z"),
      },
    });
    await prisma.cargaPedidoIbc.create({
      data: {
        cargaId: `${FIXTURE_PREFIX}${COD_CAR}`,
        numPed: "1120",
        codCli: "C1",
        cliente: "Cliente Teste",
        quantidadeEsperadaTotal: 2,
        quantidadeEsperadaVenda: 2,
        quantidadeEsperadaEmprestimo: 0,
      },
    });

    const response = await post(ibc.id, reprovada(soda));

    assert.equal(response.status, 201);
    assert.equal(response.body.inspecao.resultado, "REPROVADA");
    assert.deepEqual(response.body.ibc, {
      aptidao: "INAPTO",
      motivoInaptidao: "INSPECAO_REPROVADA",
      primeiraInspecaoEm: null,
    });
    assert.deepEqual(await readAptidao(ibc.id), {
      aptidao: "INAPTO",
      motivoInaptidao: "INSPECAO_REPROVADA",
      primeiraInspecaoEm: null,
    });

    const alocacao = await request(app)
      .post("/api/ibc/alocacoes")
      .set("Authorization", bearer(anaId, Role.ALMOX))
      .send({ codCar: COD_CAR, numPed: "1120", identificador: ibc.identificador });
    assert.equal(alocacao.status, 409);
    assert.equal(alocacao.body.code, "IBC_INAPTO");
  });

  it("returns to Apto when every inspected vínculo has an approved latest inspeção", async () => {
    await seed();
    const ibc = await createIbc("H020");
    const soda = await createChecklist("Soda");
    const estrutural = await createChecklist("Estrutural");
    const nuncaInspecionado = await createChecklist("Nunca");
    for (const { checklist } of [soda, estrutural, nuncaInspecionado]) {
      await vincular(ibc.id, checklist.id);
    }

    assert.equal((await post(ibc.id, reprovada(soda))).status, 201);
    assert.equal((await post(ibc.id, aprovada(estrutural))).status, 201);
    assert.equal((await readAptidao(ibc.id)).motivoInaptidao, "INSPECAO_REPROVADA");

    const response = await post(ibc.id, aprovada(soda));

    assert.equal(response.status, 201);
    assert.equal(response.body.ibc.aptidao, "APTO");
    assert.equal(response.body.ibc.motivoInaptidao, null);
    const persisted = await readAptidao(ibc.id);
    assert.equal(persisted.aptidao, "APTO");
    assert.ok(persisted.primeiraInspecaoEm);
  });

  it("keeps the alocação and returns aviso IBC_ALOCADO_INAPTO when an alocado IBC is reprovado", async () => {
    await seed();
    const ibc = await createIbc("H030");
    const soda = await createChecklist("Soda");
    await vincular(ibc.id, soda.checklist.id);
    const cargaId = `${FIXTURE_PREFIX}${COD_CAR}`;
    await prisma.cargas.create({
      data: {
        id: cargaId,
        codCar: COD_CAR,
        destino: "Blumenau",
        pesoMax: 10000,
        custoMin: 0,
        situacao: "FECHADA",
        previsaoSaida: new Date("2026-10-10T10:00:00.000Z"),
      },
    });
    await prisma.alocacaoIbc.create({
      data: { ibcId: ibc.id, cargaId, numPed: "1120", alocadoPorId: anaId },
    });

    const response = await post(ibc.id, reprovada(soda));

    assert.equal(response.status, 201);
    assert.deepEqual(response.body.aviso, { code: "IBC_ALOCADO_INAPTO", codCar: COD_CAR, numPed: "1120" });
    assert.equal(await prisma.alocacaoIbc.count({ where: { ibcId: ibc.id } }), 1);
  });

  it("refuses unlinked, inactive and incomplete inspeções, invalid bodies, Em viagem and unknown IBCs", async () => {
    await seed();
    const ibc = await createIbc("H040");
    const emViagem = await createIbc("H041", "EM_VIAGEM");
    const soda = await createChecklist("Soda");
    const inativo = await createChecklist("Inativo");
    const naoVinculado = await createChecklist("Solto");
    for (const { checklist } of [soda, inativo]) {
      await vincular(ibc.id, checklist.id);
    }
    await vincular(emViagem.id, soda.checklist.id);
    await prisma.checklistModelo.update({ where: { id: inativo.checklist.id }, data: { ativo: false } });

    const cases: [string, object, number, string][] = [
      [ibc.id, aprovada(naoVinculado), 422, "IBC_CHECKLIST_NAO_VINCULADO"],
      [ibc.id, aprovada(inativo), 422, "IBC_CHECKLIST_INATIVO"],
      [
        ibc.id,
        { checklistModeloId: soda.checklist.id, respostas: [{ checklistItemId: soda.valvula.id, nota: 8 }] },
        422,
        "IBC_INSPECAO_RESPOSTAS_INCOMPLETAS",
      ],
      [ibc.id, { checklistModeloId: soda.checklist.id, respostas: respostas(soda, 11) }, 400, "IBC_INSPECAO_INVALID_BODY"],
      [ibc.id, { checklistModeloId: soda.checklist.id, respostas: respostas(soda, 7.5) }, 400, "IBC_INSPECAO_INVALID_BODY"],
      [ibc.id, { checklistModeloId: soda.checklist.id, respostas: [] }, 400, "IBC_INSPECAO_INVALID_BODY"],
      [emViagem.id, aprovada(soda), 409, "IBC_EM_VIAGEM"],
      ["00000000-0000-0000-0000-000000000000", aprovada(soda), 404, "IBC_NOT_FOUND"],
      ["nao-e-uuid", aprovada(soda), 404, "IBC_NOT_FOUND"],
    ];
    for (const [ibcId, body, status, code] of cases) {
      const response = await post(ibcId, body);
      assert.equal(response.status, status, `${ibcId} ${JSON.stringify(body)}`);
      assert.equal(response.body.code, code);
    }

    assert.equal(await prisma.ibcInspecao.count({ where: { ibcId: { in: [ibc.id, emViagem.id] } } }), 0);
    assert.deepEqual(await readAptidao(ibc.id), { aptidao: "APTO", motivoInaptidao: null, primeiraInspecaoEm: null });
  });
});
