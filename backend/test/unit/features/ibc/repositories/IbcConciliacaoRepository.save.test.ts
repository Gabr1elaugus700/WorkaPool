import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { IbcConciliacaoRepository } from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";

describe("IbcConciliacaoRepository.save", () => {
  it("grava o pedido apontado na marca e na alocação", async () => {
    const alocacoes: Array<{ where: { id: string }; data: { numPed: string | null } }> = [];
    const marcas: Array<{ create: { numPed: string | null }; update: { numPed: string | null } }> = [];
    const prisma = {
      conciliacaoViagemIbc: {
        deleteMany: () => Promise.resolve({ count: 0 }),
        upsert: (args: { create: { numPed: string | null }; update: { numPed: string | null } }) => {
          marcas.push(args);
          return Promise.resolve({});
        },
      },
      alocacaoIbc: {
        updateMany: () => Promise.resolve({ count: 0 }),
        update: (args: { where: { id: string }; data: { numPed: string | null } }) => {
          alocacoes.push(args);
          return Promise.resolve({});
        },
      },
      conciliacaoRetornoSemId: { upsert: () => Promise.resolve({}) },
      $transaction: async (batch: Array<Promise<unknown>>) => Promise.all(batch),
    };
    await new IbcConciliacaoRepository(prisma as unknown as PrismaClient).save({
      expedicaoIbcId: "exp-1",
      lancadoPorId: "almox-1",
      marcas: [
        { alocacaoIbcId: "aloc-1", destino: "FICOU", modalidade: "VENDA", numPed: "10" },
        { alocacaoIbcId: "aloc-2", destino: "RETORNOU", modalidade: null, numPed: null },
      ],
      retornos: [],
    });
    assert.deepEqual(alocacoes, [
      { where: { id: "aloc-1" }, data: { numPed: "10" } },
      { where: { id: "aloc-2" }, data: { numPed: null } },
    ]);
    assert.equal(marcas[0]?.create.numPed, "10");
    assert.equal(marcas[0]?.update.numPed, "10");
    assert.equal(marcas[1]?.create.numPed, null);
  });

  it("remove marcas desmarcadas e limpa o pedido das alocações sem destino", async () => {
    const deletadas: unknown[] = [];
    const limpas: unknown[] = [];
    const prisma = {
      conciliacaoViagemIbc: {
        deleteMany: (args: unknown) => {
          deletadas.push(args);
          return Promise.resolve({ count: 1 });
        },
        upsert: () => Promise.resolve({}),
      },
      alocacaoIbc: {
        updateMany: (args: unknown) => {
          limpas.push(args);
          return Promise.resolve({ count: 1 });
        },
        update: () => Promise.resolve({}),
      },
      conciliacaoRetornoSemId: { upsert: () => Promise.resolve({}) },
      expedicaoIbc: { update: () => Promise.resolve({}) },
      $transaction: async (batch: Array<Promise<unknown>>) => Promise.all(batch),
    };
    await new IbcConciliacaoRepository(prisma as unknown as PrismaClient).save({
      expedicaoIbcId: "exp-1",
      lancadoPorId: "almox-1",
      marcas: [{ alocacaoIbcId: "aloc-1", destino: "FICOU", modalidade: "VENDA", numPed: "10" }],
      retornos: [],
      chegaramAMais: 0,
    });
    assert.deepEqual(deletadas, [{
      where: {
        expedicaoIbcId: "exp-1",
        ibcEntradaId: null,
        alocacaoIbcId: { notIn: ["aloc-1"] },
      },
    }]);
    assert.deepEqual(limpas, [{
      where: {
        expedicaoIbcId: "exp-1",
        id: { notIn: ["aloc-1"] },
      },
      data: { numPed: null },
    }]);
  });
});
