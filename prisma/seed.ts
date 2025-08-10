import {
  generateUserId,
  generateCategoryId,
  generateProductId,
} from '../src/utils/id-generator.service';
import { SkuHelper } from '../src/utils/sku-helper';
import { hashPassword } from '../src/utils/password';
import logger from '../src/config/logger';
import { NGNCurrencyUtils } from '../src/utils/ngn-currency';
import prisma from '../src/config/prisma';
import { Category, User } from '@prisma/client';

const skuHelper = new SkuHelper(prisma);

async function seedProducts(
  electronics: Category,
  clothing: Category,
  books: Category,
  user1: User,
  user2: User
) {
  const skus = await Promise.all([
    skuHelper.generateProductSku(electronics.id, user1.id),
    skuHelper.generateProductSku(electronics.id, user1.id),
    skuHelper.generateProductSku(clothing.id, user1.id),
    skuHelper.generateProductSku(clothing.id, user1.id),
    skuHelper.generateProductSku(books.id, user2.id),
    skuHelper.generateProductSku(books.id, user2.id),
  ]);

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: skus[0] },
      update: {},
      create: {
        id: generateProductId(),
        sku: skus[0],
        name: 'MacBook Pro 13"',
        description: 'Apple MacBook Pro with M2 chip, 8GB RAM, 256GB SSD',
        price: 1299.99,
        unitPrice: NGNCurrencyUtils.nairaToKobo(1299.99),
        stockLevel: 15,
        categoryId: electronics.id,
        createdBy: user1.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: skus[1] },
      update: {},
      create: {
        id: generateProductId(),
        sku: skus[1],
        name: 'iPhone 15 Pro',
        description: 'Apple iPhone 15 Pro with A17 Pro chip, 128GB storage',
        price: 999.99,
        unitPrice: NGNCurrencyUtils.nairaToKobo(999.99),
        stockLevel: 25,
        categoryId: electronics.id,
        createdBy: user1.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: skus[2] },
      update: {},
      create: {
        id: generateProductId(),
        sku: skus[2],
        name: 'Cotton T-Shirt',
        description: 'Premium cotton t-shirt, available in multiple colors',
        price: 24.99,
        unitPrice: NGNCurrencyUtils.nairaToKobo(24.99),
        stockLevel: 100,
        categoryId: clothing.id,
        createdBy: user1.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: skus[3] },
      update: {},
      create: {
        id: generateProductId(),
        sku: skus[3],
        name: 'Slim Fit Jeans',
        description: 'Comfortable slim fit jeans, available in blue and black',
        price: 59.99,
        unitPrice: NGNCurrencyUtils.nairaToKobo(59.99),
        stockLevel: 50,
        categoryId: clothing.id,
        createdBy: user1.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: skus[4] },
      update: {},
      create: {
        id: generateProductId(),
        sku: skus[4],
        name: 'Clean Code',
        description:
          'A Handbook of Agile Software Craftsmanship by Robert C. Martin',
        price: 39.99,
        unitPrice: NGNCurrencyUtils.nairaToKobo(39.99),
        stockLevel: 30,
        categoryId: books.id,
        createdBy: user2.id,
      },
    }),
    prisma.product.upsert({
      where: { sku: skus[5] },
      update: {},
      create: {
        id: generateProductId(),
        sku: skus[5],
        name: 'Design Patterns',
        description: 'Elements of Reusable Object-Oriented Software',
        price: 49.99,
        unitPrice: NGNCurrencyUtils.nairaToKobo(49.99),
        stockLevel: 20,
        categoryId: books.id,
        createdBy: user2.id,
      },
    }),
  ]);

  logger.info(
    '✅ Products created: %o',
    products.map(p => ({ name: p.name, price: p.price }))
  );
}

async function main() {
  logger.info('🌱 Starting database seeding...');

  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      id: generateUserId(),
      email: 'john.doe@example.com',
      name: 'John Doe',
      password: await hashPassword('P@ssword123!'),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      id: generateUserId(),
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      password: await hashPassword('P@ssword123!'),
    },
  });

  logger.info('✅ Users created: %o', { user1: user1.name, user2: user2.name });

  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      id: generateCategoryId(),
      name: 'Electronics',
    },
  });

  const clothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: {
      id: generateCategoryId(),
      name: 'Clothing',
    },
  });

  const books = await prisma.category.upsert({
    where: { name: 'Books' },
    update: {},
    create: {
      id: generateCategoryId(),
      name: 'Books',
    },
  });

  logger.info('✅ Categories created: %o', {
    electronics: electronics.name,
    clothing: clothing.name,
    books: books.name,
  });

  await seedProducts(electronics, clothing, books, user1, user2);

  logger.info('🎉 Database seeding completed successfully!');
}

main()
  .catch(e => {
    logger.error('❌ Error during seeding: %o', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
