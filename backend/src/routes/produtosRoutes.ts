/**
 * @openapi
 * /api/produtos:
 *   get:
 *     summary: Lista de produtos
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
import { Router } from 'express';
import { listProdutos } from '../controllers/produtosController';

const router = Router();

router.get('/', listProdutos);

export default router;