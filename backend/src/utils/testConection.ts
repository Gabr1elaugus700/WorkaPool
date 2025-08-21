import { sqlPool, sqlPoolConnect } from '../database/sqlServer';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface ConnectionStatus {
  connected: boolean;
  status: string;
  error?: string;
  details?: any;
}

export interface DatabaseConnections {
  sqlServer: ConnectionStatus;
  postgresql: ConnectionStatus;
}

// Teste conexão SQL Server
async function testSqlServerConnection(): Promise<ConnectionStatus> {
  try {
    await sqlPoolConnect;
    const result = await sqlPool.request().query('SELECT 1 AS test, GETDATE() AS timestamp');
    
    return {
      connected: true,
      status: '✅ Conectado',
      details: {
        server: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        timestamp: result.recordset[0]?.timestamp
      }
    };
  } catch (error: any) {
    return {
      connected: false,
      status: '❌ Erro de conexão',
      error: error.message,
      details: {
        server: process.env.DB_HOST || 'não configurado',
        database: process.env.DB_NAME || 'não configurado',
        user: process.env.DB_USER || 'não configurado'
      }
    };
  }
}

// Teste conexão PostgreSQL (Prisma)
async function testPostgresConnection(): Promise<ConnectionStatus> {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
    
    return {
      connected: true,
      status: '✅ Conectado',
      details: {
        url: process.env.DATABASE_URL ? 'configurado' : 'não configurado',
        timestamp: Array.isArray(result) ? result[0] : result
      }
    };
  } catch (error: any) {
    return {
      connected: false,
      status: '❌ Erro de conexão',
      error: error.message,
      details: {
        url: process.env.DATABASE_URL ? 'configurado' : 'não configurado'
      }
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Testa todas as conexões
export async function testDatabaseConnections(): Promise<DatabaseConnections> {
  console.log('🔍 Iniciando testes de conexão...');
  
  const [sqlServer, postgresql] = await Promise.all([
    testSqlServerConnection(),
    testPostgresConnection()
  ]);

  return {
    sqlServer,
    postgresql
  };
}

// Para usar isoladamente
export { testSqlServerConnection, testPostgresConnection };