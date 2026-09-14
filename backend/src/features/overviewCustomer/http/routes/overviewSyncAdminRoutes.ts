import { Router } from "express";
import { Role } from "@prisma/client";
import {
  authMiddleware,
  requireRoles,
} from "../../../../middlewares/authMiddleware";
import {
  OverviewSyncAdminController,
  type OverviewSyncAdminControllerDeps,
} from "../controllers/OverviewSyncAdminController";

const adminOnly: Role[] = [Role.ADMIN];

export function createOverviewSyncAdminRoutes(
  deps: OverviewSyncAdminControllerDeps,
): Router {
  const router = Router();
  const controller = new OverviewSyncAdminController(deps);

  router.get("/status", authMiddleware, requireRoles(adminOnly), controller.getStatus);
  router.get("/runs", authMiddleware, requireRoles(adminOnly), controller.listRuns);
  router.get(
    "/runs/:runId",
    authMiddleware,
    requireRoles(adminOnly),
    controller.getRun,
  );
  router.post(
    "/runs/:runId/steps/:stepName/retry",
    authMiddleware,
    requireRoles(adminOnly),
    controller.retryFailedStep,
  );

  return router;
}
