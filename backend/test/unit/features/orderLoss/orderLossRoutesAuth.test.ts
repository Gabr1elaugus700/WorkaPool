import test from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import request from "supertest";
import express, { Express } from "express";

import ordersRoutes from "../../../../src/features/orderLoss/http/routes/ordersRoutes";

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/orders", ordersRoutes);
  return app;
}

function createToken(role: string, codRep?: number) {
  return jwt.sign(
    {
      id: "user-test",
      role,
      codRep,
      name: "User",
    },
    "dev_secret",
  );
}

test("OrderLoss Routes - PUT /loss-reason auth e validação", async (t) => {
  const app = createTestApp();

  await t.test("PUT /loss-reason sem token deve retornar 401", async () => {
    const response = await request(app).put("/api/orders/loss-reason").send({
      orderId: "11111111-1111-1111-1111-111111111111",
      code: "FREIGHT",
      description: "justificativa de perda válida",
      submittedBy: "123",
    });

    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.error, "Token ausente");
  });

  await t.test("PUT /loss-reason com role sem permissão deve retornar 403", async () => {
    const token = createToken("USER", 123);
    const response = await request(app)
      .put("/api/orders/loss-reason")
      .set("Authorization", `Bearer ${token}`)
      .send({
        orderId: "11111111-1111-1111-1111-111111111111",
        code: "FREIGHT",
        description: "justificativa de perda válida",
        submittedBy: "123",
      });

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.error, "Acesso negado");
  });

  await t.test("PUT /loss-reason com VENDAS e submittedBy diferente deve retornar 403", async () => {
    const token = createToken("VENDAS", 123);
    const response = await request(app)
      .put("/api/orders/loss-reason")
      .set("Authorization", `Bearer ${token}`)
      .send({
        orderId: "11111111-1111-1111-1111-111111111111",
        code: "FREIGHT",
        description: "justificativa de perda válida",
        submittedBy: "999",
      });

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.error, "Vendedor só pode atualizar motivo para si próprio");
  });

  await t.test("PUT /loss-reason com payload inválido deve retornar 400", async () => {
    const token = createToken("VENDAS", 123);
    const response = await request(app)
      .put("/api/orders/loss-reason")
      .set("Authorization", `Bearer ${token}`)
      .send({
        orderId: "invalid-uuid",
        code: "FREIGHT",
        description: "justificativa de perda válida",
        submittedBy: "123",
      });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.error, "Dados inválidos");
  });
});

