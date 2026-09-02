import express from "express";
import { Role } from "@prisma/client";
import { userController } from "../controllers/userController";
import { validate } from "../../../middlewares/validate";
import { authMiddleware, requireRoles } from "../../../middlewares/authMiddleware";
import { usersContracts } from "../contracts/user.contracts";
import { createUserSchema } from "../schemas/userSchemas";

const router = express.Router();
const [findAllContract, findByIdContract, getDepartmentsContract, updateContract, deleteContract] =
  usersContracts;

const adminRoles: Role[] = [Role.ADMIN];

router.get(
  "/",
  authMiddleware,
  requireRoles(adminRoles),
  validate(findAllContract.validationSchema!),
  userController.findAll,
);
router.post(
  "/",
  authMiddleware,
  requireRoles(adminRoles),
  validate(createUserSchema),
  userController.create,
);
router.get(
  "/:id/departamentos",
  authMiddleware,
  requireRoles(adminRoles),
  validate(getDepartmentsContract.validationSchema!),
  userController.getUserDepartments,
);
router.get(
  "/:id",
  authMiddleware,
  requireRoles(adminRoles),
  validate(findByIdContract.validationSchema!),
  userController.findById,
);
router.put(
  "/:id/update",
  authMiddleware,
  requireRoles(adminRoles),
  validate(updateContract.validationSchema!),
  userController.update,
);
router.post(
  "/:id/delete",
  authMiddleware,
  requireRoles(adminRoles),
  validate(deleteContract.validationSchema!),
  userController.delete,
);

export default router;
