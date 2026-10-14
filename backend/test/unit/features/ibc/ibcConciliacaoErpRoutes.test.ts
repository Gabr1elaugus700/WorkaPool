import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { FakeSaldoIbcErp } from "../../../../src/features/ibc/adapters/FakeSaldoIbcErp";
import { buildOpenApiDocument } from "../../../../src/docs/openapi/buildOpenApi";
import { ibcPaths } from "../../../../src/docs/paths/ibc.paths";
import { createIbcConciliacaoErpRoutes } from "../../../../src/features/ibc/http/routes/IbcConciliacaoErpRoute";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";
import type { IbcLinhaConciliacaoErp } from "../../../../src/features/ibc/repositories/IIbcConciliacaoErpRepository";
import type { SaldoIbcErpResult } from "../../../../src/features/ibc/ports/ISaldoIbcErp";
import { conciliacaoErpSchemas } from "../../../../src/features/ibc/schemas/conciliacaoErp.schemas";

const VENCIMENTO = new Date("2026-12-01T00:00:00.000Z");
const BAIXA = new Date("2026-08-02T00:00:00.000Z");

function createToken(role: string): string {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

function linha(overrides: Partial<IbcLinhaConciliacaoErp> = {}): IbcLinhaConciliacaoErp {
  const identificador = overrides.identificador ?? "HMS00001";
  return {
    id: overrides.id ?? "11111111-1111-4111-8111-111111111111",
    identificador,
    custodia: overrides.custodia ?? "PATIO",
    motivoBaixa: overrides.motivoBaixa ?? null,
    aquisicao: overrides.aquisicao ?? "COMPRA",
    baixadoEm: overrides.baixadoEm ?? null,
    convertedToContainerId: overrides.convertedToContainerId ?? null,
    loteId: overrides.loteId === undefined ? "lote-1" : overrides.loteId,
    numeroNf: overrides.numeroNf === undefined ? "NF-1" : overrides.numeroNf,
    trocaEntradaIdentificador: overrides.trocaEntradaIdentificador ?? null,
    trocaSaidaIdentificador: overrides.trocaSaidaIdentificador ?? null,
    cliente: overrides.cliente ?? null,
    codCli: overrides.codCli ?? null,
    numPed: overrides.numPed ?? null,
    emprestimoVenceEm: overrides.emprestimoVenceEm ?? null,
  };
}

const amostra: IbcLinhaConciliacaoErp[] = [
  linha({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", identificador: "HMS00002" }),
  linha({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", identificador: "HMS00001" }),
  linha({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    identificador: "EMP0001",
    custodia: "CLIENTE",
    cliente: "Cliente",
    codCli: "C1",
    numPed: "42",
    emprestimoVenceEm: VENCIMENTO,
  }),
  linha({
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    identificador: "BAIXA1",
    baixadoEm: BAIXA,
  }),
];

function appCom(saldo: SaldoIbcErpResult, linhas: IbcLinhaConciliacaoErp[] = amostra): Express {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/ibc/conciliacao-erp",
    createIbcConciliacaoErpRoutes(
      { listLinhas: async () => linhas },
      new FakeSaldoIbcErp(saldo),
    ),
  );
  return app;
}

function appProducao(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc", ibcRoutes);
  return app;
}

describe("GET /api/ibc/conciliacao-erp", () => {
  it("retorna 401 sem token", async () => {
    const response = await request(appProducao()).get("/api/ibc/conciliacao-erp");
    assert.equal(response.status, 401);
  });

  for (const role of ["VENDAS", "USER", "MOTORISTA"] as const) {
    it(`retorna 403 para ${role}`, async () => {
      const response = await request(appProducao())
        .get("/api/ibc/conciliacao-erp")
        .set("Authorization", `Bearer ${createToken(role)}`);
      assert.equal(response.status, 403);
    });
  }

  for (const role of ["ADMIN", "ALMOX", "LOGISTICA", "GERENTE_DPTO"] as const) {
    it(`${role} recebe saldo, vivos, residual com sinal e NF sem serializar indisponível`, async () => {
      const response = await request(appCom({ status: "available", quantity: 1 }))
        .get("/api/ibc/conciliacao-erp")
        .set("Authorization", `Bearer ${createToken(role)}`);

      const parsed = conciliacaoErpSchemas.relatorio.safeParse(response.body);
      assert.equal(response.status, 200);
      assert.equal(parsed.success, true);
      if (!parsed.success) return;

      assert.deepEqual(parsed.data.saldoErp, { status: "available", quantity: 1 });
      assert.equal(parsed.data.vivosWp, 3);
      assert.equal(parsed.data.residual, 1 - 3);
      assert.deepEqual(parsed.data.itens, []);
      assert.deepEqual(parsed.data.nfSemSerializar, { status: "indisponivel", count: null });
      const vivos = parsed.data.buckets
        .filter((bucket) => bucket.entraNaSoma)
        .reduce((total, bucket) => total + bucket.count, 0);
      assert.equal(vivos, parsed.data.vivosWp);
      assert.equal(parsed.data.buckets.find((bucket) => bucket.bucket === "BAIXADOS")?.entraNaSoma, false);
    });
  }

  it("deixa o residual nulo quando o ERP está indisponível", async () => {
    const response = await request(appCom({ status: "unavailable" }))
      .get("/api/ibc/conciliacao-erp")
      .set("Authorization", `Bearer ${createToken("ALMOX")}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.saldoErp, { status: "unavailable" });
    assert.equal(response.body.residual, null);
    assert.equal(response.body.vivosWp, 3);
    assert.deepEqual(response.body.nfSemSerializar, { status: "indisponivel", count: null });
  });

  it("?bucket=PATIO devolve os identificadores ordenados", async () => {
    const response = await request(appCom({ status: "available", quantity: 200 }))
      .get("/api/ibc/conciliacao-erp")
      .query({ bucket: "PATIO" })
      .set("Authorization", `Bearer ${createToken("ALMOX")}`);

    const parsed = conciliacaoErpSchemas.relatorio.safeParse(response.body);
    assert.equal(response.status, 200);
    assert.equal(parsed.success, true);
    if (!parsed.success) return;

    assert.deepEqual(
      parsed.data.itens.map((item) => item.identificador),
      ["HMS00001", "HMS00002"],
    );
    assert.equal(parsed.data.residual, 200 - 3);
    assert.equal(parsed.data.itens[0]?.cliente, null);
  });

  it("serializa a data do empréstimo e não deriva atraso", async () => {
    const response = await request(appCom({ status: "available", quantity: 10 }))
      .get("/api/ibc/conciliacao-erp")
      .query({ bucket: "NO_CLIENTE" })
      .set("Authorization", `Bearer ${createToken("LOGISTICA")}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.itens.length, 1);
    assert.equal(response.body.itens[0].identificador, "EMP0001");
    assert.equal(response.body.itens[0].emprestimoVenceEm, VENCIMENTO.toISOString());
    assert.equal(response.body.itens[0].cliente, "Cliente");
    assert.equal(response.body.itens[0].numPed, "42");
    assert.equal(Object.hasOwn(response.body.itens[0], "atrasado"), false);
  });

  it("rejeita bucket desconhecido com 400", async () => {
    const response = await request(appProducao())
      .get("/api/ibc/conciliacao-erp")
      .query({ bucket: "ATRASADO" })
      .set("Authorization", `Bearer ${createToken("ALMOX")}`);

    assert.equal(response.status, 400);
    assert.equal(response.body.code, "IBC_CONCILIACAO_ERP_BUCKET_INVALIDO");
  });
});

describe("OpenAPI da conciliação ERP", () => {
  it("registra GET /api/ibc/conciliacao-erp com query bucket e os status", () => {
    const document = buildOpenApiDocument(ibcPaths);
    const operacao = document.paths["/api/ibc/conciliacao-erp"]?.get as {
      responses: Record<string, unknown>;
      security?: unknown[];
      parameters?: Array<{ in: string; name: string; required: boolean; schema?: { enum?: string[] } }>;
    };

    assert.ok(operacao);
    assert.deepEqual(Object.keys(operacao.responses).sort(), ["200", "400", "401", "403", "500"]);
    assert.deepEqual(operacao.security, [{ bearerAuth: [] }]);
    assert.deepEqual(
      (operacao.parameters ?? []).map(({ in: location, name, required }) => ({ location, name, required })),
      [{ location: "query", name: "bucket", required: false }],
    );
    assert.ok(operacao.parameters?.[0]?.schema?.enum?.includes("PATIO"));
    assert.ok(operacao.parameters?.[0]?.schema?.enum?.includes("SERIAL_SEM_NF"));

    const swagger = readFileSync(join(process.cwd(), "src/docs/swagger.ts"), "utf8");
    assert.match(swagger, /ibcPaths/);
  });
});
