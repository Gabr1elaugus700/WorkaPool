import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { CreateIbcChecklistUseCase } from "../../../../../src/features/ibc/useCases/CreateIbcChecklist.use-case";
import { UpdateIbcChecklistUseCase } from "../../../../../src/features/ibc/useCases/UpdateIbcChecklist.use-case";
import { GetIbcChecklistUseCase } from "../../../../../src/features/ibc/useCases/GetIbcChecklist.use-case";
import {
  CreateIbcChecklistData,
  IIbcChecklistRepository,
  UpdateIbcChecklistData,
} from "../../../../../src/features/ibc/repositories/IIbcChecklistRepository";
import { IIbcChecklistItemRepository } from "../../../../../src/features/ibc/repositories/IIbcChecklistItemRepository";
import {
  IbcChecklistItemRecord,
  IbcChecklistRecord,
} from "../../../../../src/features/ibc/types/IbcChecklist.types";
import { AppError } from "../../../../../src/utils/AppError";

const tampa: IbcChecklistItemRecord = { id: "item-1", descricao: "Tampa", critico: true, ativo: true };
const base: IbcChecklistItemRecord = { id: "item-2", descricao: "Base", critico: false, ativo: true };
const valvulaInativa: IbcChecklistItemRecord = {
  id: "item-3",
  descricao: "Válvula",
  critico: false,
  ativo: false,
};

const checklistSoda: IbcChecklistRecord = {
  id: "checklist-1",
  nome: "Checklist Soda",
  notaMinimaCritico: 7,
  mediaMinima: 6,
  ativo: true,
  createdAt: "2026-10-06T00:00:00.000Z",
  itens: [{ itemId: "item-3", descricao: "Válvula", critico: false, ativo: false, ordem: 0 }],
};

function createRepositories(options: {
  checklist?: IbcChecklistRecord | null;
  catalog?: IbcChecklistItemRecord[];
}) {
  const creates: CreateIbcChecklistData[] = [];
  const updates: UpdateIbcChecklistData[] = [];
  const catalog = options.catalog ?? [tampa, base, valvulaInativa];

  const checklists: IIbcChecklistRepository = {
    async list() {
      return [];
    },
    async findById() {
      return options.checklist ?? null;
    },
    async findElegibilidade() {
      throw new Error("not used");
    },
    async create(data) {
      creates.push(data);
      return { ...checklistSoda, ...data, itens: [] };
    },
    async updateById(id, data) {
      updates.push(data);
      return { ...checklistSoda, id };
    },
  };

  const itens: IIbcChecklistItemRepository = {
    async list() {
      return catalog;
    },
    async findById(id) {
      return catalog.find((item) => item.id === id) ?? null;
    },
    async findManyByIds(ids) {
      return catalog.filter((item) => ids.includes(item.id));
    },
    async create() {
      throw new Error("not used");
    },
    async updateById() {
      throw new Error("not used");
    },
  };

  return { checklists, itens, creates, updates };
}

function hasCode(code: string, statusCode: number) {
  return (error: unknown) =>
    error instanceof AppError && error.code === code && error.statusCode === statusCode;
}

describe("IBC checklist use-cases", () => {
  it("creates checklist with trimmed nome and ordered itens", async () => {
    const { checklists, itens, creates } = createRepositories({});
    await new CreateIbcChecklistUseCase(checklists, itens).execute({
      actorRole: Role.ALMOX,
      nome: "  Checklist Soda  ",
      notaMinimaCritico: 7,
      mediaMinima: 6.5,
      itensIds: ["item-2", "item-1"],
    });
    assert.deepEqual(creates, [
      { nome: "Checklist Soda", notaMinimaCritico: 7, mediaMinima: 6.5, itensIds: ["item-2", "item-1"] },
    ]);
  });

  it("refuses inactive item on create", async () => {
    const { checklists, itens, creates } = createRepositories({});
    await assert.rejects(
      () =>
        new CreateIbcChecklistUseCase(checklists, itens).execute({
          actorRole: Role.ADMIN,
          nome: "Checklist Soda",
          notaMinimaCritico: 7,
          mediaMinima: 6,
          itensIds: ["item-1", "item-3"],
        }),
      (error: unknown) =>
        hasCode("IBC_CHECKLIST_ITEM_INATIVO", 422)(error) &&
        JSON.stringify((error as AppError).details) === JSON.stringify({ itensIds: ["item-3"] }),
    );
    assert.equal(creates.length, 0);
  });

  it("returns 404 for unknown item", async () => {
    const { checklists, itens, creates } = createRepositories({});
    await assert.rejects(
      () =>
        new CreateIbcChecklistUseCase(checklists, itens).execute({
          actorRole: Role.ADMIN,
          nome: "Checklist Soda",
          notaMinimaCritico: 7,
          mediaMinima: 6,
          itensIds: ["item-1", "missing"],
        }),
      hasCode("IBC_CHECKLIST_ITEM_NOT_FOUND", 404),
    );
    assert.equal(creates.length, 0);
  });

  it("keeps an item that was deactivated after joining the checklist", async () => {
    const { checklists, itens, updates } = createRepositories({ checklist: checklistSoda });
    await new UpdateIbcChecklistUseCase(checklists, itens).execute({
      actorRole: Role.ALMOX,
      id: "checklist-1",
      itensIds: ["item-1", "item-3"],
    });
    assert.deepEqual(updates[0]?.itensIds, ["item-1", "item-3"]);
  });

  it("refuses a newly added inactive item on update", async () => {
    const { checklists, itens, updates } = createRepositories({
      checklist: { ...checklistSoda, itens: [] },
    });
    await assert.rejects(
      () =>
        new UpdateIbcChecklistUseCase(checklists, itens).execute({
          actorRole: Role.ALMOX,
          id: "checklist-1",
          itensIds: ["item-3"],
        }),
      hasCode("IBC_CHECKLIST_ITEM_INATIVO", 422),
    );
    assert.equal(updates.length, 0);
  });

  it("updates fields without touching itens when itensIds is absent", async () => {
    const { checklists, itens, updates } = createRepositories({ checklist: checklistSoda });
    await new UpdateIbcChecklistUseCase(checklists, itens).execute({
      actorRole: Role.ADMIN,
      id: "checklist-1",
      ativo: false,
    });
    assert.deepEqual(updates, [
      { nome: undefined, notaMinimaCritico: undefined, mediaMinima: undefined, ativo: false, itensIds: undefined },
    ]);
  });

  it("returns 404 for missing checklist (including non-IBC ids)", async () => {
    const { checklists, itens, updates } = createRepositories({ checklist: null });
    await assert.rejects(
      () => new GetIbcChecklistUseCase(checklists).execute("vistoria-id"),
      hasCode("IBC_CHECKLIST_NOT_FOUND", 404),
    );
    await assert.rejects(
      () =>
        new UpdateIbcChecklistUseCase(checklists, itens).execute({
          actorRole: Role.ADMIN,
          id: "vistoria-id",
          ativo: false,
        }),
      hasCode("IBC_CHECKLIST_NOT_FOUND", 404),
    );
    assert.equal(updates.length, 0);
  });

  it("forbids roles other than ADMIN and ALMOX", async () => {
    const { checklists, itens, creates, updates } = createRepositories({ checklist: checklistSoda });
    await assert.rejects(
      () =>
        new CreateIbcChecklistUseCase(checklists, itens).execute({
          actorRole: Role.LOGISTICA,
          nome: "Checklist Soda",
          notaMinimaCritico: 7,
          mediaMinima: 6,
          itensIds: ["item-1"],
        }),
      hasCode("IBC_CHECKLIST_FORBIDDEN", 403),
    );
    await assert.rejects(
      () =>
        new UpdateIbcChecklistUseCase(checklists, itens).execute({
          actorRole: Role.VENDAS,
          id: "checklist-1",
          ativo: false,
        }),
      hasCode("IBC_CHECKLIST_FORBIDDEN", 403),
    );
    assert.equal(creates.length + updates.length, 0);
  });
});
