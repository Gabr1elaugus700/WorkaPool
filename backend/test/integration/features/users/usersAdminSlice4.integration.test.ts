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
import departamentosRoutes from "../../../../src/features/departamentos/routes/departamentosRoutes";
import express from "express";
import {
  assertTestDatabase,
  cleanupUsersFixtures,
  createRoleToken,
  fixturePrefix,
  prisma,
} from "../../../helpers/usersIntegration";

const SCOPE = "s4";
const fixtures = fixturePrefix(SCOPE);

function createDeptTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/departamentos", departamentosRoutes);
  return app;
}

describe("Users admin slice 4 integration (#87)", () => {
  before(async () => {
    assertTestDatabase();
  });

  afterEach(async () => {
    await cleanupUsersFixtures(SCOPE);
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("PUT /api/departamentos/users/function updates function when link already exists", async () => {
    const deptName = `${fixtures.dept}logistica`;
    const username = `${fixtures.user}dept-func`;
    const adminToken = createRoleToken(Role.ADMIN);

    const department = await prisma.departamento.create({
      data: { name: deptName, recebe_os: false },
    });

    const hashedPassword = await bcrypt.hash("senha123", 10);
    const user = await prisma.user.create({
      data: {
        user: username,
        password: hashedPassword,
        role: Role.USER,
        name: "Usuário Dept",
      },
    });

    await prisma.usuarioDepartamento.create({
      data: {
        user_id: user.id,
        departamento_id: department.id,
        funcao: "GERENTE",
      },
    });

    const app = createDeptTestApp();
    const response = await request(app)
      .put("/api/departamentos/users/function")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: user.id,
        departamentoId: department.id,
        funcao: "FUNCIONARIO",
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.funcao, "FUNCIONARIO");

    const links = await prisma.usuarioDepartamento.findMany({
      where: { user_id: user.id, departamento_id: department.id },
    });
    assert.equal(links.length, 1);
    assert.equal(links[0]?.funcao, "FUNCIONARIO");
  });
});
