// backend/src/server.ts
import { setupSwagger } from './swagger';
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
import pedidosCargasRoutes from './routes/pedidosCargasRoutes'
import alteraPedidoCarga from './routes/alteraPedidoCagasRoutes'

//Importando as rotas De Consulta no banco de dados Prisma
import criarCargas from './routes/criaCargas'

dotenv.config()

const app = express()
setupSwagger(app);
// Middlewares
// app.use(cors())
// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://192.168.0.32:5173',
//   'http://pooltecnica.no-ip.biz:5173',
// ];


const allowedOrigins = [
  'http://localhost:5858',
  'http://192.168.0.32:5858',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Permitir requisições sem origin (como curl/teste)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('CORS bloqueado para:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

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
app.use('/api/pedidosEmCargas', pedidosCargasRoutes);
app.use('/api/pedidoToCarga', alteraPedidoCarga);

// Rota de consultas Banco de dados Prisma
app.use('/api/auth', authRoutes);
app.use('/api/Cargas', criarCargas)

// Iniciar servidorp
const PORT = Number(process.env.PORT) || 3005;

app.listen(PORT, '0.0.0.0', () => {
  // console.log(`🚀 Backend rodando em http://0.0.0.0:${PORT}`);
});

