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
    "DELETE /alocacoes/:id sem token deve retornar 401",
    async () => {
      const response = await request(app).delete(
        "/api/ibc/alocacoes/aloc-1",
      );
      assert.strictEqual(response.status, 401);
    },
  );

  await t.test(
    "POST /alocacoes com ALMOX autenticado passa requireRoles (não 403)",
    async () => {
      const token = createToken("ALMOX");
      const response = await request(app)
        .post("/api/ibc/alocacoes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          codCar: 1,
          numPed: "1120",
          identificador: "H0045",
        });
      assert.notStrictEqual(response.status, 401);
      assert.notStrictEqual(response.status, 403);
    },
  );

  await t.test(
    "POST /expedicoes com ALMOX autenticado passa requireRoles (não 403)",
    async () => {
      const token = createToken("ALMOX");
      const response = await request(app)
        .post("/api/ibc/expedicoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ codCar: 1 });
      assert.notStrictEqual(response.status, 401);
      assert.notStrictEqual(response.status, 403);
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

  await t.test("cadastro routes sem token retornam 401", async () => {
    const create = await request(app)
      .post("/api/ibc")
      .send({ dataLimite: "2099-12-31" });
    const createLote = await request(app)
      .post("/api/ibc/lote")
      .send({ quantidade: 2, dataLimite: "2099-12-31" });
    const list = await request(app).get("/api/ibc");
    const alerts = await request(app).get("/api/ibc/alerts");
    const patch = await request(app)
      .patch("/api/ibc/ibc-1")
      .send({ dataLimite: "2099-12-31" });
    const softDelete = await request(app).delete("/api/ibc/ibc-1");

    assert.strictEqual(create.status, 401);
    assert.strictEqual(createLote.status, 401);
    assert.strictEqual(list.status, 401);
    assert.strictEqual(alerts.status, 401);
    assert.strictEqual(patch.status, 401);
    assert.strictEqual(softDelete.status, 401);
  });

  await t.test("LOGISTICA não pode mutar cadastro", async () => {
    const token = createToken("LOGISTICA");
    const create = await request(app)
      .post("/api/ibc")
      .set("Authorization", `Bearer ${token}`)
      .send({ dataLimite: "2099-12-31" });
    const createLote = await request(app)
      .post("/api/ibc/lote")
      .set("Authorization", `Bearer ${token}`)
      .send({ quantidade: 2, dataLimite: "2099-12-31" });
    const patch = await request(app)
      .patch("/api/ibc/ibc-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ dataLimite: "2099-12-31" });
    const softDelete = await request(app)
      .delete("/api/ibc/ibc-1")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(create.status, 403);
    assert.strictEqual(createLote.status, 403);
    assert.strictEqual(patch.status, 403);
    assert.strictEqual(softDelete.status, 403);
  });

  await t.test("LOGISTICA pode ler pool e alerts", async () => {
    const token = createToken("LOGISTICA");
    const list = await request(app)
      .get("/api/ibc")
      .set("Authorization", `Bearer ${token}`);
    const alerts = await request(app)
      .get("/api/ibc/alerts")
      .set("Authorization", `Bearer ${token}`);

    assert.notStrictEqual(list.status, 401);
    assert.notStrictEqual(list.status, 403);
    assert.notStrictEqual(alerts.status, 401);
    assert.notStrictEqual(alerts.status, 403);
  });
});
