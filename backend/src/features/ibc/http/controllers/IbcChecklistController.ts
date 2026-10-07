import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../../../../utils/AppError";
import { respondAppError } from "./IbcController";
import { IbcChecklistHttpSchemas } from "../schemas/IbcChecklistSchema";
import { IbcChecklistItemRepository } from "../../repositories/IbcChecklistItemRepository";
import { ListIbcChecklistItensUseCase } from "../../useCases/ListIbcChecklistItens.use-case";
import { CreateIbcChecklistItemUseCase } from "../../useCases/CreateIbcChecklistItem.use-case";
import { UpdateIbcChecklistItemUseCase } from "../../useCases/UpdateIbcChecklistItem.use-case";
import { IbcChecklistRepository } from "../../repositories/IbcChecklistRepository";
import { ListIbcChecklistsUseCase } from "../../useCases/ListIbcChecklists.use-case";
import { GetIbcChecklistUseCase } from "../../useCases/GetIbcChecklist.use-case";
import { CreateIbcChecklistUseCase } from "../../useCases/CreateIbcChecklist.use-case";
import { UpdateIbcChecklistUseCase } from "../../useCases/UpdateIbcChecklist.use-case";
import { IbcCadastroRepository } from "../../repositories/IbcCadastroRepository";
import { IbcChecklistVinculoRepository } from "../../repositories/IbcChecklistVinculoRepository";
import { ListIbcChecklistVinculosUseCase } from "../../useCases/ListIbcChecklistVinculos.use-case";

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

  static async listChecklists(_req: Request, res: Response): Promise<Response> {
    try {
      const checklists = await new ListIbcChecklistsUseCase(new IbcChecklistRepository()).execute();
      return res.status(200).json(checklists);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar checklists de IBC");
    }
  }

  static async getChecklist(req: Request, res: Response): Promise<Response> {
    try {
      const checklist = await new GetIbcChecklistUseCase(new IbcChecklistRepository()).execute(
        String(req.params.checklistId),
      );
      return res.status(200).json(checklist);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao buscar checklist de IBC");
    }
  }

  static async createChecklist(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcChecklistHttpSchemas.createChecklist.safeParse(req.body);
      if (!parsed.success) throw invalidBody("IBC_CHECKLIST_INVALID_BODY", parsed.error.format());

      const checklist = await new CreateIbcChecklistUseCase(
        new IbcChecklistRepository(),
        new IbcChecklistItemRepository(),
      ).execute({ actorRole: actorRole(req), ...parsed.data });
      return res.status(201).json(checklist);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao cadastrar checklist de IBC");
    }
  }

  static async updateChecklist(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcChecklistHttpSchemas.updateChecklist.safeParse(req.body);
      if (!parsed.success) throw invalidBody("IBC_CHECKLIST_INVALID_BODY", parsed.error.format());

      const checklist = await new UpdateIbcChecklistUseCase(
        new IbcChecklistRepository(),
        new IbcChecklistItemRepository(),
      ).execute({
        actorRole: actorRole(req),
        id: String(req.params.checklistId),
        ...parsed.data,
      });
      return res.status(200).json(checklist);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao editar checklist de IBC");
    }
  }

  static async listVinculos(req: Request, res: Response): Promise<Response> {
    try {
      const vinculos = await new ListIbcChecklistVinculosUseCase(
        new IbcCadastroRepository(),
        new IbcChecklistVinculoRepository(),
      ).execute(String(req.params.id));
      return res.status(200).json(vinculos);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar checklists do IBC");
    }
  }
}
