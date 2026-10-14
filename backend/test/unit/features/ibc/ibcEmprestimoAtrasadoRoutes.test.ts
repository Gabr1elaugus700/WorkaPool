import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { buildOpenApiDocument } from "../../../../src/docs/openapi/buildOpenApi";
import { ibcPaths } from "../../../../src/docs/paths/ibc.paths";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import { createIbcEmprestimoAtrasadoRoutes } from "../../../../src/features/ibc/http/routes/IbcEmprestimoAtrasadoRoute";
import type { IIbcEmprestimoAtrasadoRepository } from "../../../../src/features/ibc/repositories/IIbcEmprestimoAtrasadoRepository";
import { emprestimoAtrasadoSchemas } from "../../../../src/features/ibc/schemas/emprestimoAtrasado.schemas";
import type { LinhaEmprestimoAtrasado } from "../../../../src/features/ibc/types/EmprestimoAtrasado.types";

const VENCIDO = new Date("2026-07-12T15:00:00.000Z");
const MAIS_NOVO = new Date("2026-08-01T00:00:00.000Z");
const NO_PRAZO = new Date("2099-01-01T00:00:00.000Z");
const ID_ANTIGO = "11111111-1111-4111-8111-111111111111";
const ID_NOVO = "22222222-2222-4222-8222-222222222222";
const ID_OUTRO = "33333333-3333-4333-8333-333333333333";
const ID_SEM_REP = "44444444-4444-4444-8444-444444444444";

function createToken(role: string, codRep?: number): string {
  const payload = codRep === undefined ? { id: "user-test", role } : { id: "user-test", role, codRep };
  return jwt.sign(payload, "dev_secret");
}

function linha(overrides: Partial<LinhaEmprestimoAtrasado> = {}): LinhaEmprestimoAtrasado {
  const identificador = overrides.identificador ?? "HMS00001";
  return {
    id: overrides.id ?? ID_ANTIGO,
    identificador,
    cliente: overrides.cliente === undefined ? "Cliente A" : overrides.cliente,
    codCli: overrides.codCli === undefined ? "C1" : overrides.codCli,
    numPed: overrides.numPed ?? "1120",
    codCar: overrides.codCar ?? 500,
    codRep: overrides.codRep === undefined ? 17 : overrides.codRep,
    emprestimoVenceEm: overrides.emprestimoVenceEm === undefined ? VENCIDO : overrides.emprestimoVenceEm,
    custodia: overrides.custodia ?? "CLIENTE",
    motivoBaixa: overrides.motivoBaixa === undefined ? null : overrides.motivoBaixa,
    baixadoEm: overrides.baixadoEm === undefined ? null : overrides.baixadoEm,
    convertedToContainerId:
      overrides.convertedToContainerId === undefined ? null : overrides.convertedToContainerId,
    alocacaoEncerradaEm:
      overrides.alocacaoEncerradaEm === undefined ? null : overrides.alocacaoEncerradaEm,
  };
}

const amostra: LinhaEmprestimoAtrasado[] = [
  linha({
    id: ID_NOVO,
    identificador: "HMS00002",
    emprestimoVenceEm: MAIS_NOVO,
    cliente: null,
    codCli: null,
  }),
  linha({ id: ID_ANTIGO, identificador: "HMS00001" }),
  linha({ id: ID_OUTRO, identificador: "OUTRO", codRep: 4, numPed: "200" }),
  linha({ id: ID_SEM_REP, identificador: "SEMREP", codRep: null, numPed: "300", codCar: 9 }),
  linha({ identificador: "NO_PRAZO", emprestimoVenceEm: NO_PRAZO, id: "55555555-5555-4555-8555-555555555555" }),
  linha({ identificador: "VENDA", motivoBaixa: "VENDA", id: "66666666-6666-4666-8666-666666666666" }),
];

function appCom(linhas: LinhaEmprestimoAtrasado[] = amostra): { app: Express; chamadas: number } {
  const estado = { chamadas: 0 };
  const repository: IIbcEmprestimoAtrasadoRepository = {
    listar: async () => {
      estado.chamadas += 1;
      return linhas;
    },
  };
  const app = express();
  app.use(express.json());
  app.use("/api/ibc/emprestimos-atrasados", createIbcEmprestimoAtrasadoRoutes(repository));
  return { app, get chamadas() { return estado.chamadas; } };
}

function appProducao(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc", ibcRoutes);
  return app;
}

describe("GET /api/ibc/emprestimos-atrasados", () => {
  it("retorna 401 sem token", async () => {
    const response = await request(appProducao()).get("/api/ibc/emprestimos-atrasados");
    assert.equal(response.status, 401);
  });

  for (const role of ["ALMOX", "USER", "MOTORISTA"] as const) {
    it(`retorna 403 ${role} com IBC_EMPRESTIMO_ATRASADO_FORBIDDEN`, async () => {
      const response = await request(appProducao())
        .get("/api/ibc/emprestimos-atrasados")
        .set("Authorization", `Bearer ${createToken(role)}`);
      assert.equal(response.status, 403);
      assert.equal(response.body.code, "IBC_EMPRESTIMO_ATRASADO_FORBIDDEN");
    });
  }

  for (const role of ["ADMIN", "LOGISTICA", "GERENTE_DPTO"] as const) {
    it(`${role} recebe o ISO do prazo, do mais antigo ao mais novo`, async () => {
      const { app } = appCom();
      const response = await request(app)
        .get("/api/ibc/emprestimos-atrasados")
        .set("Authorization", `Bearer ${createToken(role)}`);

      const parsed = emprestimoAtrasadoSchemas.lista.safeParse(response.body);
      assert.equal(response.status, 200);
      assert.equal(parsed.success, true);
      if (!parsed.success) return;

      assert.deepEqual(
        parsed.data.itens.map((item) => item.identificador),
        ["HMS00001", "OUTRO", "SEMREP", "HMS00002"],
      );
      assert.equal(parsed.data.itens[0]?.emprestimoVenceEm, VENCIDO.toISOString());
      assert.equal(parsed.data.itens[0]?.cliente, "Cliente A");
      assert.equal(parsed.data.itens[0]?.codCli, "C1");
      assert.equal(parsed.data.itens[0]?.numPed, "1120");
      assert.equal(parsed.data.itens[0]?.codCar, 500);
      assert.equal(parsed.data.itens[0]?.codRep, 17);
      const maisNovo = parsed.data.itens.find((item) => item.identificador === "HMS00002");
      assert.equal(maisNovo?.emprestimoVenceEm, MAIS_NOVO.toISOString());
      assert.equal(maisNovo?.cliente, null);
      assert.equal(maisNovo?.codCli, null);
      assert.equal(parsed.data.itens.find((item) => item.identificador === "SEMREP")?.codRep, null);
      assert.equal(Object.hasOwn(parsed.data.itens[0] ?? {}, "atrasado"), false);
    });
  }

  it("VENDAS sem codRep recebe 200 e lista vazia sem ler o pool", async () => {
    const harness = appCom();
    const response = await request(harness.app)
      .get("/api/ibc/emprestimos-atrasados")
      .set("Authorization", `Bearer ${createToken("VENDAS")}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { itens: [] });
    assert.equal(harness.chamadas, 0);
  });

  it("VENDAS com codRep 0 recebe lista vazia", async () => {
    const harness = appCom();
    const response = await request(harness.app)
      .get("/api/ibc/emprestimos-atrasados")
      .set("Authorization", `Bearer ${createToken("VENDAS", 0)}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { itens: [] });
    assert.equal(harness.chamadas, 0);
  });

  it("VENDAS vê só o próprio codRep", async () => {
    const { app } = appCom();
    const response = await request(app)
      .get("/api/ibc/emprestimos-atrasados")
      .set("Authorization", `Bearer ${createToken("VENDAS", 17)}`);

    const parsed = emprestimoAtrasadoSchemas.lista.safeParse(response.body);
    assert.equal(response.status, 200);
    assert.equal(parsed.success, true);
    if (!parsed.success) return;

    assert.deepEqual(
      parsed.data.itens.map((item) => item.identificador),
      ["HMS00001", "HMS00002"],
    );
    assert.equal(parsed.data.itens[0]?.emprestimoVenceEm, VENCIDO.toISOString());
  });
});

describe("OpenAPI de empréstimos em atraso", () => {
  it("registra GET /api/ibc/emprestimos-atrasados sem query", () => {
    const document = buildOpenApiDocument(ibcPaths);
    const operacao = document.paths["/api/ibc/emprestimos-atrasados"]?.get as {
      responses: Record<string, unknown>;
      security?: unknown[];
      parameters?: unknown[];
    };

    assert.ok(operacao);
    assert.deepEqual(Object.keys(operacao.responses).sort(), ["200", "401", "403", "500"]);
    assert.deepEqual(operacao.security, [{ bearerAuth: [] }]);
    assert.equal(operacao.parameters, undefined);

    const route = readFileSync(
      join(process.cwd(), "src/features/ibc/http/routes/IbcRoute.ts"),
      "utf8",
    );
    const lista = route.indexOf('"/emprestimos-atrasados"');
    const porId = route.indexOf('"/:id"');
    assert.ok(lista >= 0);
    assert.ok(porId > lista);

    const swagger = readFileSync(join(process.cwd(), "src/docs/swagger.ts"), "utf8");
    assert.match(swagger, /ibcPaths/);
  });
});
