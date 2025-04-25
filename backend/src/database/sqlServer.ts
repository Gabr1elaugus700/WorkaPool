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
export const sqlPoolConnect = sqlPool.connect()
