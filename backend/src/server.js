import app from './app.js';
import env from './config/env.js';
import prisma from './config/prisma.js';

let server;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    server = app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await prisma.$disconnect();
        console.log('Database disconnected cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('Error during database disconnect:', err.message);
        process.exit(1);
      }
    });
  } else {
    try {
      await prisma.$disconnect();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  }

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
