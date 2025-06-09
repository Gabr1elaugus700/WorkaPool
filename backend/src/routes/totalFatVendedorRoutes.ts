/**
 * @openapi
 * /api/faturamento:
 *   post:
 *     summary: Faturamento por vendedor
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
 *     responses:
 *       200:
 *         description: Resultado do faturamento
 */
import { Router } from 'express';
import { faturamentoPorVendedor } from '../controllers/totalFatVendedorController';

const router = Router();

router.post('/', faturamentoPorVendedor);

export default router;
