import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  ConvertIbcHomologacaoUseCase,
} from "../../../../../src/features/ibc/useCases/ConvertIbcHomologacao.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { AppError } from "../../../../../src/utils/AppError";

type RepositoryMock = Pick<
  IIbcCadastroRepository,
  "findById" | "findHighestIdentificadorByPrefix" | "createDerivedIbcFromSource"
>;

const buildRepo = (): RepositoryMock => ({
  findById: mock.fn(async () => ({
    id: "ibc-source-1",
    identificador: "HMSA00015",
    produtoId: "produto-1",
  })),
  findHighestIdentificadorByPrefix: mock.fn(async () => "NHMSA00086"),
  createDerivedIbcFromSource: mock.fn(async (data) => ({
    id: "ibc-target-1",
    identificador: data.identificador,
    produtoId: data.produtoId,
  })),
});

describe("ConvertIbcHomologacaoUseCase", () => {
  it("creates a new non-homologated record and registers lineage", async () => {
    const repository = buildRepo();
    const useCase = new ConvertIbcHomologacaoUseCase(repository as IIbcCadastroRepository);

    const result = await useCase.execute({
      sourceIbcId: "ibc-source-1",
      actorId: "user-1",
      observation: "avaria visual",
    });

    assert.equal(result.identificador, "NHMSA00087");
    assert.equal(result.produtoId, "produto-1");

    assert.equal(repository.findById.mock.callCount(), 1);
    assert.equal(repository.findHighestIdentificadorByPrefix.mock.callCount(), 1);
    assert.deepEqual(
      repository.findHighestIdentificadorByPrefix.mock.calls[0].arguments,
      ["NHMSA"],
    );

    assert.equal(repository.createDerivedIbcFromSource.mock.callCount(), 1);
    assert.deepEqual(
      repository.createDerivedIbcFromSource.mock.calls[0].arguments,
      [
        {
          sourceIbcId: "ibc-source-1",
          identificador: "NHMSA00087",
          produtoId: "produto-1",
          changeType: "conversion",
          actorId: "user-1",
          observation: "avaria visual",
        },
      ],
    );
  });

  it("rejects conversion when IBC is already non-homologated", async () => {
    const repository = buildRepo();
    repository.findById = mock.fn(async () => ({
      id: "ibc-source-1",
      identificador: "NHMSA00015",
      produtoId: "produto-1",
    }));
    const useCase = new ConvertIbcHomologacaoUseCase(repository as IIbcCadastroRepository);

    await assert.rejects(
      () =>
        useCase.execute({
          sourceIbcId: "ibc-source-1",
          actorId: "user-1",
        }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "IBC_ALREADY_NON_HOMOLOGATED",
    );
  });
});
