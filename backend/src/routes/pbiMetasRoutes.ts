import { Router } from "express";
import { pbiMetasController } from "../controllers/pbiMetasController";

const router = Router();

router.get("/", pbiMetasController);
export default router;
