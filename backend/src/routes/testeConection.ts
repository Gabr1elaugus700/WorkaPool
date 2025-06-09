/**
 * @openapi
 * /api/teste:
 *   get:
 *     summary: Testa conexao com o banco
 *     responses:
 *       200:
 *         description: Conexao bem sucedida
 */
import { Router } from 'express'
import { sqlPoolConnect, sqlPool } from '../database/sqlServer'

const router = Router()

router.get('/', async (req, res) => {
  try {
    await sqlPoolConnect
    const result = await sqlPool.request().query('SELECT 1 AS resultado')
    res.json({ conectado: true, resultado: result.recordset })
  } catch (err) {
    res.status(500).json({ conectado: false, erro: err })
  }
})

export default router
