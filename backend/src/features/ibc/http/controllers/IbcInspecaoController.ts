import { Request, Response } from "express";
import { respondAppError } from "./IbcController";
import { actor, invalidBody } from "./ibcControllerHelpers";
import { IbcInspecaoHttpSchemas } from "../schemas/IbcInspecaoSchema";
import { IbcCadastroRepository } from "../../repositories/IbcCadastroRepository";
import { IbcInspecaoRepository } from "../../repositories/IbcInspecaoRepository";
import { RegistrarIbcInspecaoUseCase } from "../../useCases/RegistrarIbcInspecao.use-case";

export class IbcInspecaoController {
  static async registrar(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcInspecaoHttpSchemas.registrar.safeParse(req.body);
      if (!parsed.success) throw invalidBody("IBC_INSPECAO_INVALID_BODY", parsed.error.format());

      const result = await new RegistrarIbcInspecaoUseCase(
        new IbcCadastroRepository(),
        new IbcInspecaoRepository(),
      ).execute({ ...actor(req), ibcId: String(req.params.id), ...parsed.data });
      return res.status(201).json(result);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao registrar inspeção do IBC");
    }
  }
}
