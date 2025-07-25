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
import clientesInativos from './routes/clientesInativosRoutes'
import produtosEstoque from './routes/estoqueProdutosRoutes'

//Importando as rotas De Consulta no banco de dados Prisma
import criarCargas from './routes/criaCargas'
import metasRoutes from './routes/metasRoutes';
import caminhoes from './routes/caminhoesRoutes';

dotenv.config()

const app = express()
setupSwagger(app);
// Middlewares
// app.use(cors())

// Produção // 
// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://192.168.0.32:5173',
//   'http://pooltecnica.no-ip.biz:5173',
// ];


const allowedOrigins = [
  'http://localhost:5858',
  'http://192.168.0.32:5858',
  'http://192.168.0.32:3005',
  'http://pooltecnica.no-ip.biz:5173',
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

//Cargas 
app.use('/api/pedidosFechados', pedidosFechadosRoutes);
app.use('/api/pedidosEmCargas', pedidosCargasRoutes);
app.use('/api/pedidoToCarga', alteraPedidoCarga);

//Clientes Perdidos
app.use('/api/clientes-inativos', clientesInativos)

//Produtos Em Estoque (5)
app.use('/api/produtosEstoque', produtosEstoque)

// Rota de consultas Banco de dados Prisma
app.use('/api/auth', authRoutes);
app.use('/api/Cargas', criarCargas)
app.use('/api/caminhoes', caminhoes);

// Metas
app.use('/api/metas', metasRoutes)



// Rotas Power BI
import pbiMetasRoutes from './routes/pbiMetasRoutes';

app.use('/api/pbi-Metas', pbiMetasRoutes);
// Iniciar servidor
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend rodando em http://192.168.0.32:${PORT}`);
});

