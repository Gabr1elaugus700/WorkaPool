import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { ListIbcAlertsUseCase } from "../../../../../src/features/ibc/useCases/ListIbcAlerts.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";

const buildIbc = (
  overrides: Partial<IbcCadastroRecord> = {},
): IbcCadastroRecord => ({
  id: "ibc-1",
  identificador: "HM0001",
  tipoCadastro: "NOVO",
  aptidao: "INAPTO",
  motivoInaptidao: "AGUARDANDO_INSPECAO",
  custodia: "PATIO",
  dataLimite: new Date("2099-12-31T00:00:00.000Z"),
  baixadoEm: null,
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  ...overrides,
});

describe("ListIbcAlertsUseCase", () => {
  it("list alerts include awaiting inspection", async () => {
    const awaiting = buildIbc({ identificador: "HM0005" });
    const repo: Pick<IIbcCadastroRepository, "listActiveIbcs" | "markDataLimite"> = {
      listActiveIbcs: mock.fn(async () => [awaiting]),
      markDataLimite: mock.fn(async () => awaiting),
    };
    const useCase = new ListIbcAlertsUseCase(repo as IIbcCadastroRepository);

    const alerts = await useCase.execute();

    assert.deepEqual(alerts, [
      {
        identificador: "HM0005",
        motivo: "AGUARDANDO_INSPECAO",
      },
    ]);
  });

  it("lazy expiry marks DATA_LIMITE on read", async () => {
    const due = buildIbc({
      id: "ibc-due",
      identificador: "HM0009",
      dataLimite: new Date("2020-01-01T00:00:00.000Z"),
      motivoInaptidao: "AGUARDANDO_INSPECAO",
    });
    const expired = buildIbc({
      ...due,
      motivoInaptidao: "DATA_LIMITE",
    });
    const markDataLimite = mock.fn(async () => expired);
    const repo: Pick<IIbcCadastroRepository, "listActiveIbcs" | "markDataLimite"> = {
      listActiveIbcs: mock.fn(async () => [due]),
      markDataLimite,
    };
    const useCase = new ListIbcAlertsUseCase(repo as IIbcCadastroRepository);

    const alerts = await useCase.execute();

    assert.equal(markDataLimite.mock.callCount(), 1);
    assert.deepEqual(markDataLimite.mock.calls[0].arguments, ["ibc-due"]);
    assert.deepEqual(alerts, [
      {
        identificador: "HM0009",
        motivo: "DATA_LIMITE",
      },
    ]);
  });
});
