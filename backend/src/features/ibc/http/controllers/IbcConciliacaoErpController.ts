import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import { createSapiensSaldoIbcErpPort } from "../../adapters/createSapiensSaldoIbcErpPort";
import type { ISaldoIbcErp } from "../../ports/ISaldoIbcErp";
import type { IIbcConciliacaoErpRepository } from "../../repositories/IIbcConciliacaoErpRepository";
import { IbcConciliacaoErpRepository } from "../../repositories/IbcConciliacaoErpRepository";
import { conciliacaoErpSchemas } from "../../schemas/conciliacaoErp.schemas";
import { toConciliacaoErpResponse } from "../../mappers/conciliacaoErp.mapper";
import { GetConciliacaoErpUseCase } from "../../useCases/GetConciliacaoErp.use-case";
import { respondAppError } from "./IbcController";

export class IbcConciliacaoErpController {
  constructor(
    private readonly linhas: IIbcConciliacaoErpRepository = new IbcConciliacaoErpRepository(),
    private readonly saldo: ISaldoIbcErp = createSapiensSaldoIbcErpPort(),
  ) {}

  consultar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        throw new AppError({
          message: "Usuário não autenticado",
          statusCode: 401,
          code: "IBC_ACTOR_REQUIRED",
        });
      }
      const parsed = conciliacaoErpSchemas.consulta.safeParse({ query: req.query });
      if (!parsed.success) {
        throw new AppError({
          message: "Bucket de conciliação ERP inválido",
          statusCode: 400,
          code: "IBC_CONCILIACAO_ERP_BUCKET_INVALIDO",
          details: parsed.error.issues,
        });
      }
      const relatorio = await new GetConciliacaoErpUseCase(this.linhas, this.saldo).execute({
        role: req.user.role,
        bucket: parsed.data.query.bucket,
      });
      return res.status(200).json(toConciliacaoErpResponse(relatorio));
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao consultar a conciliação ERP");
    }
  };
}
