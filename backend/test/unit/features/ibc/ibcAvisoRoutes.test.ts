import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { buildOpenApiDocument } from "../../../../src/docs/openapi/buildOpenApi";
import { ibcPaths } from "../../../../src/docs/paths/ibc.paths";
import { overviewCustomerPaths } from "../../../../src/docs/paths/overviewCustomer.paths";
import { usersPaths } from "../../../../src/docs/paths/users.paths";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { createIbcAvisoRoutes } from "../../../../src/features/ibc/http/routes/IbcAvisoRoute";
import type {
  AvisoLeituraPort,
  AvisoRepresentanteRecord,
  FiltroAvisosRepresentante,
} from "../../../../src/features/ibc/repositories/AvisoRepresentanteRepository";
import { avisoRepresentanteSchemas } from "../../../../src/features/ibc/schemas/avisoRepresentante.schemas";

const ID_10 = "11111111-1111-4111-8111-111111111111";
const ID_10_RECENTE = "66666666-6666-4666-8666-666666666666";
const ID_20 = "22222222-2222-4222-8222-222222222222";
const ID_999 = "33333333-3333-4333-8333-333333333333";
const ID_0 = "44444444-4444-4444-8444-444444444444";
const ID_AUSENTE = "55555555-5555-4555-8555-555555555555";

function createToken(role: string, codRep?: number): string {
  const payload = codRep === undefined ? { id: "user-test", role } : { id: "user-test", role, codRep };
  return jwt.sign(payload, "dev_secret");
}

function aviso(
  over: Partial<AvisoRepresentanteRecord> &
    Pick<AvisoRepresentanteRecord, "id" | "codRep" | "createdAt">,
): AvisoRepresentanteRecord {
  return {
    expedicaoIbcId: "exp-1",
    codCar: 501,
    numPed: `P-${over.codRep}`,
    codCli: "C1",
    cliente: "Cliente A",
    itens: [
      {
        ibcId: "ibc-venda",
        identificador: "HM001",
        modalidade: "VENDA",
        emprestimoVenceEm: null,
      },
      {
        ibcId: "ibc-emprestimo",
        identificador: "HM002",
        modalidade: "EMPRESTIMO",
        emprestimoVenceEm: "2026-09-01T00:00:00.000Z",
      },
    ],
    lidoEm: null,
    ...over,
  };
}

class AvisosEmMemoria implements AvisoLeituraPort {
  marcarChamadas = 0;

  constructor(readonly rows: AvisoRepresentanteRecord[]) {}

  async listar(filtro: FiltroAvisosRepresentante): Promise<AvisoRepresentanteRecord[]> {
    if (filtro.escopo === "codRep") {
      return this.rows.filter((row) => row.codRep === filtro.codRep);
    }
    return [...this.rows];
  }

  async buscarPorId(id: string): Promise<AvisoRepresentanteRecord | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async marcarLido(id: string, lidoEm: Date): Promise<AvisoRepresentanteRecord | null> {
    const row = this.rows.find((item) => item.id === id);
    if (!row) return null;
    this.marcarChamadas += 1;
    row.lidoEm = this.marcarChamadas === 1 ? lidoEm : new Date("2099-01-01T00:00:00.000Z");
    return row;
  }
}

function amostra(): AvisoRepresentanteRecord[] {
  return [
    aviso({ id: ID_0, codRep: 0, createdAt: new Date("2026-01-01T00:00:00.000Z") }),
    aviso({ id: ID_999, codRep: 999, createdAt: new Date("2026-02-01T00:00:00.000Z") }),
    aviso({ id: ID_10, codRep: 10, createdAt: new Date("2026-03-01T00:00:00.000Z") }),
    aviso({ id: ID_10_RECENTE, codRep: 10, createdAt: new Date("2026-04-01T00:00:00.000Z"), numPed: "P-10-recente" }),
    aviso({ id: ID_20, codRep: 20, createdAt: new Date("2026-06-01T00:00:00.000Z") }),
  ];
}

function appCom(memoria: AvisosEmMemoria): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc/avisos", createIbcAvisoRoutes(memoria));
  return app;
}

function appProducao(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc", ibcRoutes);
  return app;
}

describe("GET e PATCH /api/ibc/avisos", () => {
  it("retorna 401 sem token", async () => {
    const app = appProducao();
    const listar = await request(app).get("/api/ibc/avisos");
    const marcar = await request(app).patch(`/api/ibc/avisos/${ID_10}/lido`);
    assert.equal(listar.status, 401);
    assert.equal(marcar.status, 401);
  });

  for (const role of ["ALMOX", "LOGISTICA"] as const) {
    it(`retorna 403 para ${role}`, async () => {
      const app = appProducao();
      const token = createToken(role);
      const listar = await request(app)
        .get("/api/ibc/avisos")
        .set("Authorization", `Bearer ${token}`);
      const marcar = await request(app)
        .patch(`/api/ibc/avisos/${ID_10}/lido`)
        .set("Authorization", `Bearer ${token}`);
      assert.equal(listar.status, 403);
      assert.equal(marcar.status, 403);
    });
  }

  it("VENDAS vê só o próprio codRep, sem ibcId, do mais recente ao mais antigo", async () => {
    const app = appCom(new AvisosEmMemoria(amostra()));
    const response = await request(app)
      .get("/api/ibc/avisos")
      .set("Authorization", `Bearer ${createToken("VENDAS", 10)}`);

    const parsed = avisoRepresentanteSchemas.lista.safeParse(response.body);
    assert.equal(response.status, 200);
    assert.equal(parsed.success, true);
    if (!parsed.success) return;

    assert.deepEqual(
      parsed.data.avisos.map((item) => item.id),
      [ID_10_RECENTE, ID_10],
    );
    const avisoDoRep = parsed.data.avisos[0];
    assert.equal(avisoDoRep.codRep, 10);
    assert.equal(avisoDoRep.numPed, "P-10-recente");
    assert.equal(avisoDoRep.cliente, "Cliente A");
    assert.equal(avisoDoRep.lidoEm, null);
    assert.deepEqual(
      avisoDoRep.itens.map((item) => item.modalidade),
      ["VENDA", "EMPRESTIMO"],
    );
    assert.equal(avisoDoRep.itens[0].emprestimoVenceEm, null);
    assert.equal(avisoDoRep.itens[1].identificador, "HM002");
    assert.equal(Object.hasOwn(avisoDoRep.itens[0], "ibcId"), false);
  });

  it("VENDAS com codRep 999 não vê os avisos dos outros", async () => {
    const app = appCom(new AvisosEmMemoria(amostra()));
    const response = await request(app)
      .get("/api/ibc/avisos")
      .set("Authorization", `Bearer ${createToken("VENDAS", 999)}`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.avisos.map((item: { id: string }) => item.id),
      [ID_999],
    );
  });

  it("VENDAS com codRep ausente, zero ou fracionário recebe lista vazia", async () => {
    const memoria = new AvisosEmMemoria(amostra());
    const app = appCom(memoria);
    for (const codRep of [undefined, 0, 1.5] as const) {
      const response = await request(app)
        .get("/api/ibc/avisos")
        .set("Authorization", `Bearer ${createToken("VENDAS", codRep)}`);
      assert.equal(response.status, 200);
      assert.deepEqual(response.body.avisos, []);
    }
  });

  it("ADMIN lista todos, mesmo com codRep 999 no token", async () => {
    const app = appCom(new AvisosEmMemoria(amostra()));
    const response = await request(app)
      .get("/api/ibc/avisos")
      .set("Authorization", `Bearer ${createToken("ADMIN", 999)}`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.avisos.map((item: { codRep: number }) => item.codRep),
      [20, 10, 10, 999, 0],
    );
  });

  it("VENDAS não marca aviso de outro codRep", async () => {
    const memoria = new AvisosEmMemoria(amostra());
    const app = appCom(memoria);
    const response = await request(app)
      .patch(`/api/ibc/avisos/${ID_20}/lido`)
      .set("Authorization", `Bearer ${createToken("VENDAS", 10)}`);

    assert.equal(response.status, 403);
    assert.equal(response.body.code, "IBC_AVISO_FORBIDDEN");
    assert.equal(memoria.marcarChamadas, 0);
    assert.equal(memoria.rows.find((row) => row.id === ID_20)?.lidoEm, null);
  });

  it("VENDAS com codRep inválido recebe 403 no aviso existente e 404 no ausente", async () => {
    const app = appCom(new AvisosEmMemoria(amostra()));
    const token = createToken("VENDAS", 0);
    const alheio = await request(app)
      .patch(`/api/ibc/avisos/${ID_10}/lido`)
      .set("Authorization", `Bearer ${token}`);
    const ausente = await request(app)
      .patch(`/api/ibc/avisos/${ID_AUSENTE}/lido`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(alheio.status, 403);
    assert.equal(alheio.body.code, "IBC_AVISO_FORBIDDEN");
    assert.equal(ausente.status, 404);
    assert.equal(ausente.body.code, "IBC_AVISO_NAO_ENCONTRADO");
  });

  it("retorna 404 quando o aviso não existe", async () => {
    const app = appCom(new AvisosEmMemoria(amostra()));
    const response = await request(app)
      .patch(`/api/ibc/avisos/${ID_AUSENTE}/lido`)
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.equal(response.status, 404);
    assert.equal(response.body.code, "IBC_AVISO_NAO_ENCONTRADO");
  });

  it("retorna 400 quando o id não é uuid", async () => {
    const app = appCom(new AvisosEmMemoria(amostra()));
    const response = await request(app)
      .patch("/api/ibc/avisos/nao-uuid/lido")
      .set("Authorization", `Bearer ${createToken("ADMIN")}`);

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Erro de validação");
  });

  it("a segunda marcação mantém o primeiro lidoEm", async () => {
    const memoria = new AvisosEmMemoria(amostra());
    const app = appCom(memoria);
    const token = createToken("VENDAS", 10);
    const primeira = await request(app)
      .patch(`/api/ibc/avisos/${ID_10}/lido`)
      .set("Authorization", `Bearer ${token}`);
    const segunda = await request(app)
      .patch(`/api/ibc/avisos/${ID_10}/lido`)
      .set("Authorization", `Bearer ${token}`);

    const parsed = avisoRepresentanteSchemas.aviso.safeParse(primeira.body);
    assert.equal(primeira.status, 200);
    assert.equal(parsed.success, true);
    assert.equal(segunda.status, 200);
    assert.equal(segunda.body.lidoEm, primeira.body.lidoEm);
    assert.notEqual(primeira.body.lidoEm, null);
    assert.equal(memoria.marcarChamadas, 1);
    assert.equal(memoria.rows.find((row) => row.id === ID_10)?.lidoEm?.toISOString(), primeira.body.lidoEm);
  });
});

describe("OpenAPI dos avisos IBC", () => {
  it("registra GET e PATCH com os status de auth e de negócio", () => {
    const document = buildOpenApiDocument([
      ...usersPaths,
      ...overviewCustomerPaths,
      ...ibcPaths,
    ]);
    const listar = document.paths["/api/ibc/avisos"]?.get as {
      responses: Record<string, unknown>;
      security?: unknown[];
    };
    const marcar = document.paths["/api/ibc/avisos/{id}/lido"]?.patch as {
      parameters?: Array<{ in: string; name: string; required: boolean }>;
      responses: Record<string, unknown>;
    };

    assert.ok(listar);
    assert.deepEqual(Object.keys(listar.responses).sort(), ["200", "401", "403", "500"]);
    assert.deepEqual(listar.security, [{ bearerAuth: [] }]);
    assert.ok(marcar);
    assert.deepEqual(Object.keys(marcar.responses).sort(), [
      "200",
      "400",
      "401",
      "403",
      "404",
      "500",
    ]);
    assert.deepEqual(
      (marcar.parameters ?? []).map(({ in: location, name, required }) => ({
        location,
        name,
        required,
      })),
      [{ location: "path", name: "id", required: true }],
    );

    const swagger = readFileSync(join(process.cwd(), "src/docs/swagger.ts"), "utf8");
    assert.match(swagger, /ibcPaths/);
  });
});
