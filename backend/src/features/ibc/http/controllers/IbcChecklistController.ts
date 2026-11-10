import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { respondAppError } from "./IbcController";
import { actor, invalidBody } from "./ibcControllerHelpers";
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
import { VincularIbcChecklistUseCase } from "../../useCases/VincularIbcChecklist.use-case";
import { DesvincularIbcChecklistUseCase } from "../../useCases/DesvincularIbcChecklist.use-case";
import { IbcProdutoRepository } from "../../repositories/IbcProdutoRepository";
import { IbcChecklistPadraoRepository } from "../../repositories/IbcChecklistPadraoRepository";
import { ListIbcChecklistPadroesUseCase } from "../../useCases/ListIbcChecklistPadroes.use-case";
import { VincularIbcChecklistPadraoUseCase } from "../../useCases/VincularIbcChecklistPadrao.use-case";
import { DesvincularIbcChecklistPadraoUseCase } from "../../useCases/DesvincularIbcChecklistPadrao.use-case";

function actorRole(req: Request): Role {
  return actor(req).actorRole;
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

  static async vincular(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcChecklistHttpSchemas.vincularChecklist.safeParse(req.body);
      if (!parsed.success) throw invalidBody("IBC_CHECKLIST_VINCULO_INVALID_BODY", parsed.error.format());

      const vinculo = await new VincularIbcChecklistUseCase(
        new IbcCadastroRepository(),
        new IbcChecklistRepository(),
        new IbcChecklistVinculoRepository(),
      ).execute({ ...actor(req), ibcId: String(req.params.id), ...parsed.data });
      return res.status(201).json(vinculo);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao vincular checklist ao IBC");
    }
  }

  static async desvincular(req: Request, res: Response): Promise<Response> {
    try {
      await new DesvincularIbcChecklistUseCase(
        new IbcCadastroRepository(),
        new IbcChecklistVinculoRepository(),
      ).execute({
        actorRole: actorRole(req),
        ibcId: String(req.params.id),
        checklistModeloId: String(req.params.checklistModeloId),
      });
      return res.status(204).send();
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao desvincular checklist do IBC");
    }
  }

  static async listPadroes(req: Request, res: Response): Promise<Response> {
    try {
      const padroes = await new ListIbcChecklistPadroesUseCase(
        new IbcProdutoRepository(),
        new IbcChecklistPadraoRepository(),
      ).execute(String(req.params.produtoId));
      return res.status(200).json(padroes);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar o padrão de checklist do produto");
    }
  }

  static async vincularPadrao(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcChecklistHttpSchemas.vincularChecklist.safeParse(req.body);
      if (!parsed.success) throw invalidBody("IBC_CHECKLIST_PADRAO_INVALID_BODY", parsed.error.format());

      const padrao = await new VincularIbcChecklistPadraoUseCase(
        new IbcProdutoRepository(),
        new IbcChecklistRepository(),
        new IbcChecklistPadraoRepository(),
      ).execute({ ...actor(req), produtoId: String(req.params.produtoId), ...parsed.data });
      return res.status(201).json(padrao);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao vincular checklist padrão do produto");
    }
  }

  static async desvincularPadrao(req: Request, res: Response): Promise<Response> {
    try {
      await new DesvincularIbcChecklistPadraoUseCase(
        new IbcProdutoRepository(),
        new IbcChecklistPadraoRepository(),
      ).execute({
        actorRole: actorRole(req),
        produtoId: String(req.params.produtoId),
        checklistModeloId: String(req.params.checklistModeloId),
      });
      return res.status(204).send();
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao remover checklist padrão do produto");
    }
  }
}
