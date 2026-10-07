import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ChecklistTipo, Role } from "@prisma/client";
import { VincularIbcChecklistUseCase } from "../../../../../src/features/ibc/useCases/VincularIbcChecklist.use-case";
import { DesvincularIbcChecklistUseCase } from "../../../../../src/features/ibc/useCases/DesvincularIbcChecklist.use-case";
import { ListIbcChecklistVinculosUseCase } from "../../../../../src/features/ibc/useCases/ListIbcChecklistVinculos.use-case";
import {
  CreateIbcChecklistVinculoData,
  IIbcChecklistVinculoRepository,
} from "../../../../../src/features/ibc/repositories/IIbcChecklistVinculoRepository";
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

type ChecklistElegibilidade = { tipo: ChecklistTipo; ativo: boolean };

const checklists: Record<string, ChecklistElegibilidade> = {
  soda: { tipo: ChecklistTipo.IBC, ativo: true },
  inativo: { tipo: ChecklistTipo.IBC, ativo: false },
  vistoria: { tipo: ChecklistTipo.VISTORIA, ativo: true },
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
  const existentes = new Set(options.existentes ?? []);
  const creates: CreateIbcChecklistVinculoData[] = [];
  const deletes: string[] = [];

  const ibcs = {
    async findById() {
      return options.ibc === undefined ? ibc : options.ibc;
    },
  };
  const checklistRepo = {
    async findTipoEAtivo(id: string) {
      return checklists[id] ?? null;
    },
  };
  const vinculos: IIbcChecklistVinculoRepository = {
    async listByIbc() {
      return [...existentes].map(vinculo);
    },
    async create(data) {
      if (existentes.has(data.checklistModeloId)) return null;
      creates.push(data);
      existentes.add(data.checklistModeloId);
      return vinculo(data.checklistModeloId);
    },
    async delete(_ibcId, checklistModeloId) {
      if (!existentes.delete(checklistModeloId)) return false;
      deletes.push(checklistModeloId);
      return true;
    },
  };

  return {
    vincular: new VincularIbcChecklistUseCase(ibcs, checklistRepo, vinculos),
    desvincular: new DesvincularIbcChecklistUseCase(ibcs, vinculos),
    listar: new ListIbcChecklistVinculosUseCase(ibcs, vinculos),
    creates,
    deletes,
  };
}

function hasCode(code: string, statusCode: number) {
  return (error: unknown) =>
    error instanceof AppError && error.code === code && error.statusCode === statusCode;
}

function vincularInput(checklistModeloId: string, actorRole: Role = Role.ALMOX) {
  return { actorRole, actorId: "user-1", ibcId: "ibc-1", checklistModeloId };
}

describe("IBC checklist vínculo use-cases", () => {
  it("links an active IBC checklist recording the author", async () => {
    const { vincular, creates } = setup();
    const result = await vincular.execute(vincularInput("soda"));
    assert.equal(result.checklistModeloId, "soda");
    assert.deepEqual(creates, [{ ibcId: "ibc-1", checklistModeloId: "soda", vinculadoPorId: "user-1" }]);
  });

  it("refuses unknown, VISTORIA, inactive and duplicate checklists", async () => {
    const { vincular, creates } = setup({ existentes: ["soda"] });
    await assert.rejects(() => vincular.execute(vincularInput("missing")), hasCode("IBC_CHECKLIST_NOT_FOUND", 404));
    await assert.rejects(() => vincular.execute(vincularInput("vistoria")), hasCode("IBC_CHECKLIST_TIPO_INVALIDO", 422));
    await assert.rejects(() => vincular.execute(vincularInput("inativo")), hasCode("IBC_CHECKLIST_INATIVO", 422));
    await assert.rejects(() => vincular.execute(vincularInput("soda")), hasCode("IBC_CHECKLIST_JA_VINCULADO", 409));
    assert.equal(creates.length, 0);
  });

  it("returns 404 for missing or baixado IBC on mutations", async () => {
    const missing = setup({ ibc: null });
    await assert.rejects(() => missing.vincular.execute(vincularInput("soda")), hasCode("IBC_NOT_FOUND", 404));

    const baixado = setup({ ibc: { ...ibc, baixadoEm: new Date() }, existentes: ["soda"] });
    await assert.rejects(
      () => baixado.desvincular.execute({ actorRole: Role.ADMIN, ibcId: "ibc-1", checklistModeloId: "soda" }),
      hasCode("IBC_NOT_FOUND", 404),
    );
    assert.equal(baixado.deletes.length, 0);
  });

  it("unlinks an existing vínculo and 404s when absent", async () => {
    const { desvincular, deletes } = setup({ existentes: ["inativo"] });
    await desvincular.execute({ actorRole: Role.ADMIN, ibcId: "ibc-1", checklistModeloId: "inativo" });
    assert.deepEqual(deletes, ["inativo"]);
    await assert.rejects(
      () => desvincular.execute({ actorRole: Role.ADMIN, ibcId: "ibc-1", checklistModeloId: "inativo" }),
      hasCode("IBC_CHECKLIST_VINCULO_NOT_FOUND", 404),
    );
  });

  it("lists vínculos even for baixado IBC and 404s for unknown IBC", async () => {
    const baixado = setup({ ibc: { ...ibc, baixadoEm: new Date() }, existentes: ["soda"] });
    const lista = await baixado.listar.execute("ibc-1");
    assert.deepEqual(lista.map((v) => v.checklistModeloId), ["soda"]);

    const missing = setup({ ibc: null });
    await assert.rejects(() => missing.listar.execute("ibc-x"), hasCode("IBC_NOT_FOUND", 404));
  });

  it("forbids roles other than ADMIN and ALMOX", async () => {
    const { vincular, desvincular, creates, deletes } = setup({ existentes: ["soda"] });
    await assert.rejects(
      () => vincular.execute(vincularInput("soda", Role.LOGISTICA)),
      hasCode("IBC_CHECKLIST_FORBIDDEN", 403),
    );
    await assert.rejects(
      () => desvincular.execute({ actorRole: Role.VENDAS, ibcId: "ibc-1", checklistModeloId: "soda" }),
      hasCode("IBC_CHECKLIST_FORBIDDEN", 403),
    );
    assert.equal(creates.length + deletes.length, 0);
  });
});
