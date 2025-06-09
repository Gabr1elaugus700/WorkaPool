/**
 * @openapi
 * /api/vendedores:
 *   get:
 *     summary: Lista de vendedores
 *     responses:
 *       200:
 *         description: Lista de vendedores
 */
import { Router } from 'express';
import { listVendedores } from '../controllers/vendedorController';

const router = Router();

router.get('/', listVendedores);

export default router;