import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { UpdateUserUseCase } from "../../../../src/features/users/useCases/UpdateUserUseCase";
import { IUserRepository } from "../../../../src/features/users/repositories/IUserRepository";
import { AppError } from "../../../../src/utils/AppError";

const adminUser = {
  id: "admin-id",
  user: "admin",
  role: Role.ADMIN,
  name: "Admin",
  codRep: 0,
  mustChangePassword: false,
  isActive: true,
};

describe("UpdateUserUseCase (#87 slice 4)", () => {
  it("rejects ADMIN self-demotion before persist", async () => {
    const update = mock.fn(async () => {
      throw new Error("update não deve ser chamado");
    });
    const repository = {
      findByLogin: mock.fn(async () => null),
      findById: mock.fn(async () => adminUser),
      create: mock.fn(async () => adminUser),
      update,
      linkToDepartamento: mock.fn(async () => undefined),
    } as unknown as IUserRepository;

    const useCase = new UpdateUserUseCase(repository);

    await assert.rejects(
      async () =>
        useCase.execute({
          targetUserId: adminUser.id,
          actorUserId: adminUser.id,
          role: Role.VENDAS,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 422);
        assert.strictEqual(error.code, "USER_SELF_DEMOTION_FORBIDDEN");
        return true;
      },
    );

    assert.strictEqual(update.mock.calls.length, 0);
  });
});
