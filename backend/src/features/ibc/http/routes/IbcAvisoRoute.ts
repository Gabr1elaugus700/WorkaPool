import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRoles } from "../../../../middlewares/authMiddleware";
import { validate } from "../../../../middlewares/validate";
import {
  AvisoRepresentanteRepository,
  type AvisoLeituraPort,
} from "../../repositories/AvisoRepresentanteRepository";
import { avisoRepresentanteSchemas } from "../../schemas/avisoRepresentante.schemas";
import { IbcAvisoController } from "../controllers/IbcAvisoController";

const avisoRoles: Role[] = [Role.VENDAS, Role.ADMIN];

export function createIbcAvisoRoutes(avisos?: AvisoLeituraPort): Router {
  const controller = new IbcAvisoController(avisos ?? new AvisoRepresentanteRepository());
  const auth = [authMiddleware, requireRoles(avisoRoles)];
  const router = Router();
  router.get("/", auth, controller.listar);
  router.patch("/:id/lido", auth, validate(avisoRepresentanteSchemas.marcarLido), controller.marcarLido);
  return router;
}
