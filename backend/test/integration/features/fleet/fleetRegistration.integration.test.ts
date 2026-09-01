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
  cleanupFleetFixtures,
  createFleetTestApp,
  createRoleToken,
  FLEET_FIXTURE_PREFIX,
  FLEET_PLATE_PREFIX,
  prisma,
} from "../../../helpers/fleetIntegration";
import { ensureTrucksFleetSchema } from "../../../helpers/ensureTrucksFleetSchema";

const validTruckBody = {
  name: "Volvo FH",
  capacity: 25000,
  plate: `${FLEET_PLATE_PREFIX}001`,
  type: "Cavalo",
  axles: 6,
  active: true,
};

describe("Fleet registration integration (#84)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureTrucksFleetSchema(prisma);
  });

  afterEach(async () => {
    await cleanupFleetFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("POST /api/trucks creates a Trucks record and returns the truck id", async () => {
    const app = createFleetTestApp();
    const token = createRoleToken(Role.LOGISTICA);

    const response = await request(app)
      .post("/api/trucks")
      .set("Authorization", `Bearer ${token}`)
      .send(validTruckBody);

    assert.equal(response.status, 201);
    assert.ok(response.body.id);
    assert.equal(response.body.plate, validTruckBody.plate);
    assert.equal(response.body.name, validTruckBody.name);
    assert.equal(response.body.capacity, validTruckBody.capacity);
    assert.equal(response.body.active, true);

    const persisted = await prisma.trucks.findUnique({
      where: { plate: validTruckBody.plate },
    });
    assert.ok(persisted);
    assert.equal(persisted.id, response.body.id);
    assert.equal(persisted.name, validTruckBody.name);
    assert.equal(persisted.capacity, validTruckBody.capacity);
    assert.equal(persisted.active, true);
  });

  it("PUT /api/trucks/:id can deactivate an active truck", async () => {
    const app = createFleetTestApp();
    const token = createRoleToken(Role.LOGISTICA);

    const created = await request(app)
      .post("/api/trucks")
      .set("Authorization", `Bearer ${token}`)
      .send(validTruckBody);

    assert.equal(created.status, 201);

    const updateResponse = await request(app)
      .put(`/api/trucks/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ active: false });

    assert.equal(updateResponse.status, 200);
    assert.equal(updateResponse.body.active, false);

    const persisted = await prisma.trucks.findUnique({
      where: { id: created.body.id },
    });
    assert.ok(persisted);
    assert.equal(persisted.active, false);
  });

  it("GET /api/cargo/trucks returns only active trucks", async () => {
    const app = createFleetTestApp();
    const token = createRoleToken(Role.LOGISTICA);

    const activePlate = `${FLEET_PLATE_PREFIX}ACT`;
    const inactivePlate = `${FLEET_PLATE_PREFIX}INA`;

    await prisma.trucks.createMany({
      data: [
        {
          name: "Truck Active",
          capacity: 10000,
          plate: activePlate,
          active: true,
        },
        {
          name: "Truck Inactive",
          capacity: 10000,
          plate: inactivePlate,
          active: false,
        },
      ],
    });

    const response = await request(app)
      .get("/api/cargo/trucks")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    const plates = response.body.map((truck: { plate: string }) => truck.plate);
    assert.ok(plates.includes(activePlate));
    assert.ok(!plates.includes(inactivePlate));
  });

  it("POST /api/auth/register creates a User with role MOTORISTA", async () => {
    const app = createFleetTestApp();
    const username = `${FLEET_FIXTURE_PREFIX}motorista`;

    const response = await request(app).post("/api/auth/register").send({
      user: username,
      password: "senha123",
      role: "MOTORISTA",
      name: "João Motorista",
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.role, "MOTORISTA");
    assert.equal(response.body.user, username);

    const persisted = await prisma.user.findUnique({ where: { user: username } });
    assert.ok(persisted);
    assert.equal(persisted.role, Role.MOTORISTA);
    assert.equal(persisted.name, "João Motorista");
  });

  it("GET /api/cargo/motoristas includes a registered MOTORISTA", async () => {
    const app = createFleetTestApp();
    const token = createRoleToken(Role.LOGISTICA);
    const username = `${FLEET_FIXTURE_PREFIX}listed`;

    const registerResponse = await request(app).post("/api/auth/register").send({
      user: username,
      password: "senha123",
      role: "MOTORISTA",
      name: "Maria Motorista",
    });
    assert.equal(registerResponse.status, 201);

    const response = await request(app)
      .get("/api/cargo/motoristas")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    const motorista = response.body.find(
      (user: { id: string }) => user.id === registerResponse.body.id,
    );
    assert.ok(motorista);
    assert.equal(motorista.name, "Maria Motorista");
    assert.equal(motorista.role, "MOTORISTA");
  });
});
