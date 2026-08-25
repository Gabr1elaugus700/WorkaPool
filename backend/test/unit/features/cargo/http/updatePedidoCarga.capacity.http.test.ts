import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import express, { Express } from "express";
import { Role } from "@prisma/client";
import {
  Carga,
  SituacaoCarga,
} from "../../../../../src/features/cargo/entities/Carga";
import { CargoController } from "../../../../../src/features/cargo/http/controllers/CargoController";
import { UpdatePedidoCargaUseCase } from "../../../../../src/features/cargo/useCases/UpdatePedidoCarga.use-case";
import { PedidoRaw } from "../../../../../src/features/pedidos/types/PedidoRaw";
import {
  authMiddleware,
  requireRoles,
} from "../../../../../src/middlewares/authMiddleware";
import { FakeSapiens } from "../../../../helpers/FakeSapiens";

const cargoWriteRoles: Role[] = [
  Role.ADMIN,
  Role.LOGISTICA,
  Role.GERENTE_DPTO,
  Role.VENDAS,
];

const buildRow = (overrides: Partial<PedidoRaw> = {}): PedidoRaw => ({
  NUM_PED: "1001",
  COD_CLI: "C1",
  CLIENTE: "Cliente Teste",
  CIDADE: "Blumenau",
  ESTADO: "SC",
  VENDEDOR: "Vendedor Teste",
  CODREP: 1,
  BLOQUEADO: "N",
  PESO: 100,
  PRODUTOS: "Produto",
  DERIVACAO: "001",
  QUANTIDADE: 1,
  CODCAR: 0,
  POSCAR: 0,
  SITCAR: "",
  QTD_ORI_PED: 1,
  ...overrides,
});

function createToken(role: Role): string {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

function createOverCapacityFake(): FakeSapiens {
  const carga = new Carga({
    id: "carga-20",
    codCar: 20,
    destino: "Blumenau",
    pesoMaximo: 1000,
    previsaoSaida: new Date("2026-08-20T10:00:00.000Z"),
    situacao: SituacaoCarga.ABERTA,
  });

  return new FakeSapiens({
    cargas: [carga],
    rows: [
      buildRow({
        NUM_PED: "2002",
        DERIVACAO: "001",
        PESO: 400,
        CODCAR: 20,
        POSCAR: 1,
      }),
      buildRow({
        NUM_PED: "2002",
        DERIVACAO: "002",
        PESO: 500,
        CODCAR: 20,
        POSCAR: 1,
      }),
      buildRow({
        NUM_PED: "3003",
        DERIVACAO: "001",
        PESO: 80,
        CODCAR: 0,
        POSCAR: 0,
      }),
      buildRow({
        NUM_PED: "3003",
        DERIVACAO: "002",
        PESO: 70,
        CODCAR: 0,
        POSCAR: 0,
      }),
    ],
  });
}

function createApp(fakeSapiens: FakeSapiens): Express {
  const app = express();
  app.use(express.json());

  const handler = CargoController.createUpdatePedidoCargaHandler({
    createUseCase: () => new UpdatePedidoCargaUseCase(fakeSapiens, fakeSapiens),
  });

  app.put(
    "/api/cargo/update-pedido/:numPed",
    authMiddleware,
    requireRoles(cargoWriteRoles),
    handler,
  );

  return app;
}

describe("PUT update-pedido capacity HTTP", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("rejects over-capacity for VENDAS with CARGO_CAPACIDADE_EXCEDIDA", async () => {
    const fakeSapiens = createOverCapacityFake();
    const app = createApp(fakeSapiens);
    const token = createToken(Role.VENDAS);

    const response = await request(app)
      .put("/api/cargo/update-pedido/3003")
      .set("Authorization", `Bearer ${token}`)
      .send({ codCar: 20, posCar: 2 });

    assert.strictEqual(response.status, 422);
    assert.strictEqual(response.body.code, "CARGO_CAPACIDADE_EXCEDIDA");
    assert.strictEqual(
      fakeSapiens.getWriteCounts().pedidosCargaAtualizados,
      0,
    );
  });

  it("allows over-capacity for privileged role", async () => {
    const fakeSapiens = createOverCapacityFake();
    const app = createApp(fakeSapiens);
    const token = createToken(Role.LOGISTICA);

    const response = await request(app)
      .put("/api/cargo/update-pedido/3003")
      .set("Authorization", `Bearer ${token}`)
      .send({ codCar: 20, posCar: 2 });

    assert.strictEqual(response.status, 200);
    const pedidosNaCarga = await fakeSapiens.getPedidosByCarga(20);
    assert.equal(
      pedidosNaCarga.some((pedido) => pedido.numPed === "3003"),
      true,
    );
  });

  it("VENDAS cannot bypass capacity via API", async () => {
    const fakeSapiens = createOverCapacityFake();
    const app = createApp(fakeSapiens);
    const token = createToken(Role.VENDAS);

    const response = await request(app)
      .put("/api/cargo/update-pedido/3003")
      .set("Authorization", `Bearer ${token}`)
      .send({ codCar: 20, posCar: 2 });

    assert.strictEqual(response.status, 422);
    assert.strictEqual(response.body.code, "CARGO_CAPACIDADE_EXCEDIDA");
  });
});
