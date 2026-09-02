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
  prisma,
  USERS_FIXTURE_PREFIX,
} from "../../../helpers/usersIntegration";

describe("Users admin slice 2 integration (#87)", () => {
  before(async () => {
    assertTestDatabase();
  });

  afterEach(async () => {
    await cleanupUsersFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("ADMIN creates user with temp password; first login returns mustChangePassword true", async () => {
    const username = `${USERS_FIXTURE_PREFIX}first-login`;
    const tempPassword = "temp1234";
    const app = createUsersAdminTestApp();
    const adminToken = createRoleToken(Role.ADMIN);

    const createResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user: username,
        password: tempPassword,
        role: "USER",
        name: "Primeiro Login",
      });

    assert.equal(createResponse.status, 201);

    const loginResponse = await request(app).post("/api/auth/login").send({
      user: username,
      password: tempPassword,
    });

    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.mustChangePassword, true);
  });

  it("POST /api/auth/register does not create ADMIN account", async () => {
    const username = `${USERS_FIXTURE_PREFIX}blocked-admin`;
    const app = createUsersAdminTestApp();

    const response = await request(app).post("/api/auth/register").send({
      user: username,
      password: "senha123",
      role: "ADMIN",
      name: "Admin Bloqueado",
    });

    assert.ok(response.status === 401 || response.status === 403);

    const persisted = await prisma.user.findUnique({ where: { user: username } });
    assert.equal(persisted, null);
  });
});
