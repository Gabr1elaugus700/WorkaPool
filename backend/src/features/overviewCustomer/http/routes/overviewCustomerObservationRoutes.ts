import { Router } from "express";
import { authMiddleware } from "../../../../middlewares/authMiddleware";
import {
  OverviewCustomerObservationController,
  type OverviewCustomerObservationControllerDeps,
} from "../controllers/OverviewCustomerObservationController";

export function createOverviewCustomerObservationRoutes(
  deps: OverviewCustomerObservationControllerDeps,
): Router {
  const router = Router({ mergeParams: true });
  const controller = new OverviewCustomerObservationController(deps);

  router.get("/", authMiddleware, controller.list);
  router.post("/", authMiddleware, controller.create);

  return router;
}
