import dotenv from 'dotenv'
import path from 'path'

// Determinar qual arquivo .env carregar baseado no NODE_ENV
const getEnvFile = () => {
  const nodeEnv = process.env.NODE_ENV || 'development'
  
  console.log(`🔧 NODE_ENV detectado: ${nodeEnv}`)
  
  switch (nodeEnv) {
    case 'production':
      return '.env.production'
    case 'development':
      return '.env.development'
    case 'test':
      return '.env.test'
    default:
      return '.env.development'
  }
}

const envFile = getEnvFile()
console.log(`📁 Tentando carregar: ${envFile}`)

const result = dotenv.config({ path: envFile })

if (result.error) {
  console.warn(`⚠️  Não foi possível carregar ${envFile}:`, result.error.message)
  console.log(`📁 Tentando carregar .env padrão...`)
  dotenv.config()
} else {
  console.log(`✅ Arquivo ${envFile} carregado com sucesso`)
}

console.log(`🔧 Ambiente final: ${process.env.NODE_ENV}`)
console.log(`📊 DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Carregado' : '❌ Não encontrado'}`)
console.log(`🗄️  DB_HOST: ${process.env.DB_HOST ? '✅ Carregado' : '❌ Não encontrado'}`)

// Validar variáveis críticas
const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD']

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Variável de ambiente obrigatória não encontrada: ${varName}`)
  }
})

export {} // Para tornar este arquivo um módulo