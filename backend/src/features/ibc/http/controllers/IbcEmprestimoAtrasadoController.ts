import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import { toEmprestimoAtrasadoListaResponse } from "../../mappers/emprestimoAtrasado.mapper";
import type { IIbcEmprestimoAtrasadoRepository } from "../../repositories/IIbcEmprestimoAtrasadoRepository";
import { IbcEmprestimoAtrasadoRepository } from "../../repositories/IbcEmprestimoAtrasadoRepository";
import { ListEmprestimosAtrasadosUseCase } from "../../useCases/ListEmprestimosAtrasados.use-case";
import { respondAppError } from "./IbcController";

export class IbcEmprestimoAtrasadoController {
  constructor(
    private readonly emprestimos: IIbcEmprestimoAtrasadoRepository = new IbcEmprestimoAtrasadoRepository(),
  ) {}

  listar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        throw new AppError({
          message: "Usuário não autenticado",
          statusCode: 401,
          code: "IBC_ACTOR_REQUIRED",
        });
      }
      const lista = await new ListEmprestimosAtrasadosUseCase(this.emprestimos).execute({
        role: req.user.role,
        codRep: req.user.codRep,
        now: new Date(),
      });
      return res.status(200).json(toEmprestimoAtrasadoListaResponse(lista.itens));
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar empréstimos em atraso");
    }
  };
}
