import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { PatchIbcDataLimiteUseCase } from "../../../../../src/features/ibc/useCases/PatchIbcDataLimite.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";

const FUTURE_DATA_LIMITE = new Date("2099-06-15T00:00:00.000Z");
const NEW_DATA_LIMITE = new Date("2099-08-01T00:00:00.000Z");

const buildIbc = (
  overrides: Partial<IbcCadastroRecord> = {},
): IbcCadastroRecord => ({
  id: "ibc-1",
  identificador: "HM0001",
  tipoCadastro: "NOVO",
  aptidao: "INAPTO",
  motivoInaptidao: "AGUARDANDO_INSPECAO",
  custodia: "PATIO",
  dataLimite: FUTURE_DATA_LIMITE,
  baixadoEm: null,
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  ...overrides,
});

describe("PatchIbcDataLimiteUseCase", () => {
  it("patch updates only data limite", async () => {
    const existing = buildIbc();
    const updated = buildIbc({ dataLimite: NEW_DATA_LIMITE });
    const updateDataLimite = mock.fn(async () => updated);
    const repo: Pick<
      IIbcCadastroRepository,
      "findById" | "updateDataLimite"
    > = {
      findById: mock.fn(async () => existing),
      updateDataLimite,
    };
    const useCase = new PatchIbcDataLimiteUseCase(
      repo as IIbcCadastroRepository,
    );

    const result = await useCase.execute({
      id: "ibc-1",
      dataLimite: NEW_DATA_LIMITE,
    });

    assert.equal(result.dataLimite.toISOString(), NEW_DATA_LIMITE.toISOString());
    assert.equal(result.identificador, "HM0001");
    assert.equal(result.tipoCadastro, "NOVO");
    assert.equal(result.aptidao, "INAPTO");
    assert.equal(result.custodia, "PATIO");
    assert.deepEqual(updateDataLimite.mock.calls[0].arguments, [
      "ibc-1",
      NEW_DATA_LIMITE,
    ]);
  });

  it("patch rejects changing the identifier", async () => {
    const existing = buildIbc();
    const updateDataLimite = mock.fn(async () => existing);
    const repo: Pick<
      IIbcCadastroRepository,
      "findById" | "updateDataLimite"
    > = {
      findById: mock.fn(async () => existing),
      updateDataLimite,
    };
    const useCase = new PatchIbcDataLimiteUseCase(
      repo as IIbcCadastroRepository,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          id: "ibc-1",
          dataLimite: NEW_DATA_LIMITE,
          identificador: "HM9999",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "IBC_IDENTIFICADOR_IMUTAVEL");
        return true;
      },
    );
    assert.equal(updateDataLimite.mock.callCount(), 0);
    assert.equal(existing.identificador, "HM0001");
  });
});
