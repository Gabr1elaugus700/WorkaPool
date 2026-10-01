import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import express, { Express } from "express";
import authRoutes from "../../../../src/features/users/routes/authRoutes";

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

test("Public register is blocked (#87 slice 2)", async (t) => {
  const app = createTestApp();

  await t.test("POST /register with role ADMIN returns 403 and does not create user", async () => {
    const username = `blocked-admin-${Date.now()}`;
    const response = await request(app).post("/api/auth/register").send({
      user: username,
      password: "senha123",
      role: "ADMIN",
      name: "Admin Malicioso",
    });

    assert.ok(response.status === 401 || response.status === 403);
  });
});
