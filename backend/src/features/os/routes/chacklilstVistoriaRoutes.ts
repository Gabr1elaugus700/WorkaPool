import { Router } from "express";
import { checklistVistoriaController } from "../controllers/checklistVistoriaController";
import { validate } from "../../../middlewares/validate";
import { createChecklistVistoriaSchema, updateChecklistVistoriaSchema } from "../schemas/checklistVistoriaSchemas";

const router = Router();

router.post("/", validate(createChecklistVistoriaSchema), checklistVistoriaController.create);
router.get("/", checklistVistoriaController.findAll);
router.get("/:id", checklistVistoriaController.findById);
router.put("/:id", validate(updateChecklistVistoriaSchema), checklistVistoriaController.update);
router.delete("/:id", checklistVistoriaController.delete);

export default router;