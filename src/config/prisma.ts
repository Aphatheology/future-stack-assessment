import { PrismaClient } from '@prisma/client';
import logger from './logger';
import config from './env';

const prisma = new PrismaClient({
  log: config.env === 'development' ? [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ] : [
    {
      emit: 'event',
      level: 'error',
    },
  ],
});

// Only log queries in development
if (config.env === 'development') {
  prisma.$on('query', async (e) => {
    // Clean up the query by removing database name and backticks
    const cleanQuery = e.query
      .replace(/`shopping_cart_db`\./g, '') // Remove database name
      .replace(/`/g, '') // Remove backticks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    logger.info(`SQL: ${cleanQuery}`);
    logger.info(`Params: ${e.params}`);
    logger.info(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', async (e) => {
  logger.error(`Prisma Error: ${e.message}`);
});

prisma.$on('info', async (e) => {
  logger.info(`Prisma Info: ${e.message}`);
});

prisma.$on('warn', async (e) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

export default prisma;