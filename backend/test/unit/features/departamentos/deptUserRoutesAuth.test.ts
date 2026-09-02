import test from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import request from "supertest";
import express, { Express } from "express";
import departamentosRoutes from "../../../../src/features/departamentos/routes/departamentosRoutes";

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/departamentos", departamentosRoutes);
  return app;
}

function createToken(role: string) {
  return jwt.sign({ id: "dept-auth-test", role }, "dev_secret");
}

test("Department user routes - auth (#87 slice 4)", async (t) => {
  const app = createTestApp();
  const body = {
    userId: "11111111-1111-1111-1111-111111111111",
    departamentoId: "22222222-2222-2222-2222-222222222222",
    funcao: "FUNCIONARIO",
  };

  await t.test("PUT /users/function sem token deve retornar 401", async () => {
    const response = await request(app)
      .put("/api/departamentos/users/function")
      .send(body);
    assert.strictEqual(response.status, 401);
  });

  await t.test("POST /users/add com role VENDAS deve retornar 403", async () => {
    const token = createToken("VENDAS");
    const response = await request(app)
      .post("/api/departamentos/users/add")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    assert.strictEqual(response.status, 403);
  });
});
