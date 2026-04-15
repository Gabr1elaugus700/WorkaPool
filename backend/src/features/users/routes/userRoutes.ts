import express from "express";
import { userController } from "../controllers/userController";
import { validate } from "../../../middlewares/validate";

const router = express.Router();

router.get("/", userController.findAll);
router.get("/:id", userController.findById);
router.put("/:id/update", userController.update);
router.post("/:id/delete", userController.delete);
router.get("/:id/departamentos", userController.getUserDepartments);


export default router;
