import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import apiV1Routes from './routes/index.js';
import { getHealth } from './modules/health/health.controller.js';
import notFoundMiddleware from './middleware/notFound.middleware.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors());
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
