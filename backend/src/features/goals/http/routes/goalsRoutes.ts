import { Router } from "express";
import { GoalsController } from "../controllers/GoalsController";


const router = Router();

router.post("/", GoalsController.create);
router.get("/", (_req, res) => {
    res.status(200).json({ message: "GET funcionando — teste OK" });
});
router.delete("/:id", GoalsController.delete);

export default router;
