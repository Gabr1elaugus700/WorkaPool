import { Router } from "express";
import { getProdutosEstoqueController } from "../controllers/estoqueProdutosController";

const router = Router();

router.get("/", getProdutosEstoqueController);

export default router;
