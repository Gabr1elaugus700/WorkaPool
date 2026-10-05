import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../../../../../src/features/ibc/repositories/IIbcProdutoRepository";
import { ChangeIbcProdutoUseCase } from "../../../../../src/features/ibc/useCases/ChangeIbcProduto.use-case";
import {
  CreateDerivedIbcData,
  IbcCadastroRecord,
  IbcProdutoRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";
import {
  buildDerivedRecord,
  buildIbcRecord,
  buildProdutoRecord,
} from "./ibcRecordFixtures";

type CadastroRepoMock = Pick<
  IIbcCadastroRepository,
  "findById" | "createDerivedIbcFromSource"
>;
type ProdutoRepoMock = Pick<IIbcProdutoRepository, "findById">;

const buildCadastroRepo = (source: IbcCadastroRecord | null = buildIbcRecord()) => ({
  findById: mock.fn(async (_id: string) => source),
  createDerivedIbcFromSource: mock.fn(async (data: CreateDerivedIbcData) =>
    buildDerivedRecord(data, 23),
  ),
});

const buildProdutoRepo = (
  produto: IbcProdutoRecord | null = buildProdutoRecord(),
): ProdutoRepoMock => ({
  findById: mock.fn(async () => produto),
});

function buildUseCase(cadastroRepo: CadastroRepoMock, produtoRepo: ProdutoRepoMock) {
  return new ChangeIbcProdutoUseCase(
    cadastroRepo as IIbcCadastroRepository,
    produtoRepo as IIbcProdutoRepository,
  );
}

describe("ChangeIbcProdutoUseCase", () => {
  it("creates a new record with target product prefix and lineage", async () => {
    const cadastroRepo = buildCadastroRepo();

    const result = await buildUseCase(cadastroRepo, buildProdutoRepo()).execute({
      sourceIbcId: "ibc-source-1",
      targetProdutoId: "produto-b",
      actorId: "user-1",
      observation: "troca de produto",
    });

    assert.equal(result.identificador, "HMSO00023");
    assert.equal(result.produtoId, "produto-b");
    assert.deepEqual(cadastroRepo.createDerivedIbcFromSource.mock.calls[0].arguments, [
      {
        sourceIbcId: "ibc-source-1",
        prefixo: "HMSO",
        produtoId: "produto-b",
        changeType: "product_change",
        actorId: "user-1",
        observation: "troca de produto",
      },
    ]);
  });

  it("keeps the non-homologated family when the source is NHM", async () => {
    const cadastroRepo = buildCadastroRepo(
      buildIbcRecord({ identificador: "NHMSA00004", prefixo: "NHMSA" }),
    );

    await buildUseCase(cadastroRepo, buildProdutoRepo()).execute({
      sourceIbcId: "ibc-source-1",
      targetProdutoId: "produto-b",
      actorId: "user-1",
    });

    assert.equal(cadastroRepo.createDerivedIbcFromSource.mock.calls[0].arguments[0].prefixo, "NHMSO");
  });

  it("rejects when product does not change", async () => {
    const cadastroRepo = buildCadastroRepo();

    await assert.rejects(
      () =>
        buildUseCase(cadastroRepo, buildProdutoRepo(buildProdutoRecord({ id: "produto-a" }))).execute({
          sourceIbcId: "ibc-source-1",
          targetProdutoId: "produto-a",
          actorId: "user-1",
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_PRODUTO_UNCHANGED",
    );
    assert.equal(cadastroRepo.createDerivedIbcFromSource.mock.callCount(), 0);
  });

  it("rejects product change when the source was already replaced", async () => {
    const cadastroRepo = buildCadastroRepo(
      buildIbcRecord({ convertedToContainerId: "ibc-target-0" }),
    );
    const findProduto = mock.fn(async () => buildProdutoRecord());

    await assert.rejects(
      () =>
        buildUseCase(cadastroRepo, { findById: findProduto }).execute({
          sourceIbcId: "ibc-source-1",
          targetProdutoId: "produto-b",
          actorId: "user-1",
        }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "IBC_JA_SUBSTITUIDO" &&
        error.statusCode === 409,
    );
    assert.equal(cadastroRepo.createDerivedIbcFromSource.mock.callCount(), 0);
    assert.equal(findProduto.mock.callCount(), 0);
  });

  it("rejects unknown target product with 404", async () => {
    const cadastroRepo = buildCadastroRepo();

    await assert.rejects(
      () =>
        buildUseCase(cadastroRepo, buildProdutoRepo(null)).execute({
          sourceIbcId: "ibc-source-1",
          targetProdutoId: "missing",
          actorId: "user-1",
        }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "IBC_PRODUTO_NOT_FOUND" &&
        error.statusCode === 404,
    );
  });
});
