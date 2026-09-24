import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import env from './config/env.js';
import apiV1Routes from './routes/index.js';
import { getHealth } from './modules/health/health.controller.js';
import notFoundMiddleware from './middleware/notFound.middleware.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

// Security and utility middleware
app.use(helmet());

const allowedOrigins = (env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, test scripts)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed for this origin'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());

// Compatibility route for root /health
app.get('/health', getHealth);

// Versioned API routes
app.use('/api/v1', apiV1Routes);

// 404 handler for unknown routes
app.use(notFoundMiddleware);

// Central error handler
app.use(errorMiddleware);

export default app;
