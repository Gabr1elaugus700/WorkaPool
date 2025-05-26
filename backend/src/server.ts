// backend/src/server.ts

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
// Importando as rotas De Consulta no banco de dados Sapiens
import clienteRoutes from './routes/clienteRoutes'
import testeConectionRoutes from './routes/testeConection'
import pedidosRoutes from './routes/pedidosRoutes'
import fatVenRoutes  from './routes/totalFatVendedorRoutes'
import rankingProdutosVendidos from './routes/rankingProdutosRoutes'
import productRoutes from './routes/produtosRoutes'
import vendedoresRoutes from './routes/vendedoresRoutes'
import pedidosFechadosRoutes from './routes/pedidosFechadosRoutes'
import authRoutes from './routes/authRoutes'


//Importando as rotas De Consulta no banco de dados Prisma
import criarCargas from './routes/criaCargas'

dotenv.config()

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Rotas De consulta no banco de dados Sapiens
app.use('/api/clientes', clienteRoutes)
app.use('/api/teste', testeConectionRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/faturamento', fatVenRoutes)
app.use('/api/rankingProdutos', rankingProdutosVendidos)
app.use('/api/produtos', productRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/pedidosFechados', pedidosFechadosRoutes);
app.use('/api/auth', authRoutes);

// Rota de consultas Banco de dados Prisma
app.use('/api/CriarCargas', criarCargas)

// Iniciar servidorp
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  // console.log(`🚀 Backend rodando em http://localhost:${PORT}`)
})

