import test from "node:test";
import assert from "node:assert";
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

test("IBC Routes - autenticação e autorização", async (t) => {
  const app = createTestApp();

  await t.test("GET /cargas-expedicao sem token deve retornar 401", async () => {
    const response = await request(app).get("/api/ibc/cargas-expedicao");
    assert.strictEqual(response.status, 401);
  });

  await t.test("GET /events sem token deve retornar 401", async () => {
    const response = await request(app).get("/api/ibc/events");
    assert.strictEqual(response.status, 401);
  });

  await t.test("POST /alocacoes sem token deve retornar 401", async () => {
    const response = await request(app)
      .post("/api/ibc/alocacoes")
      .send({ codCar: 1, numPed: "1120", identificador: "H0045" });
    assert.strictEqual(response.status, 401);
  });

  await t.test(
    "POST /alocacoes com role LOGISTICA deve retornar 403",
    async () => {
      const token = createToken("LOGISTICA");
      const response = await request(app)
        .post("/api/ibc/alocacoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ codCar: 1, numPed: "1120", identificador: "H0045" });
      assert.strictEqual(response.status, 403);
    },
  );

  await t.test(
    "POST /expedicoes com role LOGISTICA deve retornar 403",
    async () => {
      const token = createToken("LOGISTICA");
      const response = await request(app)
        .post("/api/ibc/expedicoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ codCar: 1 });
      assert.strictEqual(response.status, 403);
    },
  );

  await t.test(
    "DELETE /alocacoes/:id com role LOGISTICA deve retornar 403",
    async () => {
      const token = createToken("LOGISTICA");
      const response = await request(app)
        .delete("/api/ibc/alocacoes/aloc-1")
        .set("Authorization", `Bearer ${token}`);
      assert.strictEqual(response.status, 403);
    },
  );

  await t.test(
    "POST /expedicoes sem token deve retornar 401",
    async () => {
      const response = await request(app)
        .post("/api/ibc/expedicoes")
        .send({ codCar: 1 });
      assert.strictEqual(response.status, 401);
    },
  );

  await t.test(
    "GET /cargas-expedicao/:codCar com codCar inválido deve retornar 400",
    async () => {
      const token = createToken("ALMOX");
      const response = await request(app)
        .get("/api/ibc/cargas-expedicao/abc")
        .set("Authorization", `Bearer ${token}`);
      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.code, "IBC_COD_CAR_INVALID");
    },
  );

  await t.test(
    "POST /alocacoes com body inválido (ALMOX) deve retornar 400",
    async () => {
      const token = createToken("ALMOX");
      const response = await request(app)
        .post("/api/ibc/alocacoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ codCar: 1 });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.code, "IBC_ALOCACAO_INVALID_BODY");
    },
  );
});
