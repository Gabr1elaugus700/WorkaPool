import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import ibcRoutes from "../../../../src/features/ibc/http/routes/IbcRoute";

function token(role: string): string {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

function app() {
  const server = express();
  server.use(express.json());
  server.use("/api/ibc", ibcRoutes);
  return server;
}

describe("rotas de entrada no pátio", () => {
  it("recusa anônimo e LOGISTICA antes de abrir, listar ou concluir", async () => {
    const server = app();
    assert.equal((await request(server).get("/api/ibc/entradas-patio")).status, 401);
    assert.equal((await request(server).post("/api/ibc/ibc-1/entrada-patio").send({ origem: "RETORNO" })).status, 401);
    assert.equal((await request(server).post("/api/ibc/ibc-1/entrada-patio/concluir")).status, 401);

    const auth = { Authorization: `Bearer ${token("LOGISTICA")}` };
    assert.equal((await request(server).get("/api/ibc/entradas-patio").set(auth)).status, 403);
    assert.equal((await request(server).post("/api/ibc/ibc-1/entrada-patio").set(auth).send({ origem: "RETORNO" })).status, 403);
    assert.equal((await request(server).post("/api/ibc/ibc-1/entrada-patio/concluir").set(auth)).status, 403);
  });

  it("recusa corpo inválido com 400 sem gravar", async () => {
    const response = await request(app())
      .post("/api/ibc/ibc-1/entrada-patio")
      .set("Authorization", `Bearer ${token("ALMOX")}`)
      .send({ origem: "EMPRESTIMO" });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "IBC_ENTRADA_INVALID_BODY");
  });
});
