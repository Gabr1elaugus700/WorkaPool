import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { SoftDeleteIbcUseCase } from "../../../../../src/features/ibc/useCases/SoftDeleteIbc.use-case";
import { ListIbcPoolUseCase } from "../../../../../src/features/ibc/useCases/ListIbcPool.use-case";
import { ListIbcAlertsUseCase } from "../../../../../src/features/ibc/useCases/ListIbcAlerts.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";

const buildIbc = (
  overrides: Partial<IbcCadastroRecord> = {},
): IbcCadastroRecord => ({
  id: "ibc-1",
  identificador: "HM0002",
  tipoCadastro: "NOVO",
  aptidao: "INAPTO",
  motivoInaptidao: "AGUARDANDO_INSPECAO",
  custodia: "PATIO",
  dataLimite: new Date("2099-12-31T00:00:00.000Z"),
  baixadoEm: null,
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  ...overrides,
});

describe("SoftDeleteIbcUseCase", () => {
  it("soft delete hides IBC from default pool and alerts", async () => {
    let ibc = buildIbc();
    const softDelete = mock.fn(async () => {
      ibc = { ...ibc, baixadoEm: new Date("2026-09-08T15:00:00.000Z") };
      return ibc;
    });
    const repo = {
      findById: mock.fn(async () => ibc),
      hasOpenAlocacao: mock.fn(async () => false),
      softDelete,
      listActiveIbcs: mock.fn(async () => (ibc.baixadoEm ? [] : [ibc])),
      listIbcs: mock.fn(async (opts: { incluirBaixados?: boolean }) =>
        opts.incluirBaixados || !ibc.baixadoEm ? [ibc] : [],
      ),
      markDataLimite: mock.fn(async () => ibc),
    } as unknown as IIbcCadastroRepository;

    const softDeleteUseCase = new SoftDeleteIbcUseCase(repo);
    const deleted = await softDeleteUseCase.execute({ id: "ibc-1" });

    assert.ok(deleted.baixadoEm != null);

    const poolDefault = await new ListIbcPoolUseCase(repo).execute({});
    const poolAudit = await new ListIbcPoolUseCase(repo).execute({
      incluirBaixados: true,
    });
    const alerts = await new ListIbcAlertsUseCase(repo).execute();

    assert.deepEqual(poolDefault, []);
    assert.equal(poolAudit.length, 1);
    assert.ok(poolAudit[0].baixadoEm != null);
    assert.deepEqual(alerts, []);
  });

  it("soft delete is blocked when IBC is in transit", async () => {
    const ibc = buildIbc({ custodia: "EM_VIAGEM" });
    const softDelete = mock.fn(async () => ibc);
    const repo = {
      findById: mock.fn(async () => ibc),
      hasOpenAlocacao: mock.fn(async () => false),
      softDelete,
    } as unknown as IIbcCadastroRepository;
    const useCase = new SoftDeleteIbcUseCase(repo);

    await assert.rejects(
      () => useCase.execute({ id: "ibc-1" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "IBC_BAIXA_BLOQUEADA");
        return true;
      },
    );
    assert.equal(softDelete.mock.callCount(), 0);
    assert.equal(ibc.baixadoEm, null);
  });

  it("soft delete is blocked when IBC is allocated", async () => {
    const ibc = buildIbc();
    const softDelete = mock.fn(async () => ibc);
    const repo = {
      findById: mock.fn(async () => ibc),
      hasOpenAlocacao: mock.fn(async () => true),
      softDelete,
    } as unknown as IIbcCadastroRepository;
    const useCase = new SoftDeleteIbcUseCase(repo);

    await assert.rejects(
      () => useCase.execute({ id: "ibc-1" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "IBC_BAIXA_BLOQUEADA");
        return true;
      },
    );
    assert.equal(softDelete.mock.callCount(), 0);
    assert.equal(ibc.baixadoEm, null);
  });
});
