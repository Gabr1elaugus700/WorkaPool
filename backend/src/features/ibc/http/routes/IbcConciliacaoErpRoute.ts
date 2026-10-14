import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRoles } from "../../../../middlewares/authMiddleware";
import type { ISaldoIbcErp } from "../../ports/ISaldoIbcErp";
import type { IIbcConciliacaoErpRepository } from "../../repositories/IIbcConciliacaoErpRepository";
import { IbcConciliacaoErpController } from "../controllers/IbcConciliacaoErpController";

/** Mesmos papéis de `ibcReadRoles`. O use case repete a checagem. */
const leituraRoles: Role[] = [Role.ADMIN, Role.ALMOX, Role.LOGISTICA, Role.GERENTE_DPTO];

export function createIbcConciliacaoErpRoutes(
  linhas?: IIbcConciliacaoErpRepository,
  saldo?: ISaldoIbcErp,
): Router {
  const controller = new IbcConciliacaoErpController(linhas, saldo);
  const router = Router();
  router.get("/", [authMiddleware, requireRoles(leituraRoles)], controller.consultar);
  return router;
}
