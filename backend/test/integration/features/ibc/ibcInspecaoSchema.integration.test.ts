import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { Prisma, PrismaClient, Role } from "@prisma/client";
import { ensureIbcInspecaoSchema } from "../../../helpers/ensureIbcInspecaoSchema";

const FIXTURE_PREFIX = "test-ibc-302-";

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

async function cleanupFixtures(): Promise<void> {
  await prisma.ibcInspecao.deleteMany({
    where: { ibc: { identificador: { startsWith: FIXTURE_PREFIX } } },
  });
  await prisma.ibc.deleteMany({ where: { identificador: { startsWith: FIXTURE_PREFIX } } });
  await prisma.checklistModelo.deleteMany({ where: { nome: { startsWith: FIXTURE_PREFIX } } });
  await prisma.checklistItem.deleteMany({ where: { descricao: { startsWith: FIXTURE_PREFIX } } });
  await prisma.user.deleteMany({ where: { user: { startsWith: FIXTURE_PREFIX } } });
}

async function seedInspecao() {
  const inspetor = await prisma.user.create({
    data: { user: `${FIXTURE_PREFIX}ana`, password: "hashed", role: Role.ALMOX, name: "Ana Almox" },
  });
  const ibc = await prisma.ibc.create({
    data: { identificador: `${FIXTURE_PREFIX}H001`, aptidao: "APTO" },
  });
  const checklist = await prisma.checklistModelo.create({
    data: { nome: `${FIXTURE_PREFIX}Soda`, tipo: "IBC", notaMinimaCritico: 7, mediaMinima: 6 },
  });
  const item = await prisma.checklistItem.create({
    data: { descricao: `${FIXTURE_PREFIX}Válvula`, critico: true },
  });
  const inspecao = await prisma.ibcInspecao.create({
    data: {
      ibcId: ibc.id,
      checklistModeloId: checklist.id,
      resultado: "REPROVADA",
      mediaObtida: null,
      notaMinimaCritico: 7,
      mediaMinima: 6,
      inspetorId: inspetor.id,
      respostas: {
        create: [{ checklistItemId: item.id, nota: 5, critico: true, descricao: item.descricao }],
      },
    },
  });
  return { ibc, item, inspecao };
}

describe("IBC inspeção schema (#302)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureIbcInspecaoSchema(prisma);
    await cleanupFixtures();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("persists an inspeção with snapshot respostas and marks the IBC with INSPECAO_REPROVADA", async () => {
    const { ibc, inspecao } = await seedInspecao();

    await prisma.ibc.update({
      where: { id: ibc.id },
      data: { aptidao: "INAPTO", motivoInaptidao: "INSPECAO_REPROVADA" },
    });

    const saved = await prisma.ibcInspecao.findUniqueOrThrow({
      where: { id: inspecao.id },
      include: { respostas: true, ibc: { select: { motivoInaptidao: true } } },
    });
    assert.equal(saved.resultado, "REPROVADA");
    assert.equal(saved.mediaObtida, null);
    assert.equal(saved.ibc.motivoInaptidao, "INSPECAO_REPROVADA");
    assert.deepEqual(
      saved.respostas.map(({ nota, critico, descricao }) => ({ nota, critico, descricao })),
      [{ nota: 5, critico: true, descricao: `${FIXTURE_PREFIX}Válvula` }],
    );
  });

  it("rejects a second resposta for the same item in one inspeção", async () => {
    const { item, inspecao } = await seedInspecao();

    await assert.rejects(
      prisma.ibcInspecaoResposta.create({
        data: { inspecaoId: inspecao.id, checklistItemId: item.id, nota: 9, critico: true, descricao: "dup" },
      }),
      (error: unknown) =>
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002",
    );
  });

  it("deletes respostas together with their inspeção", async () => {
    const { inspecao } = await seedInspecao();

    await prisma.ibcInspecao.delete({ where: { id: inspecao.id } });

    assert.equal(await prisma.ibcInspecaoResposta.count({ where: { inspecaoId: inspecao.id } }), 0);
  });
});
