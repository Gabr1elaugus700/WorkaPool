import { Router } from "express";
import { dptosController } from "../controllers/departamentosContoller"
import { validate } from "../../../middlewares/validate";
import { createDepartamentoSchema, updateDepartamentoSchema } from "../schemas/departamentosSchemas"

const router = Router();

router.post("/", validate(createDepartamentoSchema), dptosController.create);
router.get("/", dptosController.findAll);
router.get("/:id", dptosController.findById);
router.put("/:id", validate(updateDepartamentoSchema), dptosController.update);
router.delete("/:id", dptosController.delete);

export default router;