require('dotenv').config({silent:true})

export default {
  APP_NAME: process.env.APP_NAME || 'cognicity-server',
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || '',
  AUTH0_SECRET: process.env.AUTH0_SECRET || '',
  BODY_LIMIT: process.env.BODY_LIMIT || '100kb',
  CACHE: process.env.CACHE === 'true' || false,
  COMPRESS: process.env.COMPRESS === 'true' || false,
  CORS: process.env.CORS === 'true' || false,
  CORS_HEADERS: process.env.CORS_HEADERS || ['Link'],
  DB_HOSTNAME: process.env.DB_HOSTNAME || '127.0.0.1',
  DB_NAME: process.env.DB_NAME || 'cognicity',
  DB_PASSWORD: process.env.DB_PASSWORD || 'p@ssw0rd',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_SSL: process.env.DB_SSL === 'true' || true,
  DB_TIMEOUT: process.env.DB_TIMEOUT || 5000,
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  INFRASTRUCTURE_TYPES: (process.env.INFRASTRUCTURE_TYPES || 'floodgates,pumps,waterways').split(','),
  LOG_CONSOLE: process.env.LOG_CONSOLE === 'true' || false,
  LOG_DIR: process.env.LOG_DIR || '',
  LOG_JSON: process.env.LOG_JSON === 'true' || false,
  LOG_LEVEL: process.env.LOG_LEVEL || 'error',
  LOG_MAX_FILE_SIZE: process.env.LOG_MAX_FILE_SIZE || 1024 * 1024 * 100,
  LOG_MAX_FILES: process.env.LOG_MAX_FILES || 10,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8001,
  REGION_CODES: (process.env.REGION_CODES || 'jbd,bdg,sby').split(','),
  RESPONSE_TIME: process.env.RESPONSE_TIME === 'true' || true,
}
