import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { CreateNovoIbcUseCase } from "../../../../../src/features/ibc/useCases/CreateNovoIbc.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IIbcProdutoRepository } from "../../../../../src/features/ibc/repositories/IIbcProdutoRepository";
import {
  CreateNovoIbcData,
  IbcCadastroRecord,
  IbcProdutoRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { formatIbcIdentifier } from "../../../../../src/features/ibc/services/formatIbcIdentifier";
import { AppError } from "../../../../../src/utils/AppError";

const FUTURE_DATA_LIMITE = new Date("2099-12-31T00:00:00.000Z");
const PAST_DATA_LIMITE = new Date("2020-01-01T00:00:00.000Z");

type RepoMock = Pick<IIbcCadastroRepository, "createNovoIbcs">;
type ProdutoRepoMock = Pick<IIbcProdutoRepository, "findById">;

const buildCreatedIbc = (
  data: CreateNovoIbcData,
  sequencial: number,
): IbcCadastroRecord => ({
  id: "ibc-new-1",
  identificador: formatIbcIdentifier(data.prefixo, sequencial),
  prefixo: data.prefixo,
  sequencial,
  tipoCadastro: data.tipoCadastro,
  aptidao: data.aptidao,
  motivoInaptidao: data.motivoInaptidao,
  custodia: data.custodia,
  dataLimite: data.dataLimite,
  produtoId: data.produtoId,
  baixadoEm: null,
  createdAt: new Date("2026-09-08T12:00:00.000Z"),
});

const createNovoIbcsFrom = (firstSequencial: number) =>
  mock.fn(async (data: CreateNovoIbcData, quantidade: number) =>
    Array.from({ length: quantidade }, (_, index) =>
      buildCreatedIbc(data, firstSequencial + index),
    ),
  );

const buildProduto = (abreviacao: string): IbcProdutoRecord => ({
  id: `produto-${abreviacao}`,
  nome: `Produto ${abreviacao}`,
  abreviacao,
  createdAt: new Date("2026-09-08T10:00:00.000Z"),
  updatedAt: new Date("2026-09-08T10:00:00.000Z"),
});

const buildProdutoRepo = (
  produto: IbcProdutoRecord | null = buildProduto("S"),
): ProdutoRepoMock => ({
  findById: mock.fn(async () => produto),
});

function buildUseCase(repo: RepoMock, produtoRepo: ProdutoRepoMock) {
  return new CreateNovoIbcUseCase(
    repo as IIbcCadastroRepository,
    produtoRepo as IIbcProdutoRepository,
  );
}

describe("CreateNovoIbcUseCase", () => {
  it("creating a Novo IBC starts awaiting inspection", async () => {
    const repo: RepoMock = { createNovoIbcs: createNovoIbcsFrom(8) };
    const useCase = buildUseCase(repo, buildProdutoRepo());

    const result = await useCase.execute({
      dataLimite: FUTURE_DATA_LIMITE,
      produtoId: "produto-S",
    });

    assert.equal(result.tipoCadastro, "NOVO");
    assert.equal(result.aptidao, "INAPTO");
    assert.equal(result.motivoInaptidao, "AGUARDANDO_INSPECAO");
    assert.equal(result.custodia, "PATIO");
    assert.equal(result.identificador, "HMS00008");
    assert.equal(result.dataLimite?.toISOString(), FUTURE_DATA_LIMITE.toISOString());
    assert.equal(result.produtoId, "produto-S");
  });

  it("allocates exactly one IBC under the HM + product prefix", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const useCase = buildUseCase({ createNovoIbcs }, buildProdutoRepo(buildProduto("SO")));

    await useCase.execute({ dataLimite: FUTURE_DATA_LIMITE, produtoId: "produto-SO" });

    const [data, quantidade] = createNovoIbcs.mock.calls[0].arguments;
    assert.equal(data.prefixo, "HMSO");
    assert.equal(quantidade, 1);
  });

  it("create rejects a past data limite", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const useCase = buildUseCase({ createNovoIbcs }, buildProdutoRepo());

    await assert.rejects(
      () =>
        useCase.execute({
          dataLimite: PAST_DATA_LIMITE,
          produtoId: "produto-S",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "IBC_DATA_LIMITE_INVALIDA");
        return true;
      },
    );
    assert.equal(createNovoIbcs.mock.callCount(), 0);
  });

  it("create rejects unknown produtoId", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const useCase = buildUseCase({ createNovoIbcs }, buildProdutoRepo(null));

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
    assert.equal(createNovoIbcs.mock.callCount(), 0);
  });
});
