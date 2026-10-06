import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../../../../utils/AppError";
import { respondAppError } from "./IbcController";
import { IbcChecklistHttpSchemas } from "../schemas/IbcChecklistSchema";
import { IbcChecklistItemRepository } from "../../repositories/IbcChecklistItemRepository";
import { ListIbcChecklistItensUseCase } from "../../useCases/ListIbcChecklistItens.use-case";
import { CreateIbcChecklistItemUseCase } from "../../useCases/CreateIbcChecklistItem.use-case";
import { UpdateIbcChecklistItemUseCase } from "../../useCases/UpdateIbcChecklistItem.use-case";

function actorRole(req: Request): Role {
  if (!req.user) {
    throw new AppError({ message: "Usuário não autenticado", statusCode: 401, code: "IBC_ACTOR_REQUIRED" });
  }
  return req.user.role;
}

function invalidBody(code: string, details: unknown): AppError {
  return new AppError({ message: "Dados inválidos", statusCode: 400, code, details });
}

export class IbcChecklistController {
  static async listItens(_req: Request, res: Response): Promise<Response> {
    try {
      const itens = await new ListIbcChecklistItensUseCase(new IbcChecklistItemRepository()).execute();
      return res.status(200).json(itens);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar itens de checklist");
    }
  }

  static async createItem(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcChecklistHttpSchemas.createItem.safeParse(req.body);
      if (!parsed.success) throw invalidBody("IBC_CHECKLIST_ITEM_INVALID_BODY", parsed.error.format());

      const item = await new CreateIbcChecklistItemUseCase(new IbcChecklistItemRepository()).execute({
        actorRole: actorRole(req),
        ...parsed.data,
      });
      return res.status(201).json(item);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao cadastrar item de checklist");
    }
  }

  static async updateItem(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcChecklistHttpSchemas.updateItem.safeParse(req.body);
      if (!parsed.success) throw invalidBody("IBC_CHECKLIST_ITEM_INVALID_BODY", parsed.error.format());

      const item = await new UpdateIbcChecklistItemUseCase(new IbcChecklistItemRepository()).execute({
        actorRole: actorRole(req),
        id: String(req.params.itemId),
        ...parsed.data,
      });
      return res.status(200).json(item);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao editar item de checklist");
    }
  }
}
