import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListIbcChecklistVinculosUseCase } from "../../../../../src/features/ibc/useCases/ListIbcChecklistVinculos.use-case";
import { IIbcChecklistVinculoRepository } from "../../../../../src/features/ibc/repositories/IIbcChecklistVinculoRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { IbcChecklistVinculoRecord } from "../../../../../src/features/ibc/types/IbcChecklist.types";
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

function vinculo(checklistModeloId: string): IbcChecklistVinculoRecord {
  return {
    checklistModeloId,
    nome: "Checklist Soda",
    ativo: true,
    totalItens: 2,
    vinculadoPorId: "user-1",
    vinculadoEm: "2026-10-06T00:00:00.000Z",
  };
}

function setup(options: { ibc?: IbcCadastroRecord | null; existentes?: string[] } = {}) {
  const existentes = options.existentes ?? [];
  const ibcs = {
    async findById() {
      return options.ibc === undefined ? ibc : options.ibc;
    },
  };
  const vinculos: IIbcChecklistVinculoRepository = {
    async listByIbc() {
      return existentes.map(vinculo);
    },
  };
  return { listar: new ListIbcChecklistVinculosUseCase(ibcs, vinculos) };
}

function hasCode(code: string, statusCode: number) {
  return (error: unknown) =>
    error instanceof AppError && error.code === code && error.statusCode === statusCode;
}

describe("IBC checklist vínculo use-cases", () => {
  it("lists vínculos even for baixado IBC and 404s for unknown IBC", async () => {
    const baixado = setup({ ibc: { ...ibc, baixadoEm: new Date() }, existentes: ["soda"] });
    const lista = await baixado.listar.execute("ibc-1");
    assert.deepEqual(lista.map((v) => v.checklistModeloId), ["soda"]);

    const missing = setup({ ibc: null });
    await assert.rejects(() => missing.listar.execute("ibc-x"), hasCode("IBC_NOT_FOUND", 404));
  });
});
