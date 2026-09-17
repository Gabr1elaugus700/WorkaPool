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
  router.get(
    "/:clienteId/purchased-products",
    authMiddleware,
    controller.getPurchasedProductsByCustomerCode,
  );
  router.get(
    "/:clienteId/recent-orders",
    authMiddleware,
    controller.getRecentCommercialMotionByCustomerCode,
  );
  router.get(
    "/:clienteId/recent-commercial-motion",
    authMiddleware,
    controller.getRecentCommercialMotionByCustomerCode,
  );
  router.get("/:clienteId", authMiddleware, controller.getByCustomerCode);

  return router;
}
