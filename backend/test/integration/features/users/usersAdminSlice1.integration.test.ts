import assert from "node:assert/strict";
import bcrypt from "bcrypt";
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
  createUsersTestApp,
  fixturePrefix,
  prisma,
} from "../../../helpers/usersIntegration";

const SCOPE = "s1";
const fixtures = fixturePrefix(SCOPE);

describe("Users admin slice 1 integration (#87)", () => {
  before(async () => {
    assertTestDatabase();
  });

  afterEach(async () => {
    await cleanupUsersFixtures(SCOPE);
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/users/:id never exposes password hash", async () => {
    const username = `${fixtures.user}target`;
    const hashedPassword = await bcrypt.hash("senha-secreta", 10);

    const persisted = await prisma.user.create({
      data: {
        user: username,
        password: hashedPassword,
        role: Role.USER,
        name: "Usuário Teste",
      },
    });

    const app = createUsersTestApp();
    const token = createRoleToken(Role.ADMIN);

    const response = await request(app)
      .get(`/api/users/${persisted.id}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.id, persisted.id);
    assert.equal(response.body.user, username);
    assert.equal("password" in response.body, false);
  });
});
