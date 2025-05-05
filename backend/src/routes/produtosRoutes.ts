import { Router } from 'express';
import { listProdutos } from '../controllers/produtosController';

const router = Router();

router.get('/', listProdutos);

export default router;