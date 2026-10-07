import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListIbcChecklistVinculosUseCase } from "../../../../../src/features/ibc/useCases/ListIbcChecklistVinculos.use-case";
import { IIbcChecklistVinculoRepository } from "../../../../../src/features/ibc/repositories/IIbcChecklistVinculoRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { IbcChecklistVinculoDto } from "../../../../../src/features/ibc/types/IbcChecklist.types";
import { AppError } from "../../../../../src/utils/AppError";

const ibc: IbcCadastroRecord = {
  id: "ibc-1",
  identificador: "HMS00001",
  tipoCadastro: "NOVO",
  aptidao: "APTO",
  motivoInaptidao: null,
  custodia: "PATIO",
  dataLimite: null,
  primeiraInspecaoEm: null,
  baixadoEm: null,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
};

function vinculo(checklistModeloId: string): IbcChecklistVinculoDto {
  return {
    checklistModeloId,
    nome: `Checklist ${checklistModeloId}`,
    ativo: true,
    vinculadoEm: "2026-10-06T00:00:00.000Z",
    vinculadoPor: { id: "user-1", nome: "Ana" },
  };
}

type SetupOptions = { ibc?: IbcCadastroRecord | null; existentes?: string[] };

function setup(options: SetupOptions = {}) {
  const existentes = (options.existentes ?? []).map(vinculo);
  const ibcs = {
    async findById() {
      return options.ibc === undefined ? ibc : options.ibc;
    },
  };
  const vinculos: IIbcChecklistVinculoRepository = {
    async listByIbc() {
      return existentes;
    },
  };
  return { listar: new ListIbcChecklistVinculosUseCase(ibcs, vinculos), existentes };
}

function hasCode(code: string, statusCode: number) {
  return (error: unknown) =>
    error instanceof AppError && error.code === code && error.statusCode === statusCode;
}

describe("ListIbcChecklistVinculosUseCase", () => {
  it("returns the IBC vínculos from the repository", async () => {
    const { listar, existentes } = setup({ existentes: ["soda", "estrutural"] });
    assert.deepEqual(await listar.execute("ibc-1"), existentes);
  });

  it("returns [] when the IBC has no vínculos", async () => {
    const { listar } = setup();
    assert.deepEqual(await listar.execute("ibc-1"), []);
  });

  it("lists vínculos of a baixado IBC", async () => {
    const { listar } = setup({ ibc: { ...ibc, baixadoEm: new Date() }, existentes: ["soda"] });
    const lista = await listar.execute("ibc-1");
    assert.deepEqual(lista.map((v) => v.checklistModeloId), ["soda"]);
  });

  it("throws 404 IBC_NOT_FOUND for unknown IBC", async () => {
    const { listar } = setup({ ibc: null });
    await assert.rejects(() => listar.execute("ibc-x"), hasCode("IBC_NOT_FOUND", 404));
  });
});
