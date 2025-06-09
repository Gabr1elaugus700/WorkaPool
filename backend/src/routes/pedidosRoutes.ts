/**
 * @openapi
 * /api/pedidos:
 *   get:
 *     summary: Lista pedidos
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
import { Router } from 'express';
import { getVendas } from '../controllers/pedidosController';


const router = Router();
router.get('/', getVendas);

export default router;