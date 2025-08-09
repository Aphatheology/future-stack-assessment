import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import config from '../src/config/env';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import logger from '../src/config/logger';

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
      env: { ...process.env, DATABASE_URL: getTestDatabaseUrl() }
    });
    
    await prisma.$connect();
    logger.info('✅ Test database ready!');
  } catch (error) {
    logger.error('❌ Failed to setup test database:', error);
    throw error;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
});

export { prisma };