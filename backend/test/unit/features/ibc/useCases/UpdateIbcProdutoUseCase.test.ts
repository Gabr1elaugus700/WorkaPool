import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UpdateIbcProdutoUseCase } from "../../../../../src/features/ibc/useCases/UpdateIbcProduto.use-case";
import {
  IIbcProdutoRepository,
  UpdateIbcProdutoData,
} from "../../../../../src/features/ibc/repositories/IIbcProdutoRepository";
import {
  IbcProdutoListItem,
  IbcProdutoRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
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
  possuiIbcs = false,
): IIbcProdutoRepository & { updates: UpdateIbcProdutoData[]; hasIbcsCalls: string[] } {
  const updates: UpdateIbcProdutoData[] = [];
  const hasIbcsCalls: string[] = [];
  return {
    updates,
    hasIbcsCalls,
    async create(): Promise<IbcProdutoRecord> {
      throw new Error("not used");
    },
    async list(): Promise<IbcProdutoListItem[]> {
      return [];
    },
    async findById(): Promise<IbcProdutoRecord | null> {
      return found;
    },
    async hasIbcs(produtoId: string): Promise<boolean> {
      hasIbcsCalls.push(produtoId);
      return possuiIbcs;
    },
    async updateById(id: string, data: UpdateIbcProdutoData): Promise<IbcProdutoRecord> {
      updates.push(data);
      return { ...existing, id, ...data };
    },
  };
}

function isAbreviacaoEmUso(error: unknown): boolean {
  return (
    error instanceof AppError &&
    error.code === "IBC_PRODUTO_ABREVIACAO_EM_USO" &&
    error.statusCode === 409
  );
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

  it("blocks abreviacao change when produto has an active IBC", async () => {
    const repository = createRepository(existing, true);
    const useCase = new UpdateIbcProdutoUseCase(repository);

    await assert.rejects(
      () => useCase.execute({ id: "prod-1", nome: "Soda", abreviacao: "X" }),
      isAbreviacaoEmUso,
    );
    assert.deepEqual(repository.hasIbcsCalls, ["prod-1"]);
    assert.equal(repository.updates.length, 0);
  });

  it("blocks abreviacao change when produto only has baixado IBCs", async () => {
    // hasIbcs counts every linked IBC regardless of status; baixa does not free the sequencial.
    const repository = createRepository(existing, true);
    const useCase = new UpdateIbcProdutoUseCase(repository);

    await assert.rejects(
      () => useCase.execute({ id: "prod-1", nome: "Soda", abreviacao: "SX" }),
      isAbreviacaoEmUso,
    );
    assert.equal(repository.updates.length, 0);
  });

  it("allows abreviacao change when produto has no IBC", async () => {
    const repository = createRepository(existing, false);
    const useCase = new UpdateIbcProdutoUseCase(repository);

    const produto = await useCase.execute({ id: "prod-1", nome: "Soda", abreviacao: "x" });

    assert.deepEqual(repository.updates, [{ nome: "Soda", abreviacao: "X" }]);
    assert.equal(produto.abreviacao, "X");
  });

  it("allows changing only nome of a produto with IBCs", async () => {
    const repository = createRepository(existing, true);
    const useCase = new UpdateIbcProdutoUseCase(repository);

    const produto = await useCase.execute({ id: "prod-1", nome: "Soda Cáustica", abreviacao: "S" });

    assert.deepEqual(repository.updates, [{ nome: "Soda Cáustica", abreviacao: "S" }]);
    assert.equal(produto.nome, "Soda Cáustica");
  });

  it("treats same abreviacao after normalization as no change", async () => {
    const repository = createRepository(existing, true);
    const useCase = new UpdateIbcProdutoUseCase(repository);

    await useCase.execute({ id: "prod-1", nome: "Soda", abreviacao: " s " });

    assert.deepEqual(repository.hasIbcsCalls, []);
    assert.deepEqual(repository.updates, [{ nome: "Soda", abreviacao: "S" }]);
  });
});
