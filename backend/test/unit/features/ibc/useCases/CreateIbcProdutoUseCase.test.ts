import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CreateIbcProdutoUseCase } from "../../../../../src/features/ibc/useCases/CreateIbcProduto.use-case";
import {
  CreateIbcProdutoData,
  IIbcProdutoRepository,
} from "../../../../../src/features/ibc/repositories/IIbcProdutoRepository";
import { IbcProdutoRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";

function createRepository(): IIbcProdutoRepository & { created: CreateIbcProdutoData[] } {
  const created: CreateIbcProdutoData[] = [];
  return {
    created,
    async create(data: CreateIbcProdutoData): Promise<IbcProdutoRecord> {
      created.push(data);
      const now = new Date("2026-10-01T00:00:00.000Z");
      return { id: "prod-1", ...data, createdAt: now, updatedAt: now };
    },
    async list(): Promise<IbcProdutoRecord[]> {
      return [];
    },
    async findById(): Promise<IbcProdutoRecord | null> {
      return null;
    },
  };
}

describe("CreateIbcProdutoUseCase", () => {
  it("trims nome and normalizes abreviacao before persisting", async () => {
    const repository = createRepository();
    const useCase = new CreateIbcProdutoUseCase(repository);

    const produto = await useCase.execute({ nome: "  Soda  ", abreviacao: " so " });

    assert.deepEqual(repository.created, [{ nome: "Soda", abreviacao: "SO" }]);
    assert.equal(produto.abreviacao, "SO");
  });

  it("rejects blank nome without persisting", async () => {
    const repository = createRepository();
    const useCase = new CreateIbcProdutoUseCase(repository);

    await assert.rejects(
      () => useCase.execute({ nome: "   ", abreviacao: "S" }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_PRODUTO_NOME_REQUIRED",
    );
    assert.equal(repository.created.length, 0);
  });

  it("rejects invalid abreviacao without persisting", async () => {
    const repository = createRepository();
    const useCase = new CreateIbcProdutoUseCase(repository);

    await assert.rejects(
      () => useCase.execute({ nome: "Soda", abreviacao: "S1" }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_PRODUTO_ABREVIACAO_INVALIDA",
    );
    assert.equal(repository.created.length, 0);
  });
});
