import test from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import request from "supertest";
import express, { Express } from "express";
import trucksRoutes from "../../../../src/features/trucks/http/routes/TrucksRoute";

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/trucks", trucksRoutes);
  return app;
}

function createToken(role: string) {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

const validTruckBody = {
  name: "Volvo FH",
  capacity: 25000,
  plate: "ABC1D23",
  type: "Cavalo",
  axles: 6,
  active: true,
};

test("Trucks Routes - autenticação e autorização", async (t) => {
  const app = createTestApp();

  await t.test("GET / sem token deve retornar 401", async () => {
    const response = await request(app).get("/api/trucks");
    assert.strictEqual(response.status, 401);
  });

  await t.test("POST / sem token deve retornar 401", async () => {
    const response = await request(app)
      .post("/api/trucks")
      .send(validTruckBody);
    assert.strictEqual(response.status, 401);
  });

  await t.test("POST / com role VENDAS deve retornar 403", async () => {
    const token = createToken("VENDAS");
    const response = await request(app)
      .post("/api/trucks")
      .set("Authorization", `Bearer ${token}`)
      .send(validTruckBody);
    assert.strictEqual(response.status, 403);
  });

  await t.test("POST / com body inválido deve retornar 400", async () => {
    const token = createToken("LOGISTICA");
    const response = await request(app)
      .post("/api/trucks")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sem placa" });
    assert.strictEqual(response.status, 400);
  });
});
