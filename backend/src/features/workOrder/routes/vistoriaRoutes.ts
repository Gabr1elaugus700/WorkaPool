import { Router } from "express";
import { vistoriaController } from "../controllers/vistoriaController";
import { validate } from "../../../middlewares/validate";
import { CreateVistoriaSchema, updateVistoriaSchema } from "../validations/vistoriaSchemas";

const router = Router();

router.post("/", validate(CreateVistoriaSchema), vistoriaController.create);
router.get("/", vistoriaController.findAll);
router.get("/:id", vistoriaController.findById);
router.get("/departamento/:departamento_id", vistoriaController.findByDepartamentoId);
router.put("/:id", validate(updateVistoriaSchema), vistoriaController.update);
router.delete("/:id", vistoriaController.delete);

export default router;