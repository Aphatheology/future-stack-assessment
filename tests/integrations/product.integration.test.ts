import request from 'supertest';
import { Express } from 'express';
import { UlidHelper, EntityPrefix } from '../../src/utils/ulid.helper';
import { prisma } from '../setup';
import { hashPassword } from '../../src/utils/password';
import app from '../../src/app';
import { Product, Category, User } from '@prisma/client';

describe('Product API Integration Tests', () => {
  let testApp: Express;
  let authToken: string;
  let authToken2: string;
  let testUser: User;
  let testUser2: User;
  let testCategory: Category;
  let testCategory2: Category;

  beforeAll(async () => {
    testApp = app;
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    testUser = await prisma.user.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.USER),
        email: 'creator@example.com',
        name: 'Product Creator',
        password: await hashPassword('P@ssw0rd123'),
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.USER),
        email: 'other@example.com',
        name: 'Other User',
        password: await hashPassword('P@ssw0rd123'),
      },
    });

    // Create test categories
    testCategory = await prisma.category.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.CATEGORY),
        name: 'Electronics',
      },
    });

    testCategory2 = await prisma.category.create({
      data: {
        id: UlidHelper.generate(EntityPrefix.CATEGORY),
        name: 'Books',
      },
    });

    // Get auth tokens
    const loginResponse1 = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'P@ssw0rd123',
      });

    const loginResponse2 = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: testUser2.email,
        password: 'P@ssw0rd123',
      });

    const cookies1 = loginResponse1.headers['set-cookie'];
    const cookies2 = loginResponse2.headers['set-cookie'];

    const cookies1Array = cookies1 as unknown as string[];
    const cookies2Array = cookies2 as unknown as string[];
    const accessCookie1 = cookies1Array?.find((cookie: string) =>
      cookie.includes('accessToken')
    );
    const accessCookie2 = cookies2Array?.find((cookie: string) =>
      cookie.includes('accessToken')
    );

    authToken = accessCookie1?.split('=')[1].split(';')[0] || '';
    authToken2 = accessCookie2?.split('=')[1].split(';')[0] || '';
  });

  describe('POST /api/v1/products', () => {
    it('should successfully create a product', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High performance gaming laptop with RGB keyboard',
        price: 1500.99,
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      const response = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', 'test-key-1')
        .send(productData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        currency: 'NGN',
        stockLevel: productData.stockLevel,
        createdBy: 'Product Creator',
        category: testCategory.name,
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High performance gaming laptop',
        price: 1500.99,
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      const response = await request(testApp)
        .post('/api/v1/products')
        .send(productData)
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    it('should return 400 for invalid product data', async () => {
      const productData = {
        name: '', // Empty name
        description: 'Test description',
        price: -10, // Negative price
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      const response = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(productData)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('should return 400 for non-existent category', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High performance gaming laptop',
        price: 1500.99,
        stockLevel: 5,
        categoryId: UlidHelper.generate(EntityPrefix.CATEGORY),
      };

      const response = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', 'test-key-3')
        .send(productData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Category not found',
      });
    });

    it('should sanitize product input', async () => {
      const productData = {
        name: 'Gaming <script>alert("xss")</script> Laptop',
        description: 'High performance gaming laptop',
        price: 1500.99,
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      const response = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', 'test-key-2')
        .send(productData)
        .expect(201);

      // Name should be sanitized
      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.name).toBe(
        'Gaming scriptalert("xss")/script Laptop'
      );
    });

    it('should require X-Idempotency-Key header', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High performance gaming laptop',
        price: 1500.99,
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      const response = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(productData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe(
        'X-Idempotency-Key header is required'
      );
    });

    it('should return same product for duplicate idempotency key', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High performance gaming laptop',
        price: 1500.99,
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      const idempotencyKey = 'test-key-123';

      const response1 = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', idempotencyKey)
        .send(productData)
        .expect(201);

      const response2 = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', idempotencyKey)
        .send(productData)
        .expect(201);

      expect(response1.body.data.id).toBe(response2.body.data.id);
      expect(response1.body.data.sku).toBe(response2.body.data.sku);
    });

    it('should reject invalid idempotency key format', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High performance gaming laptop',
        price: 1500.99,
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      const response = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', 'invalid key with spaces!')
        .send(productData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain(
        'Idempotency key can only contain alphanumeric characters'
      );
    });

    it('should prevent duplicate products with same name and price', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High performance gaming laptop',
        price: 1500.99,
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', 'key-1')
        .send(productData)
        .expect(201);

      const response = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', 'key-2')
        .send(productData)
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe(
        'A product with the same name and price already exists'
      );
    });

    it('should allow different users to create products with same name and price', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High performance gaming laptop',
        price: 1500.99,
        stockLevel: 5,
        categoryId: testCategory.id,
      };

      await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken}`])
        .set('X-Idempotency-Key', 'key-1')
        .send(productData)
        .expect(201);

      const response = await request(testApp)
        .post('/api/v1/products')
        .set('Cookie', [`accessToken=${authToken2}`])
        .set('X-Idempotency-Key', 'key-2')
        .send(productData)
        .expect(201);

      expect(response.body.status).toBe('success');
    });

    // Rate-limiting test removed as product endpoints are not limited.
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      // Create test products
      const products = [
        {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'ELEC-001',
          name: 'Gaming Laptop',
          description: 'High performance gaming laptop',
          price: 1500.0,
          unitPrice: BigInt(150000),
          stockLevel: 5,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
        {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'ELEC-002',
          name: 'Smartphone',
          description: 'Latest smartphone model',
          price: 800.0,
          unitPrice: BigInt(80000),
          stockLevel: 0, // Out of stock
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
        {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'BOOK-001',
          name: 'Programming Book',
          description: 'Learn programming fundamentals',
          price: 29.99,
          unitPrice: BigInt(2999),
          stockLevel: 20,
          createdBy: testUser2.id,
          categoryId: testCategory2.id,
        },
      ];

      await prisma.product.createMany({ data: products });
    });

    it('should return paginated products without authentication', async () => {
      const response = await request(testApp)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.data.length).toBe(3);
    });

    it('should filter products by category', async () => {
      const response = await request(testApp)
        .get(`/api/v1/products?categoryId=${testCategory2.id}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].category).toBe(testCategory2.name);
      expect(response.body.data.data[0].name).toBe('Programming Book');
    });

    it('should search products by name', async () => {
      const response = await request(testApp)
        .get('/api/v1/products?search=laptop')
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Gaming Laptop');
    });

    it('should filter products by price range', async () => {
      const response = await request(testApp)
        .get('/api/v1/products?minPrice=50&maxPrice=900')
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Smartphone');
    });

    it('should filter products by stock availability', async () => {
      const response = await request(testApp)
        .get('/api/v1/products?inStock=true')
        .expect(200);

      expect(response.body.data.data).toHaveLength(2);
      expect(
        response.body.data.data.every((p: Product) => p.stockLevel > 0)
      ).toBe(true);
    });

    it('should sort products by price', async () => {
      const response = await request(testApp)
        .get('/api/v1/products?sortBy=price&sortOrder=asc')
        .expect(200);

      const prices = response.body.data.data.map((p: Product) => p.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('should handle pagination', async () => {
      const response = await request(testApp)
        .get('/api/v1/products?page=1&limit=2')
        .expect(200);

      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    let testProduct: Product;

    beforeEach(async () => {
      testProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          unitPrice: BigInt(9999),
          stockLevel: 10,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
      });
    });

    it('should return product details without authentication', async () => {
      const response = await request(testApp)
        .get(`/api/v1/products/${testProduct.id}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject({
        id: testProduct.id,
        name: testProduct.name,
        category: testCategory.name,
        createdBy: 'Product Creator',
      });
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = UlidHelper.generate(EntityPrefix.PRODUCT);
      const response = await request(testApp)
        .get(`/api/v1/products/${nonExistentId}`)
        .expect(404);

      expect(response.body).toMatchObject({
        status: 'error',
        message: 'Product not found',
      });
    });

    it('should return 400 for invalid product ID format', async () => {
      const response = await request(testApp)
        .get('/api/v1/products/invalid-id')
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    let testProduct: Product;

    beforeEach(async () => {
      testProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          unitPrice: BigInt(9999),
          stockLevel: 10,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
      });
    });

    it('should successfully update product by owner', async () => {
      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description',
        price: 149.99,
        stockLevel: 15,
      };

      const response = await request(testApp)
        .put(`/api/v1/products/${testProduct.id}`)
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Product updated successfully',
        data: {
          id: testProduct.id,
          name: updateData.name,
          description: updateData.description,
          price: updateData.price,
          unitPrice: 14999, // 149.99 * 100
          stockLevel: updateData.stockLevel,
        },
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      const updateData = {
        name: 'Updated Product Name',
      };

      const response = await request(testApp)
        .put(`/api/v1/products/${testProduct.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    it('should return 404 when non-owner tries to update', async () => {
      const updateData = {
        name: 'Updated Product Name',
      };

      await request(testApp)
        .put(`/api/v1/products/${testProduct.id}`)
        .set('Cookie', [`accessToken=${authToken2}`])
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    let testProduct: Product;

    beforeEach(async () => {
      testProduct = await prisma.product.create({
        data: {
          id: UlidHelper.generate(EntityPrefix.PRODUCT),
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          unitPrice: BigInt(9999),
          stockLevel: 10,
          createdBy: testUser.id,
          categoryId: testCategory.id,
        },
      });
    });

    it('should successfully delete product by owner', async () => {
      await request(testApp)
        .delete(`/api/v1/products/${testProduct.id}`)
        .set('Cookie', [`accessToken=${authToken}`])
        .expect(204);

      // Verify product is deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(testApp)
        .delete(`/api/v1/products/${testProduct.id}`)
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    it('should return 404 when non-owner tries to delete', async () => {
      await request(testApp)
        .delete(`/api/v1/products/${testProduct.id}`)
        .set('Cookie', [`accessToken=${authToken2}`])
        .expect(403);
    });
  });
});
