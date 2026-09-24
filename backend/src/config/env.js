import 'dotenv/config';

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT) || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && NODE_ENV !== 'test') {
  console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
}

export const env = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test'
};

export default env;
