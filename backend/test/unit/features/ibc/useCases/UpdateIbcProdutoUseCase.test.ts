import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UpdateIbcProdutoUseCase } from "../../../../../src/features/ibc/useCases/UpdateIbcProduto.use-case";
import {
  IIbcProdutoRepository,
  UpdateIbcProdutoData,
} from "../../../../../src/features/ibc/repositories/IIbcProdutoRepository";
import { IbcProdutoRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";

const existing: IbcProdutoRecord = {
  id: "prod-1",
  nome: "Soda",
  abreviacao: "S",
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
};

function createRepository(
  found: IbcProdutoRecord | null,
): IIbcProdutoRepository & { updates: UpdateIbcProdutoData[] } {
  const updates: UpdateIbcProdutoData[] = [];
  return {
    updates,
    async create(): Promise<IbcProdutoRecord> {
      throw new Error("not used");
    },
    async list(): Promise<IbcProdutoRecord[]> {
      return [];
    },
    async findById(): Promise<IbcProdutoRecord | null> {
      return found;
    },
    async updateById(id: string, data: UpdateIbcProdutoData): Promise<IbcProdutoRecord> {
      updates.push(data);
      return { ...existing, id, ...data };
    },
  };
}

describe("UpdateIbcProdutoUseCase", () => {
  it("trims nome and normalizes abreviacao before updating", async () => {
    const repository = createRepository(existing);
    const useCase = new UpdateIbcProdutoUseCase(repository);

    const produto = await useCase.execute({ id: "prod-1", nome: " Soda A ", abreviacao: "sa" });

    assert.deepEqual(repository.updates, [{ nome: "Soda A", abreviacao: "SA" }]);
    assert.equal(produto.abreviacao, "SA");
  });

  it("returns 404 when produto does not exist", async () => {
    const repository = createRepository(null);
    const useCase = new UpdateIbcProdutoUseCase(repository);

    await assert.rejects(
      () => useCase.execute({ id: "missing", nome: "Soda", abreviacao: "S" }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "IBC_PRODUTO_NOT_FOUND" &&
        error.statusCode === 404,
    );
    assert.equal(repository.updates.length, 0);
  });

  it("rejects blank nome without updating", async () => {
    const repository = createRepository(existing);
    const useCase = new UpdateIbcProdutoUseCase(repository);

    await assert.rejects(
      () => useCase.execute({ id: "prod-1", nome: "  ", abreviacao: "S" }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_PRODUTO_NOME_REQUIRED",
    );
    assert.equal(repository.updates.length, 0);
  });
});
