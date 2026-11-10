import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { ListIbcChecklistPadroesUseCase } from "../../../../../src/features/ibc/useCases/ListIbcChecklistPadroes.use-case";
import { VincularIbcChecklistPadraoUseCase } from "../../../../../src/features/ibc/useCases/VincularIbcChecklistPadrao.use-case";
import { DesvincularIbcChecklistPadraoUseCase } from "../../../../../src/features/ibc/useCases/DesvincularIbcChecklistPadrao.use-case";
import {
  CreateIbcChecklistPadraoData,
  IIbcChecklistPadraoRepository,
} from "../../../../../src/features/ibc/repositories/IIbcChecklistPadraoRepository";
import { IbcProdutoRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import {
  IbcChecklistElegibilidade,
  IbcChecklistPadraoDto,
} from "../../../../../src/features/ibc/types/IbcChecklist.types";
import { AppError } from "../../../../../src/utils/AppError";

const PRODUTO_ID = "11111111-1111-4111-8111-111111111111";

const produto: IbcProdutoRecord = {
  id: PRODUTO_ID,
  nome: "Soda",
  abreviacao: "SO",
  sigla: "SO",
  corHex: "#112233",
  universal: false,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
};

function padrao(checklistModeloId: string, vinculadoPorId = "user-1"): IbcChecklistPadraoDto {
  return {
    checklistModeloId,
    nome: `Checklist ${checklistModeloId}`,
    ativo: true,
    vinculadoEm: "2026-11-09T00:00:00.000Z",
    vinculadoPor: { id: vinculadoPorId, nome: "Ana" },
  };
}

type SetupOptions = {
  produto?: IbcProdutoRecord | null;
  existentes?: string[];
  checklist?: IbcChecklistElegibilidade | null;
};

function setup(options: SetupOptions = {}) {
  const existentes = (options.existentes ?? []).map((id) => padrao(id));
  const creates: CreateIbcChecklistPadraoData[] = [];
  const produtos = {
    async findById(id: string) {
      const atual = options.produto === undefined ? produto : options.produto;
      return atual?.id === id ? atual : null;
    },
  };
  const checklists = {
    async findElegibilidade() {
      return options.checklist === undefined ? { tipo: "IBC" as const, ativo: true } : options.checklist;
    },
  };
  const padroes: IIbcChecklistPadraoRepository = {
    async listByProduto() {
      return existentes;
    },
    async create(data) {
      if (existentes.some((item) => item.checklistModeloId === data.checklistModeloId)) return null;
      creates.push(data);
      const criado = padrao(data.checklistModeloId, data.vinculadoPorId);
      existentes.push(criado);
      return criado;
    },
    async delete(_produtoId, checklistModeloId) {
      const index = existentes.findIndex((item) => item.checklistModeloId === checklistModeloId);
      if (index < 0) return false;
      existentes.splice(index, 1);
      return true;
    },
  };
  return {
    listar: new ListIbcChecklistPadroesUseCase(produtos, padroes),
    vincular: new VincularIbcChecklistPadraoUseCase(produtos, checklists, padroes),
    desvincular: new DesvincularIbcChecklistPadraoUseCase(produtos, padroes),
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
  produtoId: PRODUTO_ID,
  checklistModeloId: "22222222-2222-4222-8222-222222222222",
};

describe("ListIbcChecklistPadroesUseCase", () => {
  it("returns the product padrão from the repository", async () => {
    const { listar, existentes } = setup({ existentes: ["soda"] });
    assert.deepEqual(await listar.execute(PRODUTO_ID), existentes);
  });

  it("returns [] when the product has no padrão", async () => {
    const { listar } = setup();
    assert.deepEqual(await listar.execute(PRODUTO_ID), []);
  });

  it("throws 404 IBC_PRODUTO_NOT_FOUND for an unknown or non-uuid product", async () => {
    const { listar } = setup({ produto: null });
    await assert.rejects(() => listar.execute(PRODUTO_ID), hasCode("IBC_PRODUTO_NOT_FOUND", 404));
    await assert.rejects(() => listar.execute("nao-uuid"), hasCode("IBC_PRODUTO_NOT_FOUND", 404));
  });
});

describe("VincularIbcChecklistPadraoUseCase", () => {
  it("creates the padrão for ENTRADA_PATIO with the actor as author", async () => {
    const { vincular, creates } = setup();
    const criado = await vincular.execute(vincularInput);

    assert.deepEqual(creates, [
      {
        produtoId: PRODUTO_ID,
        checklistModeloId: vincularInput.checklistModeloId,
        situacao: "ENTRADA_PATIO",
        vinculadoPorId: "user-9",
      },
    ]);
    assert.equal(criado.vinculadoPor.id, "user-9");
    assert.equal(Object.hasOwn(criado, "situacao"), false);
  });

  it("refuses roles other than ADMIN and ALMOX with 403 before looking up the product", async () => {
    const { vincular, creates } = setup({ produto: null });
    await assert.rejects(
      () => vincular.execute({ ...vincularInput, actorRole: Role.LOGISTICA }),
      hasCode("IBC_CHECKLIST_FORBIDDEN", 403),
    );
    assert.equal(creates.length, 0);
  });

  it("throws 404, 422 and 409 in product, checklist, then duplicate order", async () => {
    const missing = setup({ produto: null });
    await assert.rejects(
      () => missing.vincular.execute(vincularInput),
      hasCode("IBC_PRODUTO_NOT_FOUND", 404),
    );

    const vistoria = setup({ checklist: { tipo: "VISTORIA", ativo: true } });
    await assert.rejects(
      () => vistoria.vincular.execute(vincularInput),
      hasCode("IBC_CHECKLIST_TIPO_INVALIDO", 422),
    );

    const inativo = setup({ checklist: { tipo: "IBC", ativo: false } });
    await assert.rejects(
      () => inativo.vincular.execute(vincularInput),
      hasCode("IBC_CHECKLIST_INATIVO", 422),
    );

    const ausente = setup({ checklist: null });
    await assert.rejects(
      () => ausente.vincular.execute(vincularInput),
      hasCode("IBC_CHECKLIST_NOT_FOUND", 404),
    );

    const duplicado = setup({ existentes: [vincularInput.checklistModeloId] });
    await assert.rejects(
      () => duplicado.vincular.execute(vincularInput),
      hasCode("IBC_CHECKLIST_PADRAO_JA_VINCULADO", 409),
    );
  });
});

describe("DesvincularIbcChecklistPadraoUseCase", () => {
  it("removes the padrão row", async () => {
    const { desvincular, existentes } = setup({ existentes: [vincularInput.checklistModeloId] });
    await desvincular.execute({
      actorRole: Role.ADMIN,
      produtoId: PRODUTO_ID,
      checklistModeloId: vincularInput.checklistModeloId,
    });
    assert.equal(existentes.length, 0);
  });

  it("throws 404 IBC_CHECKLIST_PADRAO_NOT_FOUND when the padrão is missing", async () => {
    const { desvincular } = setup();
    await assert.rejects(
      () =>
        desvincular.execute({
          actorRole: Role.ALMOX,
          produtoId: PRODUTO_ID,
          checklistModeloId: vincularInput.checklistModeloId,
        }),
      hasCode("IBC_CHECKLIST_PADRAO_NOT_FOUND", 404),
    );
  });
});
