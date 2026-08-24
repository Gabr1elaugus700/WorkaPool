import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { RemoveAlocacaoIbcUseCase } from "../../../../../src/features/ibc/useCases/RemoveAlocacaoIbc.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import { AlocacaoIbcRecord } from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const buildAlocacao = (
  overrides: Partial<AlocacaoIbcRecord> = {},
): AlocacaoIbcRecord => ({
  id: "aloc-1",
  ibcId: "ibc-1",
  cargaId: "carga-1",
  numPed: "1120",
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-08-24T12:00:00.000Z"),
  expedicaoIbcId: null,
  identificador: "H0045",
  ...overrides,
});

describe("RemoveAlocacaoIbcUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("remove alocação quando não há ExpedicaoIbc (expedicaoIbcId null)", async () => {
    const deleteAlocacao = mock.fn(async () => undefined);
    const repo: Pick<
      IIbcExpedicaoRepository,
      "findAlocacaoById" | "findExpedicaoByCargaId" | "deleteAlocacao"
    > = {
      findAlocacaoById: mock.fn(async () => buildAlocacao()),
      findExpedicaoByCargaId: mock.fn(async () => null),
      deleteAlocacao,
    };

    const useCase = new RemoveAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );
    const result = await useCase.execute({ alocacaoId: "aloc-1" });

    assert.strictEqual(result.removed, true);
    assert.strictEqual(result.identificador, "H0045");
    assert.strictEqual(result.numPed, "1120");
    assert.strictEqual(deleteAlocacao.mock.calls.length, 1);
  });

  it("rejeita remoção quando alocação já está vinculada a ExpedicaoIbc", async () => {
    const deleteAlocacao = mock.fn(async () => undefined);
    const repo: Pick<
      IIbcExpedicaoRepository,
      "findAlocacaoById" | "findExpedicaoByCargaId" | "deleteAlocacao"
    > = {
      findAlocacaoById: mock.fn(async () =>
        buildAlocacao({ expedicaoIbcId: "exp-1" }),
      ),
      findExpedicaoByCargaId: mock.fn(async () => null),
      deleteAlocacao,
    };

    const useCase = new RemoveAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () => useCase.execute({ alocacaoId: "aloc-1" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_ALOCACAO_IMUTAVEL");
        assert.strictEqual(error.statusCode, 409);
        return true;
      },
    );
    assert.strictEqual(deleteAlocacao.mock.calls.length, 0);
  });
});
