import prisma from '../src/config/prisma.js';

// Enforce test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/ecommerce_test?schema=public';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'e9a2b8c5f4d1e7a3b6c8d2e5f1a4b7c9e2d5f8a1b4c7d0e3f6a9b2c5d8e1f4a7';

// Strict safeguard: NEVER run tests against a development or production database
const activeUrl = process.env.DATABASE_URL || '';
if (!activeUrl.includes('test') && !activeUrl.includes('ecommerce_test')) {
  throw new Error(
    `[CRITICAL SAFETY CHECK FAILED]: Test suite is attempting to connect to non-test database: ${activeUrl}. Refusing to proceed.`
  );
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
