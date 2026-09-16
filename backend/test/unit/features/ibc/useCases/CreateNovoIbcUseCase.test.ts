import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { CreateNovoIbcUseCase } from "../../../../../src/features/ibc/useCases/CreateNovoIbc.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../../../../../src/features/ibc/repositories/IIbcProdutoRepository";
import {
  CreateNovoIbcData,
  IbcCadastroRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";

const FUTURE_DATA_LIMITE = new Date("2099-12-31T00:00:00.000Z");
const PAST_DATA_LIMITE = new Date("2020-01-01T00:00:00.000Z");

type RepoMock = Pick<
  IIbcCadastroRepository,
  "findHighestIdentificadorByPrefix" | "createNovoIbc"
>;
type ProdutoRepoMock = Pick<IIbcProdutoRepository, "findById">;

const buildCreatedIbc = (
  data: CreateNovoIbcData,
  overrides: Partial<IbcCadastroRecord> = {},
): IbcCadastroRecord => ({
  id: "ibc-new-1",
  identificador: data.identificador,
  tipoCadastro: data.tipoCadastro,
  aptidao: data.aptidao,
  motivoInaptidao: data.motivoInaptidao,
  custodia: data.custodia,
  dataLimite: data.dataLimite,
  produtoId: data.produtoId,
  baixadoEm: null,
  createdAt: new Date("2026-09-08T12:00:00.000Z"),
  ...overrides,
});

const buildRepo = (overrides: Partial<RepoMock> = {}): RepoMock => ({
  findHighestIdentificadorByPrefix: mock.fn(async () => "HMS00007"),
  createNovoIbc: mock.fn(async (data: CreateNovoIbcData) => buildCreatedIbc(data)),
  ...overrides,
});
const buildProdutoRepo = (
  overrides: Partial<ProdutoRepoMock> = {},
): ProdutoRepoMock => ({
  findById: mock.fn(async () => ({
    id: "produto-1",
    nome: "Soda",
    abreviacao: "S",
    createdAt: new Date("2026-09-08T10:00:00.000Z"),
    updatedAt: new Date("2026-09-08T10:00:00.000Z"),
  })),
  ...overrides,
});

describe("CreateNovoIbcUseCase", () => {
  it("creating a Novo IBC starts awaiting inspection", async () => {
    const repo = buildRepo();
    const produtoRepo = buildProdutoRepo();
    const useCase = new CreateNovoIbcUseCase(
      repo as IIbcCadastroRepository,
      produtoRepo as IIbcProdutoRepository,
    );

    const result = await useCase.execute({
      dataLimite: FUTURE_DATA_LIMITE,
      produtoId: "produto-1",
    });

    assert.equal(result.tipoCadastro, "NOVO");
    assert.equal(result.aptidao, "INAPTO");
    assert.equal(result.motivoInaptidao, "AGUARDANDO_INSPECAO");
    assert.equal(result.custodia, "PATIO");
    assert.equal(result.identificador, "HMS00008");
    assert.equal(result.dataLimite.toISOString(), FUTURE_DATA_LIMITE.toISOString());
    assert.equal(result.produtoId, "produto-1");
  });

  it("create rejects a past data limite", async () => {
    const createNovoIbc = mock.fn(async (data: CreateNovoIbcData) =>
      buildCreatedIbc(data),
    );
    const repo = buildRepo({ createNovoIbc });
    const produtoRepo = buildProdutoRepo();
    const useCase = new CreateNovoIbcUseCase(
      repo as IIbcCadastroRepository,
      produtoRepo as IIbcProdutoRepository,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          dataLimite: PAST_DATA_LIMITE,
          produtoId: "produto-1",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "IBC_DATA_LIMITE_INVALIDA");
        return true;
      },
    );
    assert.equal(createNovoIbc.mock.callCount(), 0);
  });

  it("create rejects unknown produtoId", async () => {
    const repo = buildRepo();
    const produtoRepo = buildProdutoRepo({
      findById: mock.fn(async () => null),
    });
    const useCase = new CreateNovoIbcUseCase(
      repo as IIbcCadastroRepository,
      produtoRepo as IIbcProdutoRepository,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          dataLimite: FUTURE_DATA_LIMITE,
          produtoId: "produto-missing",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.code, "IBC_PRODUTO_NOT_FOUND");
        return true;
      },
    );
  });
});
