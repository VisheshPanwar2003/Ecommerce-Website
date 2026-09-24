import { PrismaClient } from '@prisma/client';
import env from './env.js';

const prisma = new PrismaClient(
  env.DATABASE_URL ? { datasources: { db: { url: env.DATABASE_URL } } } : undefined
);

export default prisma;
