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

type CadastroRepoMock = Pick<IIbcCadastroRepository, "findById" | "createDerivedIbcFromSource">;
type ProdutoRepoMock = Pick<IIbcProdutoRepository, "findById">;

const nhDoGrupo = (overrides: Partial<IbcCadastroRecord> = {}) =>
  buildIbcRecord({
    identificador: "NHSA00004",
    prefixo: "NHSA",
    produtoId: "produto-a",
    corHex: "#AA0000",
    homologado: false,
    ...overrides,
  });

const buildCadastroRepo = (source: IbcCadastroRecord | null = nhDoGrupo()) => ({
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

function placa(anterior: string, corAnterior: string | null, corNova: string) {
  return { identificadorAnterior: anterior, corAnterior, corNova };
}

describe("ChangeIbcProdutoUseCase", () => {
  it("refuses product change on an homologated container", async () => {
    const cadastroRepo = buildCadastroRepo(buildIbcRecord({ corHex: "#AA0000" }));
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
        error.code === "IBC_HOMOLOGADO_PRODUTO_FIXO" &&
        error.statusCode === 409,
    );
    assert.equal(cadastroRepo.createDerivedIbcFromSource.mock.callCount(), 0);
    assert.equal(findProduto.mock.callCount(), 0);
  });

  it("changes an NH from one group to another and snapshots the plate", async () => {
    const cadastroRepo = buildCadastroRepo();

    const result = await buildUseCase(cadastroRepo, buildProdutoRepo()).execute({
      sourceIbcId: "ibc-source-1",
      targetProdutoId: "produto-b",
      actorId: "user-1",
      observation: "troca de produto",
    });

    assert.equal(result.identificador, "NHSO00023");
    assert.equal(result.produtoId, "produto-b");
    assert.equal(result.identificador.startsWith("HM"), false);
    assert.deepEqual(cadastroRepo.createDerivedIbcFromSource.mock.calls[0].arguments, [
      {
        sourceIbcId: "ibc-source-1",
        prefixo: "NHSO",
        produtoId: "produto-b",
        changeType: "product_change",
        actorId: "user-1",
        observation: "troca de produto",
        placa: placa("NHSA00004", "#AA0000", "#00AA00"),
      },
    ]);
  });

  it("changes an NH group into universal", async () => {
    const cadastroRepo = buildCadastroRepo();
    const universal = buildProdutoRecord({
      id: "universal-1",
      nome: "Universal",
      abreviacao: "",
      sigla: null,
      corHex: "#0000FF",
      universal: true,
    });

    await buildUseCase(cadastroRepo, buildProdutoRepo(universal)).execute({
      sourceIbcId: "ibc-source-1",
      targetProdutoId: "universal-1",
      actorId: "user-1",
    });

    const data = cadastroRepo.createDerivedIbcFromSource.mock.calls[0].arguments[0];
    assert.equal(data.prefixo, "NH");
    assert.equal(data.produtoId, "universal-1");
    assert.equal(data.prefixo.startsWith("HM"), false);
    assert.deepEqual(data.placa, placa("NHSA00004", "#AA0000", "#0000FF"));
  });

  it("changes a universal NH into a group", async () => {
    const cadastroRepo = buildCadastroRepo(
      nhDoGrupo({
        identificador: "NH00003",
        prefixo: "NH",
        produtoId: "universal-1",
        corHex: "#0000FF",
        universal: true,
      }),
    );

    await buildUseCase(cadastroRepo, buildProdutoRepo()).execute({
      sourceIbcId: "ibc-source-1",
      targetProdutoId: "produto-b",
      actorId: "user-1",
    });

    const data = cadastroRepo.createDerivedIbcFromSource.mock.calls[0].arguments[0];
    assert.equal(data.prefixo, "NHSO");
    assert.equal(data.produtoId, "produto-b");
    assert.deepEqual(data.placa, placa("NH00003", "#0000FF", "#00AA00"));
  });

  it("keeps NH + sigla when the source is legacy NHM", async () => {
    const cadastroRepo = buildCadastroRepo(
      nhDoGrupo({ identificador: "NHMSA00004", prefixo: "NHMSA" }),
    );

    await buildUseCase(cadastroRepo, buildProdutoRepo()).execute({
      sourceIbcId: "ibc-source-1",
      targetProdutoId: "produto-b",
      actorId: "user-1",
    });

    const data = cadastroRepo.createDerivedIbcFromSource.mock.calls[0].arguments[0];
    assert.equal(data.prefixo, "NHSO");
    assert.equal(data.prefixo.startsWith("HM"), false);
  });

  it("rejects a destination without plate configuration", async () => {
    const cadastroRepo = buildCadastroRepo();

    await assert.rejects(
      () =>
        buildUseCase(
          cadastroRepo,
          buildProdutoRepo(buildProdutoRecord({ sigla: null, abreviacao: "", corHex: "" })),
        ).execute({
          sourceIbcId: "ibc-source-1",
          targetProdutoId: "produto-b",
          actorId: "user-1",
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_PRODUTO_NAO_CONFIGURADO",
    );
    assert.equal(cadastroRepo.createDerivedIbcFromSource.mock.callCount(), 0);
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
      nhDoGrupo({ convertedToContainerId: "ibc-target-0" }),
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
