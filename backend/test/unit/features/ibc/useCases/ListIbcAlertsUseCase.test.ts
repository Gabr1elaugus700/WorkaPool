import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { ListIbcAlertsUseCase } from "../../../../../src/features/ibc/useCases/ListIbcAlerts.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IIbcInspecaoLeituraRepository } from "../../../../../src/features/ibc/repositories/IIbcInspecaoLeituraRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import {
  IbcAlocacaoAberta,
  IbcInspecaoReprovadaVigente,
} from "../../../../../src/features/ibc/types/IbcInspecao.types";

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

const reprovadaSoda = (ibcId: string): IbcInspecaoReprovadaVigente => ({
  ibcId,
  checklistModeloId: "soda",
  checklistNome: "Checklist Soda",
  mediaObtida: 5,
  notaMinimaCritico: 7,
  mediaMinima: 6,
  respostas: [
    { checklistItemId: "valvula", descricao: "Válvula", critico: true, nota: 4 },
    { checklistItemId: "tampa", descricao: "Tampa", critico: false, nota: 5 },
    { checklistItemId: "grade", descricao: "Grade", critico: false, nota: 9 },
  ],
});

const detalhesSoda = {
  checklistModeloId: "soda",
  nome: "Checklist Soda",
  mediaObtida: 5,
  mediaMinima: 6,
  itensAbaixoDoMinimo: [
    { descricao: "Válvula", nota: 4, notaMinima: 7 },
    { descricao: "Tampa", nota: 5, notaMinima: 6 },
  ],
};

type RepoMock = Pick<IIbcCadastroRepository, "listActiveIbcs" | "markDataLimite">;

type InspecoesMock = {
  reprovadas?: IbcInspecaoReprovadaVigente[];
  alocacoes?: Record<string, IbcAlocacaoAberta>;
};

function buildUseCase(repo: RepoMock, inspecoesMock: InspecoesMock = {}) {
  const listUltimasReprovadas = mock.fn(async (_ibcIds: string[]) => inspecoesMock.reprovadas ?? []);
  const listAlocacoesAbertas = mock.fn(
    async (_ibcIds: string[]) => new Map(Object.entries(inspecoesMock.alocacoes ?? {})),
  );
  const inspecoes: Pick<IIbcInspecaoLeituraRepository, "listUltimasReprovadas" | "listAlocacoesAbertas"> = {
    listUltimasReprovadas,
    listAlocacoesAbertas,
  };
  const useCase = new ListIbcAlertsUseCase(repo as IIbcCadastroRepository, inspecoes);
  return Object.assign(useCase, { listUltimasReprovadas, listAlocacoesAbertas });
}

function repoWith(...ibcs: IbcCadastroRecord[]): RepoMock {
  return {
    listActiveIbcs: mock.fn(async () => ibcs),
    markDataLimite: mock.fn(async () => ibcs[0]),
  };
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

  it("lists INSPECAO_REPROVADA with the checklist and the items below the minimum, in one batch query", async () => {
    const reprovado = buildIbc({
      id: "ibc-r",
      identificador: "HMS00007",
      aptidao: "INAPTO",
      motivoInaptidao: "INSPECAO_REPROVADA",
    });
    const apto = buildIbc({ id: "ibc-a", identificador: "HMS00008", primeiraInspecaoEm: new Date() });
    const useCase = buildUseCase(repoWith(reprovado, apto), { reprovadas: [reprovadaSoda("ibc-r")] });

    const alerts = await useCase.execute();

    assert.deepEqual(alerts, [
      { identificador: "HMS00007", motivo: "INSPECAO_REPROVADA", detalhes: { checklists: [detalhesSoda] } },
      { identificador: "HMS00007", motivo: "SEM_INSPECAO" },
    ]);
    assert.equal(useCase.listUltimasReprovadas.mock.callCount(), 1);
    assert.deepEqual(useCase.listUltimasReprovadas.mock.calls[0].arguments, [["ibc-r", "ibc-a"]]);
    assert.deepEqual(useCase.listAlocacoesAbertas.mock.calls[0].arguments, [["ibc-r"]]);
  });

  it("includes the open alocação of a reprovado IBC", async () => {
    const reprovado = buildIbc({
      id: "ibc-r",
      identificador: "HMS00007",
      aptidao: "INAPTO",
      motivoInaptidao: "INSPECAO_REPROVADA",
      primeiraInspecaoEm: new Date(),
    });
    const useCase = buildUseCase(repoWith(reprovado), {
      reprovadas: [reprovadaSoda("ibc-r")],
      alocacoes: { "ibc-r": { codCar: 304001, numPed: "1120" } },
    });

    const alerts = await useCase.execute();

    assert.deepEqual(alerts, [
      {
        identificador: "HMS00007",
        motivo: "INSPECAO_REPROVADA",
        detalhes: { checklists: [detalhesSoda], alocacao: { codCar: 304001, numPed: "1120" } },
      },
    ]);
  });

  it("lists INSPECAO_REPROVADA alongside DATA_LIMITE", async () => {
    const expirado = buildIbc({
      id: "ibc-r",
      identificador: "HMS00007",
      aptidao: "INAPTO",
      motivoInaptidao: "DATA_LIMITE",
      dataLimite: new Date("2020-01-01T00:00:00.000Z"),
      primeiraInspecaoEm: new Date(),
    });
    const useCase = buildUseCase(repoWith(expirado), { reprovadas: [reprovadaSoda("ibc-r")] });

    const alerts = await useCase.execute();

    assert.deepEqual(alerts, [
      { identificador: "HMS00007", motivo: "DATA_LIMITE" },
      { identificador: "HMS00007", motivo: "INSPECAO_REPROVADA", detalhes: { checklists: [detalhesSoda] } },
    ]);
  });

  it("drops INSPECAO_REPROVADA once no linked checklist has a reprovada latest inspeção", async () => {
    const reinspecionado = buildIbc({ id: "ibc-r", identificador: "HMS00007", primeiraInspecaoEm: new Date() });
    const useCase = buildUseCase(repoWith(reinspecionado), { reprovadas: [] });

    assert.deepEqual(await useCase.execute(), []);
    assert.equal(useCase.listAlocacoesAbertas.mock.callCount(), 0);
  });

  it("still surfaces an Inapto INSPECAO_REPROVADA once, without detalhes, when no reprovada is linked anymore", async () => {
    const desvinculado = buildIbc({
      id: "ibc-r",
      identificador: "HMS00007",
      aptidao: "INAPTO",
      motivoInaptidao: "INSPECAO_REPROVADA",
      primeiraInspecaoEm: new Date(),
    });
    const useCase = buildUseCase(repoWith(desvinculado), { reprovadas: [] });

    assert.deepEqual(await useCase.execute(), [{ identificador: "HMS00007", motivo: "INSPECAO_REPROVADA" }]);
  });
});
