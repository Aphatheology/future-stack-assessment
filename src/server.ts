import app from './app';
import config from './config/env';
import logger from './config/logger';
import prisma from './config/prisma';
import redis from './config/redis';

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to the database');

    const server = app.listen(config.port, () => {
      logger.info(`Server running and listening on port ${config.port}`);
    });

    const shutdown = async () => {
      logger.info('Shutting down...');
      await prisma.$disconnect();
      logger.info('Database connection closed');
      await redis.quit();
      logger.info('Redis connection closed');

      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

startServer();
