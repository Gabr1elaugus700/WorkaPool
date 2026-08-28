import { Router } from "express";
import { Role } from "@prisma/client";
import {
  authMiddleware,
  requireRoles,
} from "../../../../middlewares/authMiddleware";
import { IbcController } from "../controllers/IbcController";

const router = Router();

/** Leitura: ALMOX e ADMIN (e leitura ampla para alinhamento operacional). */
const ibcReadRoles: Role[] = [
  Role.ADMIN,
  Role.ALMOX,
  Role.LOGISTICA,
  Role.GERENTE_DPTO,
];

/** Mutações de preparação/expedição: somente ADMIN + ALMOX (LOGISTICA → 403). */
const ibcWriteRoles: Role[] = [Role.ADMIN, Role.ALMOX];

router.get(
  "/cargas-expedicao",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.listCargasExpedicao,
);

router.get(
  "/events",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.streamEvents,
);

router.get(
  "/cargas-expedicao/:codCar",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.getCargaExpedicaoDetail,
);

router.post(
  "/alocacoes",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.createAlocacao,
);

/** DELETE by alocacao id (UUID). Documented alternative to identificador+codCar. */
router.delete(
  "/alocacoes/:id",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.removeAlocacao,
);

router.post(
  "/expedicoes",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.fecharExpedicao,
);

export default router;
