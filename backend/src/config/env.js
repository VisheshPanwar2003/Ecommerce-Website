import 'dotenv/config';

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT) || 5000;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!DATABASE_URL && NODE_ENV !== 'test') {
  console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
}

if (!JWT_SECRET && NODE_ENV !== 'test') {
  console.error('CRITICAL: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

export const env = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test'
};

export default env;
