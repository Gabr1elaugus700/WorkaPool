import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { CreateNovoIbcUseCase } from "../../../../../src/features/ibc/useCases/CreateNovoIbc.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import {
  CreateNovoIbcData,
  IbcCadastroRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";

const FUTURE_DATA_LIMITE = new Date("2099-12-31T00:00:00.000Z");
const PAST_DATA_LIMITE = new Date("2020-01-01T00:00:00.000Z");

type RepoMock = Pick<
  IIbcCadastroRepository,
  "findHighestIdentificador" | "createNovoIbc"
>;

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
  baixadoEm: null,
  createdAt: new Date("2026-09-08T12:00:00.000Z"),
  ...overrides,
});

const buildRepo = (overrides: Partial<RepoMock> = {}): RepoMock => ({
  findHighestIdentificador: mock.fn(async () => "HM00007"),
  createNovoIbc: mock.fn(async (data: CreateNovoIbcData) => buildCreatedIbc(data)),
  ...overrides,
});

describe("CreateNovoIbcUseCase", () => {
  it("creating a Novo IBC starts awaiting inspection", async () => {
    const repo = buildRepo();
    const useCase = new CreateNovoIbcUseCase(repo as IIbcCadastroRepository);

    const result = await useCase.execute({ dataLimite: FUTURE_DATA_LIMITE });

    assert.equal(result.tipoCadastro, "NOVO");
    assert.equal(result.aptidao, "INAPTO");
    assert.equal(result.motivoInaptidao, "AGUARDANDO_INSPECAO");
    assert.equal(result.custodia, "PATIO");
    assert.equal(result.identificador, "HM00008");
    assert.equal(result.dataLimite.toISOString(), FUTURE_DATA_LIMITE.toISOString());
  });

  it("create rejects a past data limite", async () => {
    const createNovoIbc = mock.fn(async (data: CreateNovoIbcData) =>
      buildCreatedIbc(data),
    );
    const repo = buildRepo({ createNovoIbc });
    const useCase = new CreateNovoIbcUseCase(repo as IIbcCadastroRepository);

    await assert.rejects(
      () => useCase.execute({ dataLimite: PAST_DATA_LIMITE }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "IBC_DATA_LIMITE_INVALIDA");
        return true;
      },
    );
    assert.equal(createNovoIbc.mock.callCount(), 0);
  });
});
