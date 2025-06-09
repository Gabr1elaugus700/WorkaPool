/**
 * @openapi
 * /api/clientes:
 *   get:
 *     summary: Lista clientes
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    const clientes = [
        { id: 1, nome: 'Cliente 1', email: 'joão@gmail.com'},
        { id: 2, nome: 'Cliente 2', email: 'cliente@gmail.com'},
        { id: 3, nome: 'Cliente 3', email: 'cliente@gmail.com'}
    ]
    res.json(clientes);
});

export default router;