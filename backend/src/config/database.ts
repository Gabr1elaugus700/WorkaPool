import 'dotenv-flow/config'

export const databaseConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5435'),
    database: process.env.DB_NAME || 'workapool_dev',
    username: process.env.DB_USER || 'dev_user',
    password: process.env.DB_PASSWORD || 'dev_password',
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'workapool',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  }
}

const env = process.env.NODE_ENV || 'development'
export const currentDbConfig = databaseConfig[env as keyof typeof databaseConfig]