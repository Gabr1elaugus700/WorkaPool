import test from "node:test";
import assert from "node:assert";

import { UpdateLossReasonUseCase } from "../../../../src/features/orderLoss/useCases/UpdateLossReasonUseCase";
import { LossReason } from "../../../../src/features/orderLoss/entities/LossReason";
import { LossReasonCode, Order, OrderStatus } from "../../../../src/features/orderLoss/entities/Order";
import type { IOrdersRepository } from "../../../../src/features/orderLoss/repositories/IOrdersRepository";

function makeRepoMock({
  order,
  lossReason,
  updateLossReasonImpl,
}: {
  order: Order | null;
  lossReason: LossReason | null;
  updateLossReasonImpl?: (args: {
    orderId: string;
    code: LossReasonCode;
    description: string;
    submittedBy: string;
  }) => Promise<LossReason>;
}): IOrdersRepository {
  return {
    // methods used by the use-case
    findById: async () => order,
    getLossReasonByOrderId: async () => lossReason,
    updateLossReason: async (orderId, code, description, submittedBy) => {
      if (updateLossReasonImpl) {
        return updateLossReasonImpl({ orderId, code, description, submittedBy });
      }
      if (!lossReason) {
        throw new Error("MOCK: updateLossReason called without existing lossReason");
      }

      // Default mock behavior: return a "updated" entity but preserve submittedAt
      return new LossReason({
        id: lossReason.id,
        orderId: lossReason.orderId,
        code,
        description,
        submittedBy,
        submittedAt: lossReason.submittedAt,
      });
    },

    // unused methods (stubbed)
    create: async () => {},
    update: async () => {},
    delete: async () => {},
    findByOrderNumber: async () => null,
    getAll: async () => [],
    getAllWithLossReasons: async () => [],
    getLostOrdersFromSapiens: async () => [],
    addProduct: async () => {},
    getProductsByOrderId: async () => [],
    addLossReason: async () => {},
  };
}

test("UpdateLossReasonUseCase - regras principais", async (t) => {
  const orderId = "11111111-1111-1111-1111-111111111111";
  const userId = "22222222-2222-2222-2222-222222222222";

  const msIn7Days = 7 * 24 * 60 * 60 * 1000;

  await t.test("sucesso: justificativa existente e dentro de 7 dias", async () => {
    const order = new Order({
      orderNumber: 1,
      status: OrderStatus.LOST,
      idUser: userId,
      codRep: "123",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const submittedAt = new Date(Date.now() - msIn7Days + 2000); // ageMs < msIn7Days
    const existing = new LossReason({
      orderId,
      code: LossReasonCode.FREIGHT,
      description: "perda inicial",
      submittedBy: "123",
      submittedAt,
    });

    const repo = makeRepoMock({
      order,
      lossReason: existing,
      updateLossReasonImpl: async ({ code, description, submittedBy }) => {
        return new LossReason({
          id: existing.id,
          orderId,
          code,
          description,
          submittedBy,
          submittedAt: existing.submittedAt, // preserve original submittedAt
        });
      },
    });

    const useCase = new UpdateLossReasonUseCase(repo);
    const result = await useCase.execute({
      orderId,
      code: LossReasonCode.PRICE,
      description: "perda corrigida com detalhes",
      submittedBy: "999",
    });

    assert.strictEqual(result.code, LossReasonCode.PRICE);
    assert.strictEqual(result.description, "perda corrigida com detalhes");
    assert.strictEqual(result.submittedBy, "999");
    assert.strictEqual(result.submittedAt.getTime(), submittedAt.getTime());
  });

  await t.test("404: não existe pedido", async () => {
    const repo = makeRepoMock({ order: null, lossReason: null });
    const useCase = new UpdateLossReasonUseCase(repo);

    await assert.rejects(
      () =>
        useCase.execute({
          orderId,
          code: LossReasonCode.FREIGHT,
          description: "perda inicial com detalhes",
          submittedBy: "123",
        }),
      (err: Error) => err.message === "ORDER_NOT_FOUND",
    );
  });

  await t.test("409: pedido não está LOST", async () => {
    const order = new Order({
      orderNumber: 1,
      status: OrderStatus.NEGOTIATING,
      idUser: userId,
      codRep: "123",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const repo = makeRepoMock({ order, lossReason: null });
    const useCase = new UpdateLossReasonUseCase(repo);

    await assert.rejects(
      () =>
        useCase.execute({
          orderId,
          code: LossReasonCode.FREIGHT,
          description: "perda inicial com detalhes",
          submittedBy: "123",
        }),
      (err: Error) => err.message === "ORDER_NOT_LOST",
    );
  });

  await t.test("404: não existe LossReason para o pedido", async () => {
    const order = new Order({
      orderNumber: 1,
      status: OrderStatus.LOST,
      idUser: userId,
      codRep: "123",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const repo = makeRepoMock({ order, lossReason: null });
    const useCase = new UpdateLossReasonUseCase(repo);

    await assert.rejects(
      () =>
        useCase.execute({
          orderId,
          code: LossReasonCode.FREIGHT,
          description: "perda inicial com detalhes",
          submittedBy: "123",
        }),
      (err: Error) => err.message === "LOSS_REASON_NOT_FOUND",
    );
  });

  await t.test("403: justificativa expirada (> 7 dias)", async () => {
    const order = new Order({
      orderNumber: 1,
      status: OrderStatus.LOST,
      idUser: userId,
      codRep: "123",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const submittedAt = new Date(Date.now() - msIn7Days - 2000); // ageMs > msIn7Days
    const existing = new LossReason({
      orderId,
      code: LossReasonCode.FREIGHT,
      description: "perda inicial",
      submittedBy: "123",
      submittedAt,
    });

    const repo = makeRepoMock({
      order,
      lossReason: existing,
      updateLossReasonImpl: async () => {
        throw new Error("MOCK: updateLossReason should not be called when expired");
      },
    });
    const useCase = new UpdateLossReasonUseCase(repo);

    await assert.rejects(
      () =>
        useCase.execute({
          orderId,
          code: LossReasonCode.PRICE,
          description: "perda corrigida com detalhes",
          submittedBy: "999",
        }),
      (err: Error) => err.message === "LOSS_REASON_EXPIRED",
    );
  });

  await t.test("janela: caso 'próximo' ao limite é permitido se <= 7 dias", async () => {
    const order = new Order({
      orderNumber: 1,
      status: OrderStatus.LOST,
      idUser: userId,
      codRep: "123",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const submittedAt = new Date(Date.now() - msIn7Days + 2000); // ageMs < msIn7Days
    const existing = new LossReason({
      orderId,
      code: LossReasonCode.FREIGHT,
      description: "perda inicial",
      submittedBy: "123",
      submittedAt,
    });

    const repo = makeRepoMock({ order, lossReason: existing });
    const useCase = new UpdateLossReasonUseCase(repo);

    const result = await useCase.execute({
      orderId,
      code: LossReasonCode.STOCK,
      description: "perda corrigida com detalhes",
      submittedBy: "999",
    });

    assert.strictEqual(result.code, LossReasonCode.STOCK);
    assert.strictEqual(result.submittedAt.getTime(), submittedAt.getTime());
  });
});

