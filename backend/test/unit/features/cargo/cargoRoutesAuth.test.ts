import test from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import request from "supertest";
import express, { Express } from "express";
import cargoRoutes from "../../../../src/features/cargo/http/routes/CargoRoute";

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/cargo", cargoRoutes);
  return app;
}

function createToken(role: string) {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

test("Cargo Routes - autenticação e autorização", async (t) => {
  const app = createTestApp();

  await t.test("PATCH /:codCar/situacao sem token deve retornar 401", async () => {
    const response = await request(app)
      .patch("/api/cargo/1/situacao")
      .send({ situacao: "ABERTA" });

    assert.strictEqual(response.status, 401);
  });

  await t.test("PATCH /:codCar/situacao com role sem permissão deve retornar 403", async () => {
    // USER está em cargoReadRoles mas não em cargoWriteRoles (VENDAS pode escrita)
    const token = createToken("USER");
    const response = await request(app)
      .patch("/api/cargo/1/situacao")
      .set("Authorization", `Bearer ${token}`)
      .send({ situacao: "ABERTA" });

    assert.strictEqual(response.status, 403);
  });

  await t.test("PATCH /:codCar/situacao com codCar inválido deve retornar 400", async () => {
    const token = createToken("ADMIN");
    const response = await request(app)
      .patch("/api/cargo/abc/situacao")
      .set("Authorization", `Bearer ${token}`)
      .send({ situacao: "ABERTA" });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.error, "Código da carga inválido.");
  });
});

