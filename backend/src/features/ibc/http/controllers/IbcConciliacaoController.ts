import { Request, Response } from "express";
import { respondAppError } from "./IbcController";
import { actor, invalidBody } from "./ibcControllerHelpers";
import { IbcExpedicaoRepository } from "../../repositories/IbcExpedicaoRepository";
import { IbcConciliacaoRepository } from "../../repositories/IbcConciliacaoRepository";
import { GetConciliacaoViagemUseCase } from "../../useCases/GetConciliacaoViagem.use-case";
import { SaveConciliacaoViagemUseCase } from "../../useCases/SaveConciliacaoViagem.use-case";
import { IbcConciliacaoHttpSchemas } from "../schemas/IbcConciliacaoSchema";

export class IbcConciliacaoController {
  static async consultar(req: Request, res: Response): Promise<Response> {
    try {
      const codCar = Number(req.params.codCar);
      if (!Number.isFinite(codCar)) {
        return res.status(400).json({ error: "Código da carga inválido.", code: "IBC_COD_CAR_INVALID" });
      }
      const view = await new GetConciliacaoViagemUseCase(
        new IbcExpedicaoRepository(),
        new IbcConciliacaoRepository(),
      ).execute({ codCar, actorRole: actor(req).actorRole });
      return res.status(200).json(view);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao consultar a conciliação da viagem");
    }
  }

  static async salvar(req: Request, res: Response): Promise<Response> {
    try {
      const codCar = Number(req.params.codCar);
      if (!Number.isFinite(codCar)) {
        return res.status(400).json({ error: "Código da carga inválido.", code: "IBC_COD_CAR_INVALID" });
      }
      const parsed = IbcConciliacaoHttpSchemas.salvar.safeParse(req.body ?? {});
      if (!parsed.success) throw invalidBody("IBC_CONCILIACAO_INVALID_BODY", parsed.error.format());
      const { actorRole, actorId } = actor(req);
      const view = await new SaveConciliacaoViagemUseCase(
        new IbcExpedicaoRepository(),
        new IbcConciliacaoRepository(),
      ).execute({
        codCar,
        actorRole,
        actorId,
        itens: parsed.data.itens ?? [],
        retornosSemId: parsed.data.retornosSemId ?? [],
      });
      return res.status(200).json(view);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao salvar a conciliação da viagem");
    }
  }
}
