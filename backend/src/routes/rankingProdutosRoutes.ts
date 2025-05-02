import { Router } from 'express';
import { rankingProdutosVendidos } from '../controllers/rankingProdutosController';

const router = Router();

router.post('/', rankingProdutosVendidos);

export default router;