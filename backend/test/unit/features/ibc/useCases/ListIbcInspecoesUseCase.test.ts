import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListIbcInspecoesUseCase } from "../../../../../src/features/ibc/useCases/ListIbcInspecoes.use-case";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { IbcInspecaoHistoricoDto } from "../../../../../src/features/ibc/types/IbcInspecao.types";
import { AppError } from "../../../../../src/utils/AppError";

const ibcBase: IbcCadastroRecord = {
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

const inspecao: IbcInspecaoHistoricoDto = {
  id: "insp-1",
  checklistModeloId: "soda",
  checklistNome: "Checklist Soda",
  resultado: "REPROVADA",
  mediaObtida: 5,
  notaMinimaCritico: 7,
  mediaMinima: 6,
  inspetor: { id: "ana", nome: "Ana Almox" },
  inspecionadoEm: "2026-10-09T12:00:00.000Z",
  observacao: null,
  respostas: [{ checklistItemId: "valvula", descricao: "Válvula", critico: true, nota: 4 }],
};

function setup(ibc: IbcCadastroRecord | null, historico: IbcInspecaoHistoricoDto[]) {
  const consultados: string[] = [];
  const useCase = new ListIbcInspecoesUseCase(
    { findById: async () => ibc },
    {
      async listByIbc(ibcId) {
        consultados.push(ibcId);
        return historico;
      },
    },
  );
  return { useCase, consultados };
}

describe("ListIbcInspecoesUseCase", () => {
  it("responde 404 IBC_NOT_FOUND quando o IBC não existe", async () => {
    const { useCase, consultados } = setup(null, [inspecao]);

    await assert.rejects(
      () => useCase.execute("ibc-x"),
      (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.code === "IBC_NOT_FOUND",
    );
    assert.deepEqual(consultados, []);
  });

  it("lista o histórico de um IBC baixado", async () => {
    const { useCase, consultados } = setup({ ...ibcBase, baixadoEm: new Date("2026-10-05T00:00:00.000Z") }, [inspecao]);

    assert.deepEqual(await useCase.execute("ibc-1"), [inspecao]);
    assert.deepEqual(consultados, ["ibc-1"]);
  });

  it("devolve [] quando o IBC nunca foi inspecionado", async () => {
    const { useCase } = setup(ibcBase, []);

    assert.deepEqual(await useCase.execute("ibc-1"), []);
  });
});
