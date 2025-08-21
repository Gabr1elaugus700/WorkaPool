import dotenv from 'dotenv'
import path from 'path'

// Detecta ambiente pelo script executado ou usa padrão
const isDevelopment = process.argv.includes('--dev') || process.env.npm_lifecycle_event === 'dev'
const envFile = isDevelopment ? '.env.development' : '.env.production'

// Carrega arquivo específico
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

console.log(`🌐 Carregando: ${envFile}`)
console.log(`🔗 Porta: ${process.env.PORT}`)
console.log(`🗄️  Database: ${process.env.DATABASE_URL?.split('@')[1] || 'not set'}`) // Oculta senha

export default {
  port: process.env.PORT || '3000',
  database: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}