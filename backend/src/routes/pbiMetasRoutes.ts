import { Router } from "express";
import { pbiMetasController, salvarMetaSimples } from "../controllers/pbiMetasController";

const router = Router();

router.get("/", pbiMetasController);
router.post("/", salvarMetaSimples);

export default router;
