import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../../../../../src/features/ibc/repositories/IIbcProdutoRepository";
import { ChangeIbcProdutoUseCase } from "../../../../../src/features/ibc/useCases/ChangeIbcProduto.use-case";
import { AppError } from "../../../../../src/utils/AppError";

type CadastroRepoMock = Pick<
  IIbcCadastroRepository,
  "findById" | "findHighestIdentificadorByPrefix" | "createDerivedIbcFromSource"
>;
type ProdutoRepoMock = Pick<IIbcProdutoRepository, "findById">;

const buildCadastroRepo = (): CadastroRepoMock => ({
  findById: mock.fn(async () => ({
    id: "ibc-source-1",
    identificador: "HMSA00015",
    produtoId: "produto-a",
    tipoCadastro: "NOVO",
    aptidao: "INAPTO",
    motivoInaptidao: "AGUARDANDO_INSPECAO",
    custodia: "PATIO",
    dataLimite: new Date("2099-12-31T00:00:00.000Z"),
    baixadoEm: null,
    createdAt: new Date("2026-09-16T10:00:00.000Z"),
  })),
  findHighestIdentificadorByPrefix: mock.fn(async () => "HMSO00022"),
  createDerivedIbcFromSource: mock.fn(async (data) => ({
    id: "ibc-target-1",
    identificador: data.identificador,
    produtoId: data.produtoId,
    tipoCadastro: "NOVO",
    aptidao: "INAPTO",
    motivoInaptidao: "AGUARDANDO_INSPECAO",
    custodia: "PATIO",
    dataLimite: new Date("2099-12-31T00:00:00.000Z"),
    baixadoEm: null,
    createdAt: new Date("2026-09-16T11:00:00.000Z"),
  })),
});

const buildProdutoRepo = (): ProdutoRepoMock => ({
  findById: mock.fn(async () => ({
    id: "produto-b",
    nome: "Soda",
    abreviacao: "SO",
    createdAt: new Date("2026-09-16T09:00:00.000Z"),
    updatedAt: new Date("2026-09-16T09:00:00.000Z"),
  })),
});

describe("ChangeIbcProdutoUseCase", () => {
  it("creates a new record with target product prefix and lineage", async () => {
    const cadastroRepo = buildCadastroRepo();
    const produtoRepo = buildProdutoRepo();
    const useCase = new ChangeIbcProdutoUseCase(
      cadastroRepo as IIbcCadastroRepository,
      produtoRepo as IIbcProdutoRepository,
    );

    const result = await useCase.execute({
      sourceIbcId: "ibc-source-1",
      targetProdutoId: "produto-b",
      actorId: "user-1",
      observation: "troca de produto",
    });

    assert.equal(result.identificador, "HMSO00023");
    assert.equal(result.produtoId, "produto-b");
    assert.deepEqual(cadastroRepo.findHighestIdentificadorByPrefix.mock.calls[0].arguments, [
      "HMSO",
    ]);
    assert.deepEqual(cadastroRepo.createDerivedIbcFromSource.mock.calls[0].arguments, [
      {
        sourceIbcId: "ibc-source-1",
        identificador: "HMSO00023",
        produtoId: "produto-b",
        changeType: "product_change",
        actorId: "user-1",
        observation: "troca de produto",
      },
    ]);
  });

  it("rejects when product does not change", async () => {
    const cadastroRepo = buildCadastroRepo();
    const produtoRepo = buildProdutoRepo();
    produtoRepo.findById = mock.fn(async () => ({
      id: "produto-a",
      nome: "Mesmo",
      abreviacao: "SA",
      createdAt: new Date("2026-09-16T09:00:00.000Z"),
      updatedAt: new Date("2026-09-16T09:00:00.000Z"),
    }));

    const useCase = new ChangeIbcProdutoUseCase(
      cadastroRepo as IIbcCadastroRepository,
      produtoRepo as IIbcProdutoRepository,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          sourceIbcId: "ibc-source-1",
          targetProdutoId: "produto-a",
          actorId: "user-1",
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_PRODUTO_UNCHANGED",
    );
  });
});
