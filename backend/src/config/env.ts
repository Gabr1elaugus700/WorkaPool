import dotenv from 'dotenv'

// Configurar dotenv uma única vez
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env'
dotenv.config({ path: envFile })

// Forçar .env.development se NODE_ENV não estiver definido
if (!process.env.NODE_ENV) {
  dotenv.config({ path: '.env.development' })
}

export {} // Para tornar este arquivo um módulo