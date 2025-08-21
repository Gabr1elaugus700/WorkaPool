/**
 * @openapi
 * /api/teste:
 *   get:
 *     summary: Testa conexao com o SQL Server
 *     responses:
 *       200:
 *         description: Conexao bem sucedida
 * /api/teste/all:
 *   get:
 *     summary: Testa todas as conexões
 *     responses:
 *       200:
 *         description: Status de todas as conexões
 */
import { Router } from 'express'
import { sqlPoolConnect, sqlPool } from '../database/sqlServer'
import { testDatabaseConnections } from '../utils/testConection'

const router = Router()

// Rota original - só SQL Server
router.get('/', async (req, res) => {
  try {
    await sqlPoolConnect
    const result = await sqlPool.request().query(`
      SELECT 1 AS resultado, 
             GETDATE() AS timestamp,
             @@SERVERNAME AS servidor,
             DB_NAME() AS database
    `)
    res.json({ 
      conectado: true, 
      dados: result.recordset[0],
      config: {
        servidor: process.env.DB_HOST,
        banco: process.env.DB_NAME,
        usuario: process.env.DB_USER
      }
    })
  } catch (err: any) {
    console.error('❌ Erro conexão SQL Server:', err.message)
    res.status(500).json({ 
      conectado: false, 
      erro: err.message,
      config: {
        servidor: process.env.DB_HOST || 'não configurado',
        usuario: process.env.DB_USER || 'não configurado',
        banco: process.env.DB_NAME || 'não configurado'
      }
    })
  }
})

// Testa todas as conexões
router.get('/all', async (req, res) => {
  try {
    console.log('🔍 Testando todas as conexões...')
    const connections = await testDatabaseConnections()
    
    // Log no console para debug
    console.log('📊 Resultado dos testes:')
    console.log(`🗄️  SQL Server: ${connections.sqlServer.status}`)
    if (!connections.sqlServer.connected) {
      console.log(`   ❌ Erro: ${connections.sqlServer.error}`)
    }
    console.log(`🗄️  PostgreSQL: ${connections.postgresql.status}`)
    if (!connections.postgresql.connected) {
      console.log(`   ❌ Erro: ${connections.postgresql.error}`)
    }
    
    const overallStatus = connections.sqlServer.connected && connections.postgresql.connected
      ? 'OK' 
      : connections.sqlServer.connected || connections.postgresql.connected 
        ? 'PARCIAL' 
        : 'ERRO'
    
    res.json({
      status: overallStatus,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      connections
    })
  } catch (err: any) {
    console.error('❌ Erro ao testar conexões:', err.message)
    res.status(500).json({ 
      status: 'ERRO',
      erro: err.message 
    })
  }
})

export default router