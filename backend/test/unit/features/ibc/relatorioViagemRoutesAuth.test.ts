import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import express, { Express } from "express";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/ibc", ibcRoutes);
  return app;
}

function createToken(role: string) {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

describe("GET /api/ibc/expedicoes/:codCar/relatorio-viagem", () => {
  const app = createTestApp();

  it("sem token responde 401", async () => {
    const response = await request(app).get(
      "/api/ibc/expedicoes/202/relatorio-viagem",
    );
    assert.equal(response.status, 401);
  });

  it("com role LOGISTICA responde 403", async () => {
    const response = await request(app)
      .get("/api/ibc/expedicoes/202/relatorio-viagem")
      .set("Authorization", `Bearer ${createToken("LOGISTICA")}`);
    assert.equal(response.status, 403);
  });

  it("com role VENDAS responde 403", async () => {
    const response = await request(app)
      .get("/api/ibc/expedicoes/202/relatorio-viagem")
      .set("Authorization", `Bearer ${createToken("VENDAS")}`);
    assert.equal(response.status, 403);
  });

  it("com codCar inválido responde 400 antes de buscar a carga", async () => {
    const response = await request(app)
      .get("/api/ibc/expedicoes/abc/relatorio-viagem")
      .set("Authorization", `Bearer ${createToken("ALMOX")}`);
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "IBC_COD_CAR_INVALID");
  });
});
