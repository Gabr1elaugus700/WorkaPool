import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { ListIbcHistoricoUseCase } from "../../../../../src/features/ibc/useCases/ListIbcHistorico.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import {
  IbcCadastroRecord,
  IbcConversionHistoryRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";
import { buildIbcRecord } from "./ibcRecordFixtures";

const EVENTO: IbcConversionHistoryRecord = {
  id: "hist-1",
  changeType: "conversion",
  observation: "avaria",
  actorId: "user-1",
  actorName: "Operador",
  createdAt: new Date("2026-10-01T10:00:00.000Z"),
  from: { id: "ibc-source-1", identificador: "HMSA00015" },
  to: { id: "ibc-target-1", identificador: "NHMSA00001" },
};

function buildRepo(ibc: IbcCadastroRecord | null) {
  return {
    findById: mock.fn(async (_id: string) => ibc),
    listConversionHistory: mock.fn(async (_id: string) => [EVENTO]),
  };
}

describe("ListIbcHistoricoUseCase", () => {
  it("returns the lineage events of the IBC", async () => {
    const repo = buildRepo(buildIbcRecord());
    const useCase = new ListIbcHistoricoUseCase(repo as Pick<
      IIbcCadastroRepository,
      "findById" | "listConversionHistory"
    > as IIbcCadastroRepository);

    const result = await useCase.execute("ibc-source-1");

    assert.deepEqual(result, [EVENTO]);
    assert.deepEqual(repo.listConversionHistory.mock.calls[0].arguments, ["ibc-source-1"]);
  });

  it("rejects unknown IBC with 404 without querying history", async () => {
    const repo = buildRepo(null);
    const useCase = new ListIbcHistoricoUseCase(repo as Pick<
      IIbcCadastroRepository,
      "findById" | "listConversionHistory"
    > as IIbcCadastroRepository);

    await assert.rejects(
      () => useCase.execute("missing"),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_NOT_FOUND" && error.statusCode === 404,
    );
    assert.equal(repo.listConversionHistory.mock.callCount(), 0);
  });
});
