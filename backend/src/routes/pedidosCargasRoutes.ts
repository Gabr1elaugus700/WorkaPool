/**
 * @openapi
 * /api/pedidosEmCargas:
 *   get:
 *     summary: Lista pedidos por carga
 *     parameters:
 *       - in: query
 *         name: codCar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pedidos da carga
 */
// backend/src/routes/pedidoRoutes.ts
import { Router } from 'express';
import { getPedCargas } from '../controllers/pedidoCargaController';

const router = Router();

router.get('/', getPedCargas);

export default router;
