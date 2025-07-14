import { Router } from "express";
import { metasController } from "../controllers/metasController";

const router = Router();

router.post("/", metasController.createMetas);
router.get("/", metasController.getMetas);
export default router;
