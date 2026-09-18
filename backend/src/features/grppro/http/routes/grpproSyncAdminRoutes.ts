import { Router } from "express";
import { Role } from "@prisma/client";
import {
  authMiddleware,
  requireRoles,
} from "../../../../middlewares/authMiddleware";
import {
  GrpproSyncAdminController,
  type GrpproSyncAdminControllerDeps,
} from "../controllers/GrpproSyncAdminController";

const adminOnly: Role[] = [Role.ADMIN];

export function createGrpproSyncAdminRoutes(
  deps: GrpproSyncAdminControllerDeps,
): Router {
  const router = Router();
  const controller = new GrpproSyncAdminController(deps);

  router.get("/status", authMiddleware, requireRoles(adminOnly), controller.getStatus);
  router.post("/runs", authMiddleware, requireRoles(adminOnly), controller.startSync);
  router.get("/runs", authMiddleware, requireRoles(adminOnly), controller.listRuns);
  router.get(
    "/runs/:runId",
    authMiddleware,
    requireRoles(adminOnly),
    controller.getRun,
  );

  return router;
}
