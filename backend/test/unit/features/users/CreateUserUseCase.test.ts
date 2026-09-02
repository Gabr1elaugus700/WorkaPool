import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { CreateUserUseCase } from "../../../../src/features/users/useCases/CreateUserUseCase";
import { IUserRepository } from "../../../../src/features/users/repositories/IUserRepository";
import { AppError } from "../../../../src/utils/AppError";

describe("CreateUserUseCase (#87 slice 2)", () => {
  it("rejects VENDAS without codRep before persist", async () => {
    const create = mock.fn(async () => {
      throw new Error("create não deve ser chamado");
    });
    const repository = {
      findByLogin: mock.fn(async () => null),
      create,
      linkToDepartamento: mock.fn(async () => undefined),
    } as unknown as IUserRepository;

    const useCase = new CreateUserUseCase(repository);

    await assert.rejects(
      async () =>
        useCase.execute({
          user: "vendedor",
          password: "senha123",
          role: Role.VENDAS,
          name: "Vendedor",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 422);
        assert.strictEqual(error.code, "USER_CODREP_REQUIRED");
        return true;
      },
    );

    assert.strictEqual(create.mock.calls.length, 0);
  });

  it("rejects GERENTE_DPTO without department before persist", async () => {
    const create = mock.fn(async () => {
      throw new Error("create não deve ser chamado");
    });
    const repository = {
      findByLogin: mock.fn(async () => null),
      create,
      linkToDepartamento: mock.fn(async () => undefined),
    } as unknown as IUserRepository;

    const useCase = new CreateUserUseCase(repository);

    await assert.rejects(
      async () =>
        useCase.execute({
          user: "gerente",
          password: "senha123",
          role: Role.GERENTE_DPTO,
          name: "Gerente",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 422);
        assert.strictEqual(error.code, "USER_DEPARTMENT_REQUIRED");
        return true;
      },
    );

    assert.strictEqual(create.mock.calls.length, 0);
  });

  it("persists user with mustChangePassword true", async () => {
    const create = mock.fn(async (input) => ({
      id: "user-1",
      user: input.user,
      role: input.role,
      name: input.name,
      codRep: input.codRep,
      mustChangePassword: input.mustChangePassword,
      isActive: true,
    }));
    const repository = {
      findByLogin: mock.fn(async () => null),
      create,
      linkToDepartamento: mock.fn(async () => undefined),
    } as unknown as IUserRepository;

    const useCase = new CreateUserUseCase(repository);
    const result = await useCase.execute({
      user: "novo.user",
      password: "senha123",
      role: Role.USER,
      name: "Novo Usuário",
    });

    assert.strictEqual(result.mustChangePassword, true);
    assert.strictEqual(create.mock.calls.length, 1);
    assert.strictEqual(create.mock.calls[0]?.arguments[0]?.mustChangePassword, true);
  });
});
