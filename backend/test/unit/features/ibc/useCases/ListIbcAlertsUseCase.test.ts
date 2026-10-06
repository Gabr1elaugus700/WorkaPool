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
  aptidao: "APTO",
  motivoInaptidao: null,
  custodia: "PATIO",
  dataLimite: new Date("2099-12-31T00:00:00.000Z"),
  primeiraInspecaoEm: null,
  baixadoEm: null,
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  ...overrides,
});

type RepoMock = Pick<IIbcCadastroRepository, "listActiveIbcs" | "markDataLimite">;

function buildUseCase(repo: RepoMock) {
  return new ListIbcAlertsUseCase(repo as IIbcCadastroRepository);
}

describe("ListIbcAlertsUseCase", () => {
  it("lists SEM_INSPECAO for an IBC never inspected", async () => {
    const novo = buildIbc({ identificador: "HM0005" });
    const useCase = buildUseCase({
      listActiveIbcs: mock.fn(async () => [novo]),
      markDataLimite: mock.fn(async () => novo),
    });

    const alerts = await useCase.execute();

    assert.deepEqual(alerts, [
      { identificador: "HM0005", motivo: "SEM_INSPECAO" },
    ]);
  });

  it("does not list SEM_INSPECAO once the IBC was inspected", async () => {
    const inspecionado = buildIbc({
      primeiraInspecaoEm: new Date("2026-09-10T00:00:00.000Z"),
    });
    const useCase = buildUseCase({
      listActiveIbcs: mock.fn(async () => [inspecionado]),
      markDataLimite: mock.fn(async () => inspecionado),
    });

    const alerts = await useCase.execute();

    assert.deepEqual(alerts, []);
  });

  it("lazy expiry marks an Apto IBC as DATA_LIMITE on read", async () => {
    const due = buildIbc({
      id: "ibc-due",
      identificador: "HM0009",
      dataLimite: new Date("2020-01-01T00:00:00.000Z"),
      primeiraInspecaoEm: new Date("2019-12-01T00:00:00.000Z"),
    });
    const expired = buildIbc({
      ...due,
      aptidao: "INAPTO",
      motivoInaptidao: "DATA_LIMITE",
    });
    const markDataLimite = mock.fn(async () => expired);
    const useCase = buildUseCase({
      listActiveIbcs: mock.fn(async () => [due]),
      markDataLimite,
    });

    const alerts = await useCase.execute();

    assert.equal(markDataLimite.mock.callCount(), 1);
    assert.deepEqual(markDataLimite.mock.calls[0].arguments, ["ibc-due"]);
    assert.deepEqual(alerts, [
      { identificador: "HM0009", motivo: "DATA_LIMITE" },
    ]);
  });

  it("lists both DATA_LIMITE and SEM_INSPECAO for an expired, never inspected IBC", async () => {
    const expired = buildIbc({
      identificador: "HM0011",
      aptidao: "INAPTO",
      motivoInaptidao: "DATA_LIMITE",
      dataLimite: new Date("2020-01-01T00:00:00.000Z"),
    });
    const markDataLimite = mock.fn(async () => expired);
    const useCase = buildUseCase({
      listActiveIbcs: mock.fn(async () => [expired]),
      markDataLimite,
    });

    const alerts = await useCase.execute();

    assert.equal(markDataLimite.mock.callCount(), 0);
    assert.deepEqual(alerts, [
      { identificador: "HM0011", motivo: "DATA_LIMITE" },
      { identificador: "HM0011", motivo: "SEM_INSPECAO" },
    ]);
  });
});
