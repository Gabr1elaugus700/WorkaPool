/**
 * @openapi
 * /api/pedidoToCarga/{numPed}:
 *   put:
 *     summary: Atualiza pedido com carga
 *     parameters:
 *       - in: path
 *         name: numPed
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codCar:
 *                 type: integer
 *               posCar:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Pedido atualizado
 */
import { Router } from 'express';
import { updatePedido } from '../controllers/alteraPedidoCargaController';

const router = Router();

router.put('/:numPed', updatePedido);

export default router;