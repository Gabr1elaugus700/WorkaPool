import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import express, { Express } from "express";
import goalsRoutes from "../../../src/features/goals/http/routes/goalsRoutes";

// Configuração da aplicação de teste
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/goals", goalsRoutes);
  return app;
}

test("Goals Routes", async (t) => {
  const app = createTestApp();

  await t.test("GET / - deve retornar mensagem de teste OK", async () => {
    const response = await request(app).get("/api/goals");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.message, "GET funcionando — teste OK");
  });

  await t.test("POST / - deve criar uma meta com dados válidos", async () => {
    const validGoal = {
      product: "Produto Teste",
      productGoal: 1000,
      codRep: 123,
      monthGoal: 12,
      yearGoal: 2025,
      averagePrice: 50.5,
      cod_grp: "GRP001",
    };

    const response = await request(app)
      .post("/api/goals")
      .send(validGoal)
      .set("Content-Type", "application/json");

    assert.strictEqual(response.status, 201);
    assert.ok(response.body.id);
    assert.strictEqual(response.body.product, validGoal.product);
    assert.strictEqual(response.body.productGoal, validGoal.productGoal);
    assert.strictEqual(response.body.codRep, validGoal.codRep);
    assert.strictEqual(response.body.monthGoal, validGoal.monthGoal);
    assert.strictEqual(response.body.yearGoal, validGoal.yearGoal);
  });

  await t.test("POST / - deve retornar erro 400 com dados inválidos (produto vazio)", async () => {
    const invalidGoal = {
      product: "",
      productGoal: 1000,
      codRep: 123,
      monthGoal: 12,
      yearGoal: 2025,
      averagePrice: 50.5,
    };

    const response = await request(app)
      .post("/api/goals")
      .send(invalidGoal)
      .set("Content-Type", "application/json");

    assert.strictEqual(response.status, 400);
    assert.ok(response.body.error);
    assert.strictEqual(response.body.error, "Invalid data");
  });

  await t.test("POST / - deve retornar erro 400 com mês inválido", async () => {
    const invalidGoal = {
      product: "Produto Teste",
      productGoal: 1000,
      codRep: 123,
      monthGoal: 13, // mês inválido
      yearGoal: 2025,
      averagePrice: 50.5,
    };

    const response = await request(app)
      .post("/api/goals")
      .send(invalidGoal)
      .set("Content-Type", "application/json");

    assert.strictEqual(response.status, 400);
    assert.ok(response.body.error);
  });

  await t.test("POST / - deve retornar erro 400 sem campos obrigatórios", async () => {
    const invalidGoal = {
      product: "Produto Teste",
      // faltando campos obrigatórios
    };

    const response = await request(app)
      .post("/api/goals")
      .send(invalidGoal)
      .set("Content-Type", "application/json");

    assert.strictEqual(response.status, 400);
    assert.ok(response.body.error);
  });

  await t.test("POST / - deve aceitar meta sem cod_grp (campo opcional)", async () => {
    const validGoal = {
      product: "Produto Teste",
      productGoal: 1000,
      codRep: 123,
      monthGoal: 12,
      yearGoal: 2025,
      averagePrice: 50.5,
      // cod_grp é opcional
    };

    const response = await request(app)
      .post("/api/goals")
      .send(validGoal)
      .set("Content-Type", "application/json");

    assert.strictEqual(response.status, 201);
    assert.ok(response.body.id);
  });
});