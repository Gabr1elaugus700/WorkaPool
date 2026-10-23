import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { ConvertIbcHomologacaoUseCase } from "../../../../../src/features/ibc/useCases/ConvertIbcHomologacao.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IbcProdutoConfigRecord } from "../../../../../src/features/ibc/repositories/IbcProdutoRepository";
import {
  CreateDerivedIbcData,
  IbcCadastroRecord,
  IbcProdutoRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";
import { buildDerivedRecord, buildIbcRecord } from "./ibcRecordFixtures";

type RepositoryMock = Pick<IIbcCadastroRepository, "findById" | "createDerivedIbcFromSource">;

const PRODUTO_SA: IbcProdutoRecord = {
  id: "produto-a",
  nome: "Soda",
  abreviacao: "SA",
  sigla: "SA",
  corHex: "#AA0000",
  universal: false,
  createdAt: new Date("2026-09-16T09:00:00.000Z"),
  updatedAt: new Date("2026-09-16T09:00:00.000Z"),
};

const UNIVERSAL: IbcProdutoConfigRecord = {
  id: "universal-1",
  grupoCodigo: null,
  sigla: null,
  corHex: "#00FF00",
  universal: true,
  emUso: false,
};

const GRUPO_S: IbcProdutoConfigRecord = {
  id: "produto-s",
  grupoCodigo: "10",
  sigla: "S",
  corHex: "#FF0000",
  universal: false,
  emUso: true,
};

const buildRepo = (source: IbcCadastroRecord | null = buildIbcRecord({ corHex: "#AA0000" })) => {
  const repository = {
    findById: mock.fn(async (_id: string) => source),
    createDerivedIbcFromSource: mock.fn(async (data: CreateDerivedIbcData) =>
      buildDerivedRecord(data, 87),
    ),
  };
  return repository;
};

function buildProdutos(options: {
  porId?: IbcProdutoRecord | null;
  universal?: IbcProdutoConfigRecord | null;
  porGrupo?: IbcProdutoConfigRecord | null;
} = {}) {
  return {
    findById: mock.fn(async () => (options.porId === undefined ? PRODUTO_SA : options.porId)),
    findUniversal: mock.fn(async () => (options.universal === undefined ? null : options.universal)),
    findByGrupoCodigo: mock.fn(async () => options.porGrupo ?? null),
  };
}

function buildUseCase(
  repository: RepositoryMock,
  produtos = buildProdutos(),
  hasGrupo = true,
) {
  return new ConvertIbcHomologacaoUseCase(
    repository as IIbcCadastroRepository,
    produtos,
    { hasGrupo: mock.fn(async () => hasGrupo) },
  );
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
  it("keeps the group and records the plate of before and after", async () => {
    const repository = buildRepo();

    const result = await buildUseCase(repository).execute({
      sourceIbcId: "ibc-source-1",
      actorId: "user-1",
      observation: "  avaria visual  ",
      destino: "manter_grupo",
    });

    assert.equal(result.identificador, "NHSA00087");
    assert.equal(result.produtoId, "produto-a");
    assert.deepEqual(repository.createDerivedIbcFromSource.mock.calls[0].arguments, [
      {
        sourceIbcId: "ibc-source-1",
        prefixo: "NHSA",
        produtoId: "produto-a",
        changeType: "conversion",
        actorId: "user-1",
        observation: "avaria visual",
        placa: {
          identificadorAnterior: "HMSA00015",
          corAnterior: "#AA0000",
          corNova: "#AA0000",
        },
      },
    ]);
  });

  it("converts to universal with the next NH prefix", async () => {
    const repository = buildRepo();

    await buildUseCase(repository, buildProdutos({ universal: UNIVERSAL })).execute({
      sourceIbcId: "ibc-source-1",
      actorId: "user-1",
      destino: "universal",
    });

    const data = repository.createDerivedIbcFromSource.mock.calls[0].arguments[0];
    assert.equal(data.prefixo, "NH");
    assert.equal(data.produtoId, "universal-1");
    assert.deepEqual(data.placa, {
      identificadorAnterior: "HMSA00015",
      corAnterior: "#AA0000",
      corNova: "#00FF00",
    });
  });

  it("converts legacy HM#### to a chosen group", async () => {
    const repository = buildRepo(
      buildIbcRecord({
        identificador: "HM0007",
        prefixo: null,
        sequencial: null,
        produtoId: null,
        corHex: null,
      }),
    );

    await buildUseCase(repository, buildProdutos({ porId: null, porGrupo: GRUPO_S })).execute({
      sourceIbcId: "ibc-source-1",
      actorId: "user-1",
      destino: "manter_grupo",
      grupoCodigo: " 10 ",
    });

    const data = repository.createDerivedIbcFromSource.mock.calls[0].arguments[0];
    assert.equal(data.prefixo, "NHS");
    assert.equal(data.produtoId, "produto-s");
    assert.deepEqual(data.placa, {
      identificadorAnterior: "HM0007",
      corAnterior: null,
      corNova: "#FF0000",
    });
  });

  it("converts legacy HM#### to universal", async () => {
    const repository = buildRepo(
      buildIbcRecord({ identificador: "HM0007", prefixo: "HM", produtoId: null, corHex: null }),
    );

    await buildUseCase(repository, buildProdutos({ universal: UNIVERSAL })).execute({
      sourceIbcId: "ibc-source-1",
      actorId: "user-1",
      destino: "universal",
    });

    const data = repository.createDerivedIbcFromSource.mock.calls[0].arguments[0];
    assert.equal(data.prefixo, "NH");
    assert.equal(data.produtoId, "universal-1");
    assert.equal(data.placa.corAnterior, null);
    assert.equal(data.placa.corNova, "#00FF00");
  });

  it("rejects legacy conversion without a group or universal", async () => {
    const repository = buildRepo(
      buildIbcRecord({ identificador: "HM0007", prefixo: "HM", produtoId: null, corHex: null }),
    );

    await assert.rejects(
      () =>
        buildUseCase(repository).execute({
          sourceIbcId: "ibc-source-1",
          actorId: "user-1",
          destino: "manter_grupo",
        }),
      expectAppError("IBC_PRODUTO_OBRIGATORIO", 422),
    );
    assert.equal(repository.createDerivedIbcFromSource.mock.callCount(), 0);
  });

  it("rejects universal conversion when the plate is not configured", async () => {
    const repository = buildRepo();

    await assert.rejects(
      () =>
        buildUseCase(repository, buildProdutos({ universal: null })).execute({
          sourceIbcId: "ibc-source-1",
          actorId: "user-1",
          destino: "universal",
        }),
      expectAppError("IBC_PRODUTO_NAO_CONFIGURADO", 422),
    );
    assert.equal(repository.createDerivedIbcFromSource.mock.callCount(), 0);
  });

  it("stores a null observation when blank", async () => {
    const repository = buildRepo();

    await buildUseCase(repository).execute({
      sourceIbcId: "ibc-source-1",
      actorId: "user-1",
      observation: "   ",
      destino: "manter_grupo",
    });

    assert.equal(repository.createDerivedIbcFromSource.mock.calls[0].arguments[0].observation, null);
  });

  it("rejects conversion when IBC is already non-homologated", async () => {
    const repository = buildRepo(
      buildIbcRecord({ identificador: "NHSA00015", prefixo: "NHSA" }),
    );

    await assert.rejects(
      () =>
        buildUseCase(repository).execute({
          sourceIbcId: "ibc-source-1",
          actorId: "user-1",
          destino: "universal",
        }),
      expectAppError("IBC_ALREADY_NON_HOMOLOGATED", 409),
    );
    assert.equal(repository.createDerivedIbcFromSource.mock.callCount(), 0);
  });

  it("rejects conversion when the source was already replaced", async () => {
    const repository = buildRepo(
      buildIbcRecord({ convertedToContainerId: "ibc-target-0" }),
    );

    await assert.rejects(
      () =>
        buildUseCase(repository).execute({
          sourceIbcId: "ibc-source-1",
          actorId: "user-1",
          destino: "manter_grupo",
        }),
      expectAppError("IBC_JA_SUBSTITUIDO", 409),
    );
    assert.equal(repository.createDerivedIbcFromSource.mock.callCount(), 0);
  });

  it("rejects unknown source IBC with 404", async () => {
    const repository = buildRepo(null);

    await assert.rejects(
      () =>
        buildUseCase(repository).execute({
          sourceIbcId: "missing",
          actorId: "user-1",
          destino: "manter_grupo",
        }),
      expectAppError("IBC_NOT_FOUND", 404),
    );
    assert.equal(repository.createDerivedIbcFromSource.mock.callCount(), 0);
  });

  it("rejects identifiers outside the HM family", async () => {
    const repository = buildRepo(
      buildIbcRecord({ identificador: "XY00001", prefixo: "XY" }),
    );

    await assert.rejects(
      () =>
        buildUseCase(repository).execute({
          sourceIbcId: "ibc-source-1",
          actorId: "user-1",
          destino: "manter_grupo",
        }),
      expectAppError("IBC_PREFIXO_HOMOLOGADO_INVALIDO", 409),
    );
  });
});
