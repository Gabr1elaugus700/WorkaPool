import assert from "node:assert/strict";
import {
  after,
  afterEach,
  before,
  describe,
  it,
} from "node:test";
import request from "supertest";
import { Role } from "@prisma/client";
import {
  assertTestDatabase,
  cleanupUsersFixtures,
  createRoleToken,
  createUsersAdminTestApp,
  fixturePrefix,
  prisma,
} from "../../../helpers/usersIntegration";

const SCOPE = "s6";
const fixtures = fixturePrefix(SCOPE);

describe("Users admin slice 6 integration (#87)", () => {
  before(async () => {
    assertTestDatabase();
  });

  afterEach(async () => {
    await cleanupUsersFixtures(SCOPE);
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("ADMIN deactivate sets isActive false", async () => {
    const username = `${fixtures.user}deactivate`;
    const password = "senha123";
    const app = createUsersAdminTestApp();
    const adminToken = createRoleToken(Role.ADMIN);

    const createResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user: username,
        password,
        role: "USER",
        name: "Para Desativar",
      });

    assert.equal(createResponse.status, 201);
    const userId = createResponse.body.id as string;

    const deactivateResponse = await request(app)
      .post(`/api/users/${userId}/deactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(deactivateResponse.status, 200);
    assert.equal(deactivateResponse.body.isActive, false);

    const persisted = await prisma.user.findUnique({ where: { id: userId } });
    assert.equal(persisted?.isActive, false);
  });

  it("inactive user cannot log in", async () => {
    const username = `${fixtures.user}inactive-login`;
    const password = "senha123";
    const app = createUsersAdminTestApp();
    const adminToken = createRoleToken(Role.ADMIN);

    const createResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user: username,
        password,
        role: "USER",
        name: "Inativo Login",
      });

    assert.equal(createResponse.status, 201);
    const userId = createResponse.body.id as string;

    const deactivateResponse = await request(app)
      .post(`/api/users/${userId}/deactivate`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.equal(deactivateResponse.status, 200);

    const loginResponse = await request(app).post("/api/auth/login").send({
      user: username,
      password,
    });

    assert.ok(loginResponse.status === 401 || loginResponse.status === 403);
  });

  it("ADMIN reactivate allows login again", async () => {
    const username = `${fixtures.user}reactivate`;
    const password = "senha123";
    const app = createUsersAdminTestApp();
    const adminToken = createRoleToken(Role.ADMIN);

    const createResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user: username,
        password,
        role: "USER",
        name: "Reativar",
      });

    assert.equal(createResponse.status, 201);
    const userId = createResponse.body.id as string;

    await request(app)
      .post(`/api/users/${userId}/deactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    const reactivateResponse = await request(app)
      .post(`/api/users/${userId}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(reactivateResponse.status, 200);
    assert.equal(reactivateResponse.body.isActive, true);

    const loginResponse = await request(app).post("/api/auth/login").send({
      user: username,
      password,
    });

    assert.equal(loginResponse.status, 200);
  });
});
