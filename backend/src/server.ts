import { setupSwagger } from './swagger';
import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv';
import path from 'path';

// REMOVA ESTA LINHA: import './config/env'

// Configurar dotenv PRIMEIRO, antes de qualquer import que use variáveis de ambiente
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

// Carrega o arquivo .env do diretório raiz do backend
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

// Log para debug - CORRIGIDO
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 Carregando arquivo:', envFile);
console.log('🔧 PORT:', process.env.PORT);
console.log('🔧 DB_HOST:', process.env.DB_HOST);     // ← CORRIGIDO: era DB_SERVER
console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado');

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

// Rotas Power BI
import pbiMetasRoutes from './routes/pbiMetasRoutes';

import testConection from './routes/testeConection';

const app = express();
setupSwagger(app);

// CORS configurado para desenvolvimento e produção
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'http://localhost:5173',
      'http://192.168.0.32:5173', 
      'http://pooltecnica.no-ip.biz:5173',
    ]
  : [
      'http://localhost:5858',
      'http://192.168.0.32:5858',
      'http://127.0.0.1:5858',
    ];


console.log('🌐 CORS permitido para:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Permitir requisições sem origin

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('❌ CORS bloqueado para:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json())

// Rota básica para testar
app.get('/', (req, res) => {
  res.json({ 
    message: 'WorkaPool API funcionando!',
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    sqlServer: process.env.DB_HOST ? '✅ Configurado' : '❌ Não configurado',
    postgresql: process.env.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    environment: process.env.NODE_ENV,
    databases: {
      sqlServer: process.env.DB_HOST ? '✅ Configurado' : '❌ Não configurado',
      postgresql: process.env.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado'
    },
    timestamp: new Date().toISOString()
  });
});

// Rotas De consulta no banco de dados Sapiens
app.use('/api/clientes', clienteRoutes)
app.use('/api/teste', testConection)
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
app.use('/api/pbi-Metas', pbiMetasRoutes);

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor WorkaPool rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  // console.log(`🗄️  SQL Server: ${process.env.DB_HOST || 'Não configurado'}`);
  console.log(`🗄️  PostgreSQL: ${process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'}`);
});