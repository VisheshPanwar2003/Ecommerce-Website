import express from 'express';
import prisma from './config/prisma.js';

const app = express();

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'E-commerce API is running',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'E-commerce API is running',
      database: 'disconnected',
      error: error.message
    });
  }
});

export default app;
