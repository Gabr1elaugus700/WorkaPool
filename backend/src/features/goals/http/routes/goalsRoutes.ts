import { Router } from "express";
import { GoalsController } from "../controllers/GoalsController";


const router = Router();

router.post("/", GoalsController.create);
router.get("/", GoalsController.getAll)
router.delete("/:id", GoalsController.delete);
router.get("/:id", GoalsController.findById);
router.get("/search", GoalsController.findByRepMonthProduct);

export default router;
