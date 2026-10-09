import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import { respondAppError } from "./IbcController";
import { IbcInspecaoHttpSchemas } from "../schemas/IbcInspecaoSchema";
import { IbcCadastroRepository } from "../../repositories/IbcCadastroRepository";
import { IbcInspecaoRepository } from "../../repositories/IbcInspecaoRepository";
import { RegistrarIbcInspecaoUseCase } from "../../useCases/RegistrarIbcInspecao.use-case";

export class IbcInspecaoController {
  static async registrar(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        throw new AppError({ message: "Usuário não autenticado", statusCode: 401, code: "IBC_ACTOR_REQUIRED" });
      }
      const parsed = IbcInspecaoHttpSchemas.registrar.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError({
          message: "Dados inválidos",
          statusCode: 400,
          code: "IBC_INSPECAO_INVALID_BODY",
          details: parsed.error.format(),
        });
      }

      const result = await new RegistrarIbcInspecaoUseCase(
        new IbcCadastroRepository(),
        new IbcInspecaoRepository(),
      ).execute({
        actorRole: req.user.role,
        actorId: req.user.id,
        ibcId: String(req.params.id),
        ...parsed.data,
      });
      return res.status(201).json(result);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao registrar inspeção do IBC");
    }
  }
}
