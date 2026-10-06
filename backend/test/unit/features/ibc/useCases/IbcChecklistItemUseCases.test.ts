import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { CreateIbcChecklistItemUseCase } from "../../../../../src/features/ibc/useCases/CreateIbcChecklistItem.use-case";
import { UpdateIbcChecklistItemUseCase } from "../../../../../src/features/ibc/useCases/UpdateIbcChecklistItem.use-case";
import {
  CreateIbcChecklistItemData,
  IIbcChecklistItemRepository,
  UpdateIbcChecklistItemData,
} from "../../../../../src/features/ibc/repositories/IIbcChecklistItemRepository";
import { IbcChecklistItemRecord } from "../../../../../src/features/ibc/types/IbcChecklist.types";
import { AppError } from "../../../../../src/utils/AppError";

const tampa: IbcChecklistItemRecord = {
  id: "item-1",
  descricao: "Tampa",
  critico: true,
  ativo: true,
};

function createRepository(found: IbcChecklistItemRecord | null) {
  const creates: CreateIbcChecklistItemData[] = [];
  const updates: UpdateIbcChecklistItemData[] = [];
  const repository: IIbcChecklistItemRepository = {
    async list() {
      return [];
    },
    async findById() {
      return found;
    },
    async findManyByIds() {
      return found ? [found] : [];
    },
    async create(data) {
      creates.push(data);
      return { ...tampa, ...data };
    },
    async updateById(id, data) {
      updates.push(data);
      return { ...tampa, id, ...data };
    },
  };
  return { repository, creates, updates };
}

function isForbidden(error: unknown): boolean {
  return (
    error instanceof AppError &&
    error.code === "IBC_CHECKLIST_FORBIDDEN" &&
    error.statusCode === 403
  );
}

describe("IBC checklist item use-cases", () => {
  it("creates item with trimmed descricao", async () => {
    const { repository, creates } = createRepository(null);
    await new CreateIbcChecklistItemUseCase(repository).execute({
      actorRole: Role.ALMOX,
      descricao: "  Base  ",
      critico: false,
    });
    assert.deepEqual(creates, [{ descricao: "Base", critico: false }]);
  });

  it("forbids roles other than ADMIN and ALMOX", async () => {
    const { repository, creates, updates } = createRepository(tampa);
    await assert.rejects(
      () =>
        new CreateIbcChecklistItemUseCase(repository).execute({
          actorRole: Role.LOGISTICA,
          descricao: "Base",
          critico: false,
        }),
      isForbidden,
    );
    await assert.rejects(
      () =>
        new UpdateIbcChecklistItemUseCase(repository).execute({
          actorRole: Role.VENDAS,
          id: "item-1",
          ativo: false,
        }),
      isForbidden,
    );
    assert.equal(creates.length + updates.length, 0);
  });

  it("returns 404 when updating a missing item", async () => {
    const { repository, updates } = createRepository(null);
    await assert.rejects(
      () =>
        new UpdateIbcChecklistItemUseCase(repository).execute({
          actorRole: Role.ADMIN,
          id: "missing",
          ativo: false,
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_CHECKLIST_ITEM_NOT_FOUND",
    );
    assert.equal(updates.length, 0);
  });

  it("deactivates item keeping other fields untouched", async () => {
    const { repository, updates } = createRepository(tampa);
    const item = await new UpdateIbcChecklistItemUseCase(repository).execute({
      actorRole: Role.ADMIN,
      id: "item-1",
      ativo: false,
    });
    assert.deepEqual(updates, [{ descricao: undefined, critico: undefined, ativo: false }]);
    assert.equal(item.ativo, false);
  });
});
