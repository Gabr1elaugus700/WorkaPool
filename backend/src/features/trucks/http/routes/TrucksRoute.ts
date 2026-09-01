import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware, requireRoles } from "../../../../middlewares/authMiddleware";
import { validate } from "../../../../middlewares/validate";
import { TrucksController } from "../controllers/TrucksController";
import {
  createTruckSchema,
  getTruckByIdSchema,
  listTrucksSchema,
  updateTruckSchema,
} from "../schemas/truckSchemas";

const router = Router();

const fleetWriteRoles: Role[] = [
  Role.ADMIN,
  Role.LOGISTICA,
  Role.GERENTE_DPTO,
];

router.get(
  "/",
  authMiddleware,
  requireRoles(fleetWriteRoles),
  validate(listTrucksSchema),
  TrucksController.list,
);

router.get(
  "/:id",
  authMiddleware,
  requireRoles(fleetWriteRoles),
  validate(getTruckByIdSchema),
  TrucksController.getById,
);

router.post(
  "/",
  authMiddleware,
  requireRoles(fleetWriteRoles),
  validate(createTruckSchema),
  TrucksController.create,
);

router.put(
  "/:id",
  authMiddleware,
  requireRoles(fleetWriteRoles),
  validate(updateTruckSchema),
  TrucksController.update,
);

export default router;
