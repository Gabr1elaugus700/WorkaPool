import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { ListIbcChecklistVinculosUseCase } from "../../../../../src/features/ibc/useCases/ListIbcChecklistVinculos.use-case";
import { VincularIbcChecklistUseCase } from "../../../../../src/features/ibc/useCases/VincularIbcChecklist.use-case";
import {
  CreateIbcChecklistVinculoData,
  IIbcChecklistVinculoRepository,
} from "../../../../../src/features/ibc/repositories/IIbcChecklistVinculoRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import {
  IbcChecklistElegibilidade,
  IbcChecklistVinculoDto,
} from "../../../../../src/features/ibc/types/IbcChecklist.types";
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

function vinculo(checklistModeloId: string, vinculadoPorId = "user-1"): IbcChecklistVinculoDto {
  return {
    checklistModeloId,
    nome: `Checklist ${checklistModeloId}`,
    ativo: true,
    vinculadoEm: "2026-10-06T00:00:00.000Z",
    vinculadoPor: { id: vinculadoPorId, nome: "Ana" },
  };
}

type SetupOptions = {
  ibc?: IbcCadastroRecord | null;
  existentes?: string[];
  checklist?: IbcChecklistElegibilidade | null;
};

function setup(options: SetupOptions = {}) {
  const existentes = (options.existentes ?? []).map((id) => vinculo(id));
  const creates: CreateIbcChecklistVinculoData[] = [];
  const ibcs = {
    async findById() {
      return options.ibc === undefined ? ibc : options.ibc;
    },
  };
  const checklists = {
    async findElegibilidade() {
      return options.checklist === undefined ? { tipo: "IBC" as const, ativo: true } : options.checklist;
    },
  };
  const vinculos: IIbcChecklistVinculoRepository = {
    async listByIbc() {
      return existentes;
    },
    async create(data) {
      if (existentes.some((v) => v.checklistModeloId === data.checklistModeloId)) return null;
      creates.push(data);
      const criado = vinculo(data.checklistModeloId, data.vinculadoPorId);
      existentes.push(criado);
      return criado;
    },
    async delete() {
      throw new Error("not used");
    },
  };
  return {
    listar: new ListIbcChecklistVinculosUseCase(ibcs, vinculos),
    vincular: new VincularIbcChecklistUseCase(ibcs, checklists, vinculos),
    existentes,
    creates,
  };
}

function hasCode(code: string, statusCode: number) {
  return (error: unknown) =>
    error instanceof AppError && error.code === code && error.statusCode === statusCode;
}

const vincularInput = {
  actorRole: Role.ALMOX,
  actorId: "user-9",
  ibcId: "ibc-1",
  checklistModeloId: "soda",
};

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

describe("VincularIbcChecklistUseCase", () => {
  it("creates the vínculo with the actor as author and returns it", async () => {
    const { vincular, creates } = setup();
    const criado = await vincular.execute(vincularInput);

    assert.deepEqual(creates, [{ ibcId: "ibc-1", checklistModeloId: "soda", vinculadoPorId: "user-9" }]);
    assert.equal(criado.checklistModeloId, "soda");
    assert.equal(criado.vinculadoPor.id, "user-9");
  });

  it("allows ADMIN and refuses other roles with 403", async () => {
    await setup().vincular.execute({ ...vincularInput, actorRole: Role.ADMIN });
    for (const actorRole of [Role.LOGISTICA, Role.GERENTE_DPTO, Role.VENDAS]) {
      const { vincular, creates } = setup();
      await assert.rejects(
        () => vincular.execute({ ...vincularInput, actorRole }),
        hasCode("IBC_CHECKLIST_FORBIDDEN", 403),
      );
      assert.equal(creates.length, 0);
    }
  });

  it("throws 404 IBC_CHECKLIST_NOT_FOUND for unknown checklist", async () => {
    const { vincular } = setup({ checklist: null });
    await assert.rejects(() => vincular.execute(vincularInput), hasCode("IBC_CHECKLIST_NOT_FOUND", 404));
  });

  it("throws 422 IBC_CHECKLIST_TIPO_INVALIDO for VISTORIA checklist", async () => {
    const { vincular, creates } = setup({ checklist: { tipo: "VISTORIA", ativo: true } });
    await assert.rejects(() => vincular.execute(vincularInput), hasCode("IBC_CHECKLIST_TIPO_INVALIDO", 422));
    assert.equal(creates.length, 0);
  });

  it("throws 422 IBC_CHECKLIST_INATIVO for inactive checklist", async () => {
    const { vincular, creates } = setup({ checklist: { tipo: "IBC", ativo: false } });
    await assert.rejects(() => vincular.execute(vincularInput), hasCode("IBC_CHECKLIST_INATIVO", 422));
    assert.equal(creates.length, 0);
  });

  it("throws 409 IBC_CHECKLIST_JA_VINCULADO when already linked", async () => {
    const { vincular } = setup({ existentes: ["soda"] });
    await assert.rejects(() => vincular.execute(vincularInput), hasCode("IBC_CHECKLIST_JA_VINCULADO", 409));
  });

  it("creates one vínculo and answers 409 to the concurrent duplicate", async () => {
    const { vincular, creates } = setup();
    const results = await Promise.allSettled([vincular.execute(vincularInput), vincular.execute(vincularInput)]);

    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const rejected = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    assert.ok(rejected && hasCode("IBC_CHECKLIST_JA_VINCULADO", 409)(rejected.reason));
    assert.equal(creates.length, 1);
  });

  it("throws 404 IBC_NOT_FOUND for unknown or baixado IBC", async () => {
    for (const alvo of [null, { ...ibc, baixadoEm: new Date() }]) {
      const { vincular, creates } = setup({ ibc: alvo });
      await assert.rejects(() => vincular.execute(vincularInput), hasCode("IBC_NOT_FOUND", 404));
      assert.equal(creates.length, 0);
    }
  });
});
