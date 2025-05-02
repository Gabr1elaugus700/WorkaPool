// backend/src/server.ts

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import clienteRoutes from './routes/clienteRoutes'
import testeConectionRoutes from './routes/testeConection'
import pedidosRoutes from './routes/pedidosRoutes'
import fatVenRoutes  from './routes/totalFatVendedorRoutes'

dotenv.config()

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Rotas
app.use('/api/clientes', clienteRoutes)
app.use('/api/teste', testeConectionRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/faturamento', fatVenRoutes)

// Iniciar servidor
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  // console.log(`🚀 Backend rodando em http://localhost:${PORT}`)
})

