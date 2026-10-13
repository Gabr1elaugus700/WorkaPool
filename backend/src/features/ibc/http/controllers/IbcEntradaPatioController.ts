import { Request, Response } from "express";
import { respondAppError } from "./IbcController";
import { actor, invalidBody } from "./ibcControllerHelpers";
import { IbcEntradaPatioHttpSchemas } from "../schemas/IbcEntradaPatioSchema";
import { IbcEntradaPatioRepository } from "../../repositories/IbcEntradaPatioRepository";
import { AbrirEntradaPatioUseCase } from "../../useCases/AbrirEntradaPatio.use-case";
import { ConcluirEntradaPatioUseCase } from "../../useCases/ConcluirEntradaPatio.use-case";
import { ListEntradasPatioPendentesUseCase } from "../../useCases/ListEntradasPatioPendentes.use-case";

export class IbcEntradaPatioController {
  static async listar(req: Request, res: Response): Promise<Response> {
    try {
      const itens = await new ListEntradasPatioPendentesUseCase(new IbcEntradaPatioRepository()).execute(
        actor(req).actorRole,
      );
      return res.status(200).json(itens);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar entradas no pátio");
    }
  }

  static async abrir(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcEntradaPatioHttpSchemas.abrir.safeParse(req.body);
      if (!parsed.success) throw invalidBody("IBC_ENTRADA_INVALID_BODY", parsed.error.format());
      const entrada = await new AbrirEntradaPatioUseCase(new IbcEntradaPatioRepository()).execute({
        ...actor(req),
        ibcId: String(req.params.id),
        origem: parsed.data.origem,
      });
      return res.status(201).json(entrada);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao abrir entrada no pátio");
    }
  }

  static async concluir(req: Request, res: Response): Promise<Response> {
    try {
      const entrada = await new ConcluirEntradaPatioUseCase(new IbcEntradaPatioRepository()).execute({
        ...actor(req),
        ibcId: String(req.params.id),
      });
      return res.status(200).json(entrada);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao concluir entrada no pátio");
    }
  }
}
