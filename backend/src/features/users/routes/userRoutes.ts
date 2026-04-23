import express from "express";
import { userController } from "../controllers/userController";

const router = express.Router();

router.get("/", userController.findAll);
router.get("/:id/departamentos", userController.getUserDepartments);
router.get("/:id", userController.findById);
router.put("/:id/update", userController.update);
router.post("/:id/delete", userController.delete);

export default router;
