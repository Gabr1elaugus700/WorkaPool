/**
 * @openapi
 * /api/Cargas:
 *   post:
 *     summary: Criar carga
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destino:
 *                 type: string
 *               pesoMax:
 *                 type: number
 *               custoMin:
 *                 type: number
 *               situacao:
 *                 type: string
 *               previsaoSaida:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Carga criada
 *   get:
 *     summary: Listar cargas
 *     responses:
 *       200:
 *         description: Lista de cargas
 * /api/Cargas/{id}/situacao:
 *   patch:
 *     summary: Atualizar situacao da carga
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               situacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Carga atualizada
 * /api/Cargas/{id}:
 *   put:
 *     summary: Atualizar carga
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destino:
 *                 type: string
 *               pesoMax:
 *                 type: number
 *               custoMin:
 *                 type: number
 *               previsaoSaida:
 *                 type: string
 *                 format: date-time
 *               situacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Carga atualizada
 */
import { Router } from 'express';
import { cargaController } from '../controllers/cargasController';

const router = Router();
router.post('/', cargaController.CreateCarga);
router.get('/', cargaController.ListarAbertas);
router.patch('/:id/situacao', cargaController.atualizarSitCarga);
router.put('/:id', cargaController.atualizarCargaCompleta)

export default router;