import { Router } from "express";
import { authMiddleware } from "../../../../middlewares/authMiddleware";
import {
  OverviewCustomerDetailController,
  type OverviewCustomerDetailControllerDeps,
} from "../controllers/OverviewCustomerDetailController";

export function createOverviewCustomerDetailRoutes(
  deps: OverviewCustomerDetailControllerDeps,
): Router {
  const router = Router();
  const controller = new OverviewCustomerDetailController(deps);

  router.get("/", authMiddleware, controller.list);
  router.get(
    "/:clienteId/monthly-evolution",
    authMiddleware,
    controller.getMonthlyEvolutionByCustomerCode,
  );
  router.get("/:clienteId", authMiddleware, controller.getByCustomerCode);

  return router;
}
