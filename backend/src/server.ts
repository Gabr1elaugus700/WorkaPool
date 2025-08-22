// PRIMEIRO: Configurar variáveis de ambiente
import './config/env'

// DEPOIS: Importar tudo o resto
import { setupSwagger } from './swagger';
import express from 'express'
import cors from 'cors'

// Importando as rotas De Consulta no banco de dados Sapiens
import clienteRoutes from './routes/clienteRoutes'
import testeConectionRoutes from './routes/testeConection'
import pedidosRoutes from './routes/pedidosRoutes'
import fatVenRoutes from './routes/totalFatVendedorRoutes'
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
import parametrosGlobaisFretes from './routes/parametrosFretesRoutes';
import fretesRoutes from './routes/fretesRoutes';

console.log('🧪 DATABASE_URL carregado:', process.env.DATABASE_URL)

const app = express()
setupSwagger(app);
// Middlewares
// app.use(cors())


const allowedOrigins = [
  'http://localhost:5858',
  'http://192.168.0.32:5858',
  'http://192.168.0.32:3005',
  'http://pooltecnica.no-ip.biz:5173',
  'http://localhost:5173',
  'http://192.168.0.32:5173',
  'http://pooltecnica.no-ip.biz:5173',
];


app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Permitir requisições sem origin (Postman, curl)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`❌ CORS bloqueado para: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3005,
    timestamp: new Date().toISOString() 
  })
})


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
app.use('/api/parametrosFretes', parametrosGlobaisFretes);

app.use('/api/fretes', fretesRoutes)

// Metas
app.use('/api/metas', metasRoutes)


// Rotas Power BI
import pbiMetasRoutes from './routes/pbiMetasRoutes';

app.use('/api/pbi-Metas', pbiMetasRoutes);
// Iniciar servidor
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro no servidor:', error.message)
  
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    })
  } else {
    res.status(500).json({ 
      error: 'Internal Server Error' 
    })
  }
})

// 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ 
//     error: 'Endpoint not found',
//     path: req.path
//   })
// })

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3005; // Porta padrão para produção: 3005

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend rodando em modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Servidor: http://192.168.0.32:${PORT}`);
  console.log(`📚 Swagger: http://192.168.0.32:${PORT}/api-docs`);
  console.log(`❤️  Health Check: http://192.168.0.32:${PORT}/health`);
});