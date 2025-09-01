import { Router } from "express";
import { itemChecklistController } from "../controllers/itemChecklistController";
import { validate } from "../../../middlewares/validate";
import { createItemChecklistSchema, updateItemChecklistSchema } from "../schemas/ItemChecklistSchemas";

const router = Router();

router.post("/", validate(createItemChecklistSchema), itemChecklistController.create);
router.get("/", itemChecklistController.findAll);
router.get("/:id", itemChecklistController.findById);
router.put("/:id", validate(updateItemChecklistSchema), itemChecklistController.update);
router.delete("/:id", itemChecklistController.delete);

export default router;