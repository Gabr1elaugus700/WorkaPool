/**
 * @openapi
 * /api/pedidosFechados:
 *   get:
 *     summary: Lista pedidos fechados
 *     parameters:
 *       - in: query
 *         name: codRep
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pedidos fechados
 */
import { Router } from 'express';
import { getPedFechados } from '../controllers/pedidosFechadosControllers';


const router = Router();
router.get('/', getPedFechados);

export default router;