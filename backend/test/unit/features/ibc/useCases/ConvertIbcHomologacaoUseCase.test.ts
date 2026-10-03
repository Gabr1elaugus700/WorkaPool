import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { ConvertIbcHomologacaoUseCase } from "../../../../../src/features/ibc/useCases/ConvertIbcHomologacao.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import {
  CreateDerivedIbcData,
  IbcCadastroRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";
import { buildDerivedRecord, buildIbcRecord } from "./ibcRecordFixtures";

type RepositoryMock = Pick<
  IIbcCadastroRepository,
  "findById" | "createDerivedIbcFromSource"
>;

const buildRepo = (source: IbcCadastroRecord | null = buildIbcRecord()) => {
  const repository = {
    findById: mock.fn(async (_id: string) => source),
    createDerivedIbcFromSource: mock.fn(async (data: CreateDerivedIbcData) =>
      buildDerivedRecord(data, 87),
    ),
  };
  return repository;
};

function buildUseCase(repository: RepositoryMock) {
  return new ConvertIbcHomologacaoUseCase(repository as IIbcCadastroRepository);
}

function expectAppError(code: string, statusCode: number) {
  return (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, statusCode);
    return true;
  };
}

describe("ConvertIbcHomologacaoUseCase", () => {
  it("creates a new non-homologated record and registers lineage", async () => {
    const repository = buildRepo();

    const result = await buildUseCase(repository).execute({
      sourceIbcId: "ibc-source-1",
      actorId: "user-1",
      observation: "  avaria visual  ",
    });

    assert.equal(result.identificador, "NHMSA00087");
    assert.equal(result.produtoId, "produto-a");
    assert.deepEqual(repository.createDerivedIbcFromSource.mock.calls[0].arguments, [
      {
        sourceIbcId: "ibc-source-1",
        prefixo: "NHMSA",
        produtoId: "produto-a",
        changeType: "conversion",
        actorId: "user-1",
        observation: "avaria visual",
      },
    ]);
  });

  it("derives the prefix from the identifier when the record predates prefixo", async () => {
    const repository = buildRepo(
      buildIbcRecord({ identificador: "HM0007", prefixo: null, sequencial: null }),
    );

    await buildUseCase(repository).execute({ sourceIbcId: "ibc-source-1", actorId: "user-1" });

    assert.equal(repository.createDerivedIbcFromSource.mock.calls[0].arguments[0].prefixo, "NHM");
  });

  it("stores a null observation when blank", async () => {
    const repository = buildRepo();

    await buildUseCase(repository).execute({
      sourceIbcId: "ibc-source-1",
      actorId: "user-1",
      observation: "   ",
    });

    assert.equal(repository.createDerivedIbcFromSource.mock.calls[0].arguments[0].observation, null);
  });

  it("rejects conversion when IBC is already non-homologated", async () => {
    const repository = buildRepo(
      buildIbcRecord({ identificador: "NHMSA00015", prefixo: "NHMSA" }),
    );

    await assert.rejects(
      () => buildUseCase(repository).execute({ sourceIbcId: "ibc-source-1", actorId: "user-1" }),
      expectAppError("IBC_ALREADY_NON_HOMOLOGATED", 409),
    );
    assert.equal(repository.createDerivedIbcFromSource.mock.callCount(), 0);
  });

  it("rejects unknown source IBC with 404", async () => {
    const repository = buildRepo(null);

    await assert.rejects(
      () => buildUseCase(repository).execute({ sourceIbcId: "missing", actorId: "user-1" }),
      expectAppError("IBC_NOT_FOUND", 404),
    );
    assert.equal(repository.createDerivedIbcFromSource.mock.callCount(), 0);
  });

  it("rejects identifiers outside the HM family", async () => {
    const repository = buildRepo(
      buildIbcRecord({ identificador: "XY00001", prefixo: "XY" }),
    );

    await assert.rejects(
      () => buildUseCase(repository).execute({ sourceIbcId: "ibc-source-1", actorId: "user-1" }),
      expectAppError("IBC_PREFIXO_HOMOLOGADO_INVALIDO", 409),
    );
  });
});
