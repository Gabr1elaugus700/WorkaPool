import { NextFunction, Request, Response, Router } from "express";
import { authMiddleware } from "../../../../middlewares/authMiddleware";
import { AppError } from "../../../../utils/AppError";
import { assertCanLerEmprestimosAtrasados } from "../../permissions/assertCanLerEmprestimosAtrasados";
import type { IIbcEmprestimoAtrasadoRepository } from "../../repositories/IIbcEmprestimoAtrasadoRepository";
import { IbcEmprestimoAtrasadoController } from "../controllers/IbcEmprestimoAtrasadoController";
import { respondAppError } from "../controllers/IbcController";

/** Repete a permissão para o 403 sair com `IBC_EMPRESTIMO_ATRASADO_FORBIDDEN`. */
function exigirLeituraEmprestimoAtrasado(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError({
        message: "Usuário não autenticado",
        statusCode: 401,
        code: "IBC_ACTOR_REQUIRED",
      });
    }
    assertCanLerEmprestimosAtrasados(req.user.role, req.user.codRep);
    next();
  } catch (err: unknown) {
    respondAppError(res, err, "Erro ao listar empréstimos em atraso");
  }
}

export function createIbcEmprestimoAtrasadoRoutes(
  emprestimos?: IIbcEmprestimoAtrasadoRepository,
): Router {
  const controller = new IbcEmprestimoAtrasadoController(emprestimos);
  const router = Router();
  router.get("/", authMiddleware, exigirLeituraEmprestimoAtrasado, controller.listar);
  return router;
}
