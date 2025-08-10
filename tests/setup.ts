import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import config from '../src/config/env';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import logger from '../src/config/logger';
import redis from '../src/config/redis';

const getTestDatabaseUrl = (): string => {
  const url = new URL(config.db.url);
  url.pathname = `/${process.env.TEST_DATABASE_NAME || 'test_shopping_cart_db'}`;
  return url.toString();
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getTestDatabaseUrl(),
    },
  },
});

beforeAll(async () => {
  try {
    logger.info('🔧 Setting up test database...');

    process.env.DATABASE_URL = getTestDatabaseUrl();
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: getTestDatabaseUrl() },
    });

    await prisma.$connect();
    logger.info('✅ Test database ready!');
  } catch (error) {
    logger.error('❌ Failed to setup test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    logger.info('🧹 Cleaning up test database...');

    // Clean up all data in correct order (respecting foreign keys)
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();

    logger.info('✅ Test database cleaned up!');
  } catch (error) {
    logger.error('❌ Failed to cleanup test database:', error);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
});

beforeEach(async () => {
  // Clean up all data in correct order (respecting foreign keys)
  await prisma.idempotencyKey.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
});

export { prisma };
