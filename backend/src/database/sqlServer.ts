import sql from 'mssql'
import dotenv from 'dotenv'
dotenv.config()

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST as string,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,      // true se usar SSL
    trustServerCertificate: true
  }
}

export const sqlPool = new sql.ConnectionPool(config)

// Só inicia conexão se não estiver em ambiente de teste
// Isso evita promises pendentes nos testes unitários
const isTestEnvironment = process.env.NODE_ENV === 'test' || !process.env.DB_HOST;
export const sqlPoolConnect = isTestEnvironment 
  ? Promise.resolve(sqlPool)  // Mock resolve para testes
  : sqlPool.connect()
