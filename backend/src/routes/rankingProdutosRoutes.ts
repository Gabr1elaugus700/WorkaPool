/**
 * @openapi
 * /api/rankingProdutos:
 *   post:
 *     summary: Ranking de produtos vendidos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codRep:
 *                 type: integer
 *               dataInicio:
 *                 type: string
 *                 format: date
 *               top:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lista de produtos rankeados
 */
import { Router } from 'express';
import { rankingProdutosVendidos } from '../controllers/rankingProdutosController';

const router = Router();

router.post('/', rankingProdutosVendidos);

export default router;