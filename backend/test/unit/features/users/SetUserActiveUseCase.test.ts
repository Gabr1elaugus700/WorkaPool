import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { SetUserActiveUseCase } from "../../../../src/features/users/useCases/SetUserActiveUseCase";
import { IUserRepository } from "../../../../src/features/users/repositories/IUserRepository";
import { AppError } from "../../../../src/utils/AppError";

const activeUser = {
  id: "user-id",
  user: "alvo",
  role: Role.USER,
  name: "Alvo",
  codRep: 0,
  mustChangePassword: false,
  isActive: true,
};

describe("SetUserActiveUseCase (#87 slice 6)", () => {
  it("sets isActive false on deactivate before returning public record", async () => {
    const update = mock.fn(async (_id: string, data: { isActive?: boolean }) => ({
      ...activeUser,
      isActive: data.isActive ?? true,
    }));
    const repository = {
      findByLogin: mock.fn(async () => null),
      findById: mock.fn(async () => activeUser),
      create: mock.fn(async () => activeUser),
      update,
      linkToDepartamento: mock.fn(async () => undefined),
    } as unknown as IUserRepository;

    const useCase = new SetUserActiveUseCase(repository);
    const result = await useCase.execute({
      targetUserId: activeUser.id,
      isActive: false,
    });

    assert.equal(result.isActive, false);
    assert.equal(update.mock.calls.length, 1);
    assert.deepEqual(update.mock.calls[0]?.arguments[1], { isActive: false });
  });

  it("rejects when user does not exist", async () => {
    const update = mock.fn(async () => {
      throw new Error("update não deve ser chamado");
    });
    const repository = {
      findByLogin: mock.fn(async () => null),
      findById: mock.fn(async () => null),
      create: mock.fn(async () => activeUser),
      update,
      linkToDepartamento: mock.fn(async () => undefined),
    } as unknown as IUserRepository;

    const useCase = new SetUserActiveUseCase(repository);

    await assert.rejects(
      async () =>
        useCase.execute({
          targetUserId: "missing-id",
          isActive: false,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 404);
        assert.strictEqual(error.code, "USER_NOT_FOUND");
        return true;
      },
    );

    assert.strictEqual(update.mock.calls.length, 0);
  });
});
