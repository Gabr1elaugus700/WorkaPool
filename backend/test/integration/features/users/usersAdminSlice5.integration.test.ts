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

describe("Users admin slice 5 integration (#87)", () => {
  before(async () => {
    assertTestDatabase();
  });

  afterEach(async () => {
    await cleanupUsersFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("ADMIN reset-password writes new hash; user authenticates with new password", async () => {
    const username = `${USERS_FIXTURE_PREFIX}reset-hash`;
    const oldPassword = "oldpass1";
    const newPassword = "newpass1";
    const app = createUsersAdminTestApp();
    const adminToken = createRoleToken(Role.ADMIN);

    const createResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user: username,
        password: oldPassword,
        role: "USER",
        name: "Reset Hash",
      });

    assert.equal(createResponse.status, 201);
    const userId = createResponse.body.id as string;

    await prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: false },
    });

    const resetResponse = await request(app)
      .post(`/api/users/${userId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: newPassword });

    assert.equal(resetResponse.status, 200);

    const loginWithOld = await request(app).post("/api/auth/login").send({
      user: username,
      password: oldPassword,
    });
    assert.equal(loginWithOld.status, 401);

    const loginWithNew = await request(app).post("/api/auth/login").send({
      user: username,
      password: newPassword,
    });
    assert.equal(loginWithNew.status, 200);
    assert.equal(loginWithNew.body.mustChangePassword, false);
  });

  it("ADMIN reset-password with mustChangePassword true forces change on next login", async () => {
    const username = `${USERS_FIXTURE_PREFIX}reset-mcp`;
    const newPassword = "newpass2";
    const app = createUsersAdminTestApp();
    const adminToken = createRoleToken(Role.ADMIN);

    const createResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user: username,
        password: "temppass",
        role: "USER",
        name: "Reset MCP",
      });

    assert.equal(createResponse.status, 201);
    const userId = createResponse.body.id as string;

    const resetResponse = await request(app)
      .post(`/api/users/${userId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: newPassword, mustChangePassword: true });

    assert.equal(resetResponse.status, 200);

    const loginResponse = await request(app).post("/api/auth/login").send({
      user: username,
      password: newPassword,
    });

    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.mustChangePassword, true);
  });
});
