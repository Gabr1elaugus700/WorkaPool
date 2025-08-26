import { Router } from "express";
import { osController } from "../controllers/osController";
import { validate } from "../../../middlewares/validate";
import { createOSSchema, updateOSSchema } from "../schemas/osSchemas";

const router = Router();

router.post("/", validate(createOSSchema), osController.create);
router.get("/", osController.findAll);
router.get("/:id", osController.findById);
router.put("/:id", validate(updateOSSchema), osController.update);
router.delete("/:id", osController.delete);

export default router;