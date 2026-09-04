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
  createUsersTestApp,
  fixturePrefix,
  prisma,
} from "../../../helpers/usersIntegration";

const SCOPE = "s3";
const fixtures = fixturePrefix(SCOPE);

describe("Users admin slice 3 integration (#87)", () => {
  before(async () => {
    assertTestDatabase();
  });

  afterEach(async () => {
    await cleanupUsersFixtures(SCOPE);
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/users omits inactive users by default", async () => {
    const hashedPassword = "not-used-for-list";
    await prisma.user.create({
      data: {
        user: `${fixtures.user}active`,
        password: hashedPassword,
        role: Role.USER,
        name: "Usuário Ativo",
        isActive: true,
      },
    });
    await prisma.user.create({
      data: {
        user: `${fixtures.user}inactive`,
        password: hashedPassword,
        role: Role.USER,
        name: "Usuário Inativo",
        isActive: false,
      },
    });

    const app = createUsersTestApp();
    const token = createRoleToken(Role.ADMIN);

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
    const logins = (response.body as Array<{ user: string }>)
      .map((row) => row.user)
      .filter((login) => login.startsWith(fixtures.user));
    assert.deepEqual(logins, [`${fixtures.user}active`]);
  });

  it("GET /api/users?includeInactive=true includes inactive users", async () => {
    const hashedPassword = "not-used-for-list";
    await prisma.user.create({
      data: {
        user: `${fixtures.user}shown-active`,
        password: hashedPassword,
        role: Role.USER,
        name: "Ativo Visível",
        isActive: true,
      },
    });
    await prisma.user.create({
      data: {
        user: `${fixtures.user}shown-inactive`,
        password: hashedPassword,
        role: Role.USER,
        name: "Inativo Visível",
        isActive: false,
      },
    });

    const app = createUsersTestApp();
    const token = createRoleToken(Role.ADMIN);

    const response = await request(app)
      .get("/api/users")
      .query({ includeInactive: "true" })
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    const logins = (response.body as Array<{ user: string }>)
      .map((row) => row.user)
      .filter((login) => login.startsWith(fixtures.user))
      .sort();
    assert.deepEqual(logins, [
      `${fixtures.user}shown-active`,
      `${fixtures.user}shown-inactive`,
    ]);
  });

  it("GET /api/users?search= matches name or login", async () => {
    const hashedPassword = "not-used-for-list";
    await prisma.user.create({
      data: {
        user: `${fixtures.user}alpha`,
        password: hashedPassword,
        role: Role.USER,
        name: "Maria Silva",
        isActive: true,
      },
    });
    await prisma.user.create({
      data: {
        user: `${fixtures.user}bravo-unique`,
        password: hashedPassword,
        role: Role.USER,
        name: "João Costa",
        isActive: true,
      },
    });

    const app = createUsersTestApp();
    const token = createRoleToken(Role.ADMIN);

    const byName = await request(app)
      .get("/api/users")
      .query({ search: "Maria" })
      .set("Authorization", `Bearer ${token}`);
    const byLogin = await request(app)
      .get("/api/users")
      .query({ search: "bravo-unique" })
      .set("Authorization", `Bearer ${token}`);

    assert.equal(byName.status, 200);
    assert.equal(byLogin.status, 200);
    assert.deepEqual(
      (byName.body as Array<{ user: string }>)
        .map((row) => row.user)
        .filter((login) => login.startsWith(fixtures.user)),
      [`${fixtures.user}alpha`],
    );
    assert.deepEqual(
      (byLogin.body as Array<{ user: string }>)
        .map((row) => row.user)
        .filter((login) => login.startsWith(fixtures.user)),
      [`${fixtures.user}bravo-unique`],
    );
  });
});
