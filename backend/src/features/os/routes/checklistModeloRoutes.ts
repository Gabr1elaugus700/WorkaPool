import { Router } from "express";
import { checklistModeloController } from "../controllers/checklistModeloController";
import { validate } from "../../../middlewares/validate";
import { createChecklistModeloSchema, updateChecklistModeloSchema } from "../schemas/checklistModeloSchemas";

const router = Router();

router.post("/", validate(createChecklistModeloSchema), checklistModeloController.create);
router.get("/", checklistModeloController.findAll);
router.get("/:id", checklistModeloController.findById);
router.put("/:id", validate(updateChecklistModeloSchema), checklistModeloController.update);
router.delete("/:id", checklistModeloController.delete);

export default router;