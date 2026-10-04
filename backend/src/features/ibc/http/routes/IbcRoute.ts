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

router.post(
  "/",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.createNovoIbc,
);

router.post(
  "/produtos",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.createProduto,
);

router.get(
  "/produtos",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.listProdutos,
);

router.patch(
  "/produtos/:id",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.updateProduto,
);

router.post(
  "/lote",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.createLoteIbc,
);

router.get(
  "/",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.listPool,
);

router.get(
  "/alerts",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.listAlerts,
);

router.patch(
  "/:id",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.patchDataLimite,
);

router.patch(
  "/:id/converter-nao-homologado",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.convertToNaoHomologado,
);

router.patch(
  "/:id/produto",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.changeProduto,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.softDelete,
);

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
