import test from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import request from "supertest";
import express, { Express } from "express";
import userRoutes from "../../../../src/features/users/routes/userRoutes";

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
  return app;
}

function createToken(role: string, id = "user-test") {
  return jwt.sign({ id, role }, "dev_secret");
}

const validCreateUserBody = {
  user: "novo.usuario",
  password: "senha123",
  role: "USER",
  name: "Novo Usuário",
};

test("User Routes - autenticação e autorização (issue #87 slice 1)", async (t) => {
  const app = createTestApp();

  await t.test("GET / sem token deve retornar 401", async () => {
    const response = await request(app).get("/api/users");
    assert.strictEqual(response.status, 401);
  });

  await t.test("GET / com role VENDAS deve retornar 403", async () => {
    const token = createToken("VENDAS");
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);
    assert.strictEqual(response.status, 403);
  });

  await t.test("GET /:id sem token deve retornar 401", async () => {
    const response = await request(app).get(
      "/api/users/11111111-1111-1111-1111-111111111111",
    );
    assert.strictEqual(response.status, 401);
  });

  await t.test("POST / com role LOGISTICA deve retornar 403", async () => {
    const token = createToken("LOGISTICA");
    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token}`)
      .send(validCreateUserBody);
    assert.strictEqual(response.status, 403);
  });
});
